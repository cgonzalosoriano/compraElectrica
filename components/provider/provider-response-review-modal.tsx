
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, MessageSquare, AlertCircle, Building2, DollarSign, Calendar, Zap, Factory, Check } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProviderResponseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteResponseId: string;
  onResponseUpdated?: () => void;
}

export default function ProviderResponseReviewModal({
  isOpen,
  onClose,
  quoteResponseId,
  onResponseUpdated,
}: ProviderResponseReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [clauses, setClauses] = useState<any[]>([]);
  const [providerActions, setProviderActions] = useState<Record<string, { action: string; negotiation?: string }>>({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [quoteResponse, setQuoteResponse] = useState<any>(null);
  const [hasClientNegotiations, setHasClientNegotiations] = useState(false);

  useEffect(() => {
    if (isOpen && quoteResponseId) {
      fetchClausesAndReview();
    }
  }, [isOpen, quoteResponseId]);

  const fetchClausesAndReview = async () => {
    try {
      setLoading(true);
      
      // Obtener las cláusulas con las respuestas del cliente
      const clausesResponse = await fetch(`/api/quote-responses/${quoteResponseId}/clauses-comparison`);
      
      if (!clausesResponse.ok) {
        throw new Error('Error al cargar las cláusulas');
      }

      const clausesData = await clausesResponse.json();
      const clausesList = clausesData.clauses || [];
      setClauses(clausesList);
      
      // Verificar si hay negociaciones del cliente
      const hasNegotiations = clausesList.some((c: any) => c.clientAction === 'NEGOTIATE' || c.clientAction === 'REJECT');
      setHasClientNegotiations(hasNegotiations);
      
      // Cargar las respuestas previas del proveedor si existen
      const actionsMap: Record<string, { action: string; negotiation?: string }> = {};
      clausesList.forEach((clause: any) => {
        if (clause.providerCounterAction) {
          actionsMap[clause.id] = {
            action: clause.providerCounterAction,
            negotiation: clause.providerCounterNegotiation,
          };
        }
      });
      setProviderActions(actionsMap);

      // Obtener los detalles de la respuesta
      const responseRes = await fetch(`/api/quote-responses?id=${quoteResponseId}`);
      if (responseRes.ok) {
        const responseData = await responseRes.json();
        setQuoteResponse(responseData.responses?.[0]);
      }
      
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al cargar los detalles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  const handleProviderAction = (clauseId: string, action: string, negotiation?: string) => {
    setProviderActions(prev => ({
      ...prev,
      [clauseId]: { action, negotiation },
    }));
  };

  const handleSaveResponse = async () => {
    try {
      setLoading(true);

      // Filtrar solo las cláusulas que requieren respuesta (negociadas o rechazadas por el cliente)
      const clausesNeedingResponse = clauses.filter(c => 
        c.clientAction === 'NEGOTIATE' || c.clientAction === 'REJECT'
      );

      // Validar que todas las cláusulas que necesitan respuesta tengan una acción
      const allResponded = clausesNeedingResponse.every(c => providerActions[c.id]);
      
      if (!allResponded) {
        showAlert('Debes responder a todas las negociaciones y rechazos del cliente', 'error');
        return;
      }

      // Validar que las negociaciones tengan texto
      for (const [clauseId, action] of Object.entries(providerActions)) {
        if (action.action === 'NEGOTIATE' && !action.negotiation?.trim()) {
          showAlert('Debes especificar tu contrapropuesta en las cláusulas que deseas negociar', 'error');
          return;
        }
      }

      const response = await fetch(`/api/quote-responses/${quoteResponseId}/provider-counter-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerActions }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la respuesta');
      }

      showAlert('Respuesta guardada exitosamente', 'success');
      
      // Recargar los datos
      await fetchClausesAndReview();
      
      if (onResponseUpdated) {
        onResponseUpdated();
      }
      
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al guardar la respuesta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getClauseIcon = (action?: string) => {
    switch (action) {
      case 'ACCEPT':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'NEGOTIATE':
        return <MessageSquare className="h-5 w-5 text-orange-600" />;
      case 'REJECT':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getClauseLabel = (originalClause: any): string => {
    if (originalClause.clauseName.toLowerCase().includes('precio') && originalClause.clauseName.toLowerCase().includes('energía')) {
      return 'Precio de Energía';
    }
    if (originalClause.clauseName.toLowerCase().includes('precio') && originalClause.clauseName.toLowerCase().includes('potencia')) {
      return 'Precio de Potencia';
    }
    if (originalClause.clauseName.toLowerCase().includes('plazo')) {
      return 'Plazo del Contrato';
    }
    if (originalClause.clauseName.toLowerCase().includes('pago')) {
      return 'Condiciones de Pago';
    }
    if (originalClause.clauseName.toLowerCase().includes('garantía')) {
      return 'Garantías';
    }
    if (originalClause.clauseName.toLowerCase().includes('fuente') || originalClause.clauseName.toLowerCase().includes('generación')) {
      return 'Fuente de Generación';
    }
    if (originalClause.clauseName.toLowerCase().includes('nodo')) {
      return 'Nodo de Entrega';
    }
    return originalClause.clauseName;
  };

  const getProviderProposal = (clause: any): string => {
    if (clause.providerAction === 'ACCEPT') {
      return clause.originalClause?.clauseDescription || 'Acepta condición del cliente';
    }
    if (clause.providerAction === 'NEGOTIATE' && clause.providerNegotiation) {
      return clause.providerNegotiation;
    }
    return 'Sin propuesta';
  };

  const getClientResponse = (clause: any): string => {
    if (clause.clientAction === 'ACCEPT') {
      return 'Cliente acepta tu propuesta';
    }
    if (clause.clientAction === 'NEGOTIATE' && clause.clientNegotiation) {
      return clause.clientNegotiation;
    }
    if (clause.clientAction === 'REJECT') {
      return 'Cliente rechaza esta cláusula';
    }
    return 'Cliente no ha respondido';
  };

  const needsProviderResponse = (clause: any): boolean => {
    // Si el proveedor ya aceptó, no necesita responder de nuevo
    if (clause.providerCounterAction === 'ACCEPT') {
      return false;
    }
    return clause.clientAction === 'NEGOTIATE' || clause.clientAction === 'REJECT';
  };

  const isMutuallyAccepted = (clause: any): boolean => {
    // Caso 1: Cliente acepta la propuesta del proveedor
    if (clause.clientAction === 'ACCEPT') {
      return true;
    }
    // Caso 2: Cliente negocia y proveedor acepta la contrapropuesta
    if (clause.clientAction === 'NEGOTIATE' && clause.providerCounterAction === 'ACCEPT') {
      return true;
    }
    return false;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Factory className="h-6 w-6 text-blue-600" />
              <span>Revisión de Negociaciones</span>
            </DialogTitle>
            <DialogDescription>
              Revisa las respuestas del cliente a tu oferta
            </DialogDescription>
          </DialogHeader>

          {loading && !clauses.length ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
              <div className="space-y-6">
                {/* Resumen de precios */}
                {quoteResponse && (
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                        Tu Oferta Original
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <Zap className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-gray-600">Precio Energía</span>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            ${quoteResponse.energyPricePerMWh?.toFixed(2)}/MWh
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <Factory className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-gray-600">Precio Potencia</span>
                          </div>
                          <p className="text-lg font-bold text-purple-600">
                            ${quoteResponse.powerPricePerKW?.toFixed(2)}/kW-mes
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-gray-600">Total Estimado</span>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            ${quoteResponse.totalEstimated?.toLocaleString('es-AR') || 'N/A'}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <Factory className="h-4 w-4 text-orange-600" />
                            <span className="text-xs text-gray-600">Fuente</span>
                          </div>
                          <p className="text-sm font-medium text-orange-600">
                            {quoteResponse.generationSource || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Estado de negociaciones */}
                {hasClientNegotiations ? (
                  <Card className="border-2 bg-orange-50 border-orange-300">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-orange-100 rounded-full p-2">
                          <MessageSquare className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-orange-900">Cliente ha solicitado negociaciones</h3>
                          <p className="text-sm text-orange-700">Revisa cada cláusula y responde a las propuestas del cliente</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 bg-green-50 border-green-300">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 rounded-full p-2">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-900">Cliente ha aceptado todas las cláusulas</h3>
                          <p className="text-sm text-green-700">No se requiere ninguna acción adicional</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comparación de cláusulas */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                    Respuestas del Cliente a tus Propuestas
                  </h3>

                  {clauses.map((clause, index) => {
                    const mutuallyAccepted = isMutuallyAccepted(clause);
                    return (
                    <Card key={clause.id} className={`border-2 ${
                      mutuallyAccepted ? 'border-green-300 bg-green-50' :
                      clause.clientAction === 'NEGOTIATE' ? 'border-orange-200 bg-orange-50' :
                      clause.clientAction === 'REJECT' ? 'border-red-200 bg-red-50' :
                      'border-gray-200'
                    }`}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Header de la cláusula */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`${mutuallyAccepted ? 'bg-green-100' : 'bg-blue-100'} rounded-full p-2`}>
                                <span className={`font-bold ${mutuallyAccepted ? 'text-green-600' : 'text-blue-600'}`}>{index + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-lg">{getClauseLabel(clause.originalClause)}</h4>
                                {clause.originalClause?.isRequired && (
                                  <Badge variant="destructive" className="mt-1">Obligatoria</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {mutuallyAccepted ? (
                                <Badge className="bg-green-500 text-white flex items-center space-x-1">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Aceptada por ambos</span>
                                </Badge>
                              ) : (
                                getClauseIcon(clause.clientAction)
                              )}
                            </div>
                          </div>

                          <Separator />

                          {/* Comparación lado a lado */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Lo que solicitó el cliente originalmente */}
                            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="bg-gray-200 rounded-full p-1">
                                  <Building2 className="h-4 w-4 text-gray-600" />
                                </div>
                                <h5 className="font-semibold text-sm text-gray-700">Solicitud original del cliente:</h5>
                              </div>
                              <p className="text-sm text-gray-800">
                                {clause.originalClause?.clauseDescription || 'Sin especificación'}
                              </p>
                            </div>

                            {/* Tu propuesta inicial */}
                            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="bg-blue-200 rounded-full p-1">
                                  <Factory className="h-4 w-4 text-blue-600" />
                                </div>
                                <h5 className="font-semibold text-sm text-blue-900">Tu propuesta inicial:</h5>
                              </div>
                              <p className="text-sm font-medium text-blue-800">
                                {getProviderProposal(clause)}
                              </p>
                            </div>
                          </div>

                          {/* Respuesta del cliente */}
                          <div className={`rounded-lg p-4 border-2 ${
                            mutuallyAccepted ? 'bg-green-50 border-green-300' :
                            clause.clientAction === 'NEGOTIATE' ? 'bg-orange-50 border-orange-300' :
                            clause.clientAction === 'REJECT' ? 'bg-red-50 border-red-300' :
                            'bg-gray-50 border-gray-300'
                          }`}>
                            <div className="flex items-center space-x-2 mb-2">
                              {mutuallyAccepted ? <CheckCircle className="h-5 w-5 text-green-600" /> : getClauseIcon(clause.clientAction)}
                              <h5 className="font-semibold text-sm">Respuesta del cliente:</h5>
                            </div>
                            <p className="text-sm font-medium">
                              {getClientResponse(clause)}
                            </p>
                          </div>

                          {/* Mostrar si el proveedor ya aceptó */}
                          {clause.providerCounterAction === 'ACCEPT' && (
                            <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h5 className="font-semibold text-sm text-green-900">Tu respuesta:</h5>
                              </div>
                              <p className="text-sm font-medium text-green-800">
                                Has aceptado la propuesta del cliente
                              </p>
                            </div>
                          )}

                          {/* Respuesta del proveedor (si necesita responder) */}
                          {needsProviderResponse(clause) && (
                            <div className="space-y-3 mt-4 pt-4 border-t-2">
                              <Label className="font-semibold text-lg">Tu respuesta:</Label>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant={providerActions[clause.id]?.action === 'ACCEPT' ? 'default' : 'outline'}
                                  className={providerActions[clause.id]?.action === 'ACCEPT' ? 'bg-green-600 hover:bg-green-700' : ''}
                                  onClick={() => handleProviderAction(clause.id, 'ACCEPT')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Aceptar propuesta del cliente
                                </Button>
                                <Button
                                  size="sm"
                                  variant={providerActions[clause.id]?.action === 'NEGOTIATE' ? 'default' : 'outline'}
                                  className={providerActions[clause.id]?.action === 'NEGOTIATE' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                  onClick={() => handleProviderAction(clause.id, 'NEGOTIATE', providerActions[clause.id]?.negotiation || '')}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Hacer contrapropuesta
                                </Button>
                                <Button
                                  size="sm"
                                  variant={providerActions[clause.id]?.action === 'REJECT' ? 'default' : 'outline'}
                                  className={providerActions[clause.id]?.action === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : ''}
                                  onClick={() => handleProviderAction(clause.id, 'REJECT')}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Mantener mi propuesta
                                </Button>
                              </div>

                              {/* Campo de contrapropuesta */}
                              {providerActions[clause.id]?.action === 'NEGOTIATE' && (
                                <div className="mt-3">
                                  <Label htmlFor={`negotiation-${clause.id}`} className="text-sm">
                                    Especifica tu contrapropuesta:
                                  </Label>
                                  <Textarea
                                    id={`negotiation-${clause.id}`}
                                    value={providerActions[clause.id]?.negotiation || ''}
                                    onChange={(e) => handleProviderAction(clause.id, 'NEGOTIATE', e.target.value)}
                                    placeholder="Describe tu contrapropuesta..."
                                    rows={3}
                                    className="mt-2"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex justify-between items-center border-t pt-4">
            <div className="text-sm text-gray-600">
              {clauses.length > 0 && (
                <>
                  {clauses.filter(c => c.clientAction === 'ACCEPT').length} aceptadas, 
                  {' '}{clauses.filter(c => c.clientAction === 'NEGOTIATE').length} negociadas,
                  {' '}{clauses.filter(c => c.clientAction === 'REJECT').length} rechazadas
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cerrar
              </Button>
              {hasClientNegotiations && (
                <Button 
                  onClick={handleSaveResponse}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Guardar Respuesta
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertType === 'success' ? 'Éxito' : 'Error'}
            </AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
