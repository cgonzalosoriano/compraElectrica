
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, MessageSquare, AlertCircle, Building2, DollarSign, Calendar, Zap, Factory, ChevronRight, Check } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OfferDetailReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteResponse: any;
  quoteRequest: any;
  onOfferAccepted?: () => void;
}

export default function OfferDetailReviewModal({
  isOpen,
  onClose,
  quoteResponse,
  quoteRequest,
  onOfferAccepted,
}: OfferDetailReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [clauses, setClauses] = useState<any[]>([]);
  const [clauseActions, setClauseActions] = useState<Record<string, { action: string; negotiation?: string }>>({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [allClausesActioned, setAllClausesActioned] = useState(false);
  const [allClausesAccepted, setAllClausesAccepted] = useState(false);
  const [review, setReview] = useState<any>(null);

  useEffect(() => {
    if (isOpen && quoteResponse) {
      fetchClausesAndReview();
    }
  }, [isOpen, quoteResponse]);

  useEffect(() => {
    checkClausesStatus();
  }, [clauseActions, clauses]);

  const fetchClausesAndReview = async () => {
    try {
      setLoading(true);
      
      // Obtener las cláusulas del request con las respuestas del proveedor
      const clausesResponse = await fetch(`/api/quote-responses/${quoteResponse.id}/clauses-comparison`);
      
      if (!clausesResponse.ok) {
        throw new Error('Error al cargar las cláusulas');
      }

      const clausesData = await clausesResponse.json();
      setClauses(clausesData.clauses || []);
      setReview(clausesData.review);
      
      // Cargar las acciones previas del cliente si existen
      const actionsMap: Record<string, { action: string; negotiation?: string }> = {};
      clausesData.clauses.forEach((clause: any) => {
        if (clause.clientAction) {
          actionsMap[clause.id] = {
            action: clause.clientAction,
            negotiation: clause.clientNegotiation,
          };
        }
      });
      setClauseActions(actionsMap);
      
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al cargar los detalles de la oferta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkClausesStatus = () => {
    if (clauses.length === 0) {
      setAllClausesActioned(false);
      setAllClausesAccepted(false);
      return;
    }

    const allActioned = clauses.every(clause => 
      clauseActions[clause.id] || isClauseFullyAccepted(clause)
    );
    
    const allAccepted = clauses.every(clause => 
      isClauseFullyAccepted(clause) || clauseActions[clause.id]?.action === 'ACCEPT'
    );
    
    setAllClausesActioned(allActioned);
    setAllClausesAccepted(allAccepted);
  };

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  const handleClauseAction = (clauseId: string, action: string, negotiation?: string) => {
    setClauseActions(prev => ({
      ...prev,
      [clauseId]: { action, negotiation },
    }));
  };

  const handleSaveReview = async () => {
    try {
      setLoading(true);

      // Filtrar cláusulas que no están completamente aceptadas
      const pendingClauses = clauses.filter(clause => !isClauseFullyAccepted(clause));
      
      // Validar que todas las cláusulas pendientes tengan una acción
      const allPendingActioned = pendingClauses.every(clause => clauseActions[clause.id]);
      
      if (!allPendingActioned) {
        showAlert('Debes tomar una decisión en todas las cláusulas pendientes', 'error');
        return;
      }

      // Validar que si hay negociaciones, tengan texto
      for (const [clauseId, action] of Object.entries(clauseActions)) {
        if (action.action === 'NEGOTIATE' && !action.negotiation?.trim()) {
          showAlert('Debes especificar tu propuesta en las cláusulas que deseas negociar', 'error');
          return;
        }
      }

      // Solo enviar acciones de cláusulas que no están completamente aceptadas
      const clauseActionsToSave = Object.fromEntries(
        Object.entries(clauseActions).filter(([clauseId]) => {
          const clause = clauses.find(c => c.id === clauseId);
          return clause && !isClauseFullyAccepted(clause);
        })
      );

      if (Object.keys(clauseActionsToSave).length === 0 && pendingClauses.length === 0) {
        showAlert('No hay cambios pendientes para guardar', 'error');
        return;
      }

      const response = await fetch(`/api/quote-responses/${quoteResponse.id}/client-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauseActions: clauseActionsToSave }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la revisión');
      }

      showAlert('Revisión guardada exitosamente', 'success');
      
      // Recargar los datos
      await fetchClausesAndReview();
      
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al guardar la revisión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = () => {
    if (!allClausesAccepted) {
      showAlert('Debes aceptar todas las cláusulas antes de poder adjudicar la oferta', 'error');
      return;
    }

    showAlert('Esta oferta está lista para adjudicar. Dirígete a la pestaña "Adjudicables" en "Mis Cotizaciones" para completar el proceso.', 'success');
    
    if (onOfferAccepted) {
      onOfferAccepted();
    }
    
    setTimeout(() => {
      onClose();
    }, 2000);
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
    // Mapear las cláusulas estándar
    if (originalClause.clauseName.toLowerCase().includes('precio') && originalClause.clauseName.toLowerCase().includes('energía')) {
      return 'Precio de Energía';
    }
    if (originalClause.clauseName.toLowerCase().includes('precio') && originalClause.clauseName.toLowerCase().includes('potencia')) {
      return 'Precio de Potencia';
    }
    if (originalClause.clauseName.toLowerCase().includes('plazo')) {
      return 'Plazo';
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
    return originalClause.clauseName;
  };

  const getProviderProposal = (clause: any): string => {
    // Si el proveedor aceptó, mostrar el valor original
    if (clause.providerAction === 'ACCEPT') {
      return clause.originalClause?.clauseDescription || 'Acepta condición del cliente';
    }
    // Si negoció, mostrar su propuesta
    if (clause.providerAction === 'NEGOTIATE' && clause.providerNegotiation) {
      return clause.providerNegotiation;
    }
    return 'Sin propuesta';
  };

  const isClauseFullyAccepted = (clause: any): boolean => {
    // Caso 1: Cliente aceptó directamente la propuesta del proveedor
    if (clause.clientAction === 'ACCEPT') {
      return true;
    }
    // Caso 2: Cliente negoció y proveedor aceptó la negociación del cliente
    if (clause.clientAction === 'NEGOTIATE' && clause.providerCounterAction === 'ACCEPT') {
      return true;
    }
    return false;
  };

  const getCurrentClauseValue = (clause: any): string => {
    // Si el proveedor aceptó la negociación del cliente, mostrar lo que negoció el cliente
    if (clause.clientAction === 'NEGOTIATE' && clause.providerCounterAction === 'ACCEPT') {
      return clause.clientNegotiation || 'Negociación aceptada';
    }
    // Si el cliente aceptó la propuesta del proveedor, mostrar la propuesta del proveedor
    if (clause.clientAction === 'ACCEPT') {
      if (clause.providerAction === 'NEGOTIATE' && clause.providerNegotiation) {
        return clause.providerNegotiation;
      }
      return clause.originalClause?.clauseDescription || 'Aceptada';
    }
    // Si aún está en negociación, mostrar la última propuesta
    if (clause.providerCounterNegotiation) {
      return clause.providerCounterNegotiation;
    }
    if (clause.providerAction === 'NEGOTIATE' && clause.providerNegotiation) {
      return clause.providerNegotiation;
    }
    return clause.originalClause?.clauseDescription || 'Sin especificar';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span>Revisión Detallada de Oferta</span>
            </DialogTitle>
            <DialogDescription>
              {quoteResponse?.provider?.companyName || quoteResponse?.provider?.name}
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
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                      Resumen de la Oferta
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

                {/* Estado de revisión */}
                {review && review.isReviewed && (
                  <Card className={`border-2 ${allClausesAccepted ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {allClausesAccepted ? (
                            <>
                              <div className="bg-green-100 rounded-full p-2">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-green-900">Todas las cláusulas aceptadas</h3>
                                <p className="text-sm text-green-700">Puedes proceder a aceptar esta oferta</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-orange-100 rounded-full p-2">
                                <MessageSquare className="h-6 w-6 text-orange-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-orange-900">Revisión en progreso</h3>
                                <p className="text-sm text-orange-700">Algunas cláusulas requieren negociación o están pendientes</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comparación de cláusulas */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                    Comparación de Cláusulas
                  </h3>
                  <p className="text-sm text-gray-600">
                    Revisa cada cláusula y decide si aceptas, negocias o rechazas la propuesta del proveedor
                  </p>

                  {clauses.map((clause, index) => {
                    const fullyAccepted = isClauseFullyAccepted(clause);
                    return (
                    <Card key={clause.id} className={`border-2 transition-colors ${
                      fullyAccepted ? 'bg-green-50 border-green-300' : 'hover:border-blue-300'
                    }`}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Header de la cláusula */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`rounded-full p-2 ${
                                fullyAccepted ? 'bg-green-200' : 'bg-blue-100'
                              }`}>
                                {fullyAccepted ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <span className="font-bold text-blue-600">{index + 1}</span>
                                )}
                              </div>
                              <div>
                                <h4 className={`font-bold text-lg ${
                                  fullyAccepted ? 'text-green-900' : ''
                                }`}>
                                  {getClauseLabel(clause.originalClause)}
                                </h4>
                                {clause.originalClause?.isRequired && (
                                  <Badge variant="destructive" className="mt-1">Obligatoria</Badge>
                                )}
                                {fullyAccepted && (
                                  <Badge className="mt-1 bg-green-600">✓ Aceptada por ambas partes</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {fullyAccepted ? (
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              ) : (
                                getClauseIcon(clauseActions[clause.id]?.action)
                              )}
                            </div>
                          </div>

                          <Separator />

                          {/* Comparación lado a lado */}
                          {fullyAccepted ? (
                            // Mostrar valor final aceptado
                            <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                              <div className="flex items-center space-x-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h5 className="font-semibold text-green-900">Valor Acordado:</h5>
                              </div>
                              <p className="text-base font-medium text-green-900">
                                {getCurrentClauseValue(clause)}
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Lo que pidió el cliente */}
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="bg-gray-200 rounded-full p-1">
                                    <Building2 className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <h5 className="font-semibold text-sm text-gray-700">Tu solicitud:</h5>
                                </div>
                                <p className="text-sm text-gray-800">
                                  {clause.originalClause?.clauseDescription || 'Sin especificación'}
                                </p>
                              </div>

                              {/* Lo que ofrece el proveedor */}
                              <div className={`rounded-lg p-4 ${
                                clause.providerAction === 'ACCEPT' ? 'bg-green-50 border-2 border-green-200' :
                                clause.providerAction === 'NEGOTIATE' ? 'bg-orange-50 border-2 border-orange-200' :
                                'bg-gray-50'
                              }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className={`rounded-full p-1 ${
                                    clause.providerAction === 'ACCEPT' ? 'bg-green-200' :
                                    clause.providerAction === 'NEGOTIATE' ? 'bg-orange-200' :
                                    'bg-gray-200'
                                  }`}>
                                    {clause.providerAction === 'ACCEPT' ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : clause.providerAction === 'NEGOTIATE' ? (
                                      <MessageSquare className="h-4 w-4 text-orange-600" />
                                    ) : (
                                      <Factory className="h-4 w-4 text-gray-600" />
                                    )}
                                  </div>
                                  <h5 className="font-semibold text-sm">
                                    {clause.providerAction === 'ACCEPT' ? 'Proveedor acepta:' :
                                     clause.providerAction === 'NEGOTIATE' ? 'Proveedor propone:' :
                                     'Propuesta del proveedor:'}
                                  </h5>
                                </div>
                                <p className="text-sm font-medium">
                                  {getProviderProposal(clause)}
                                </p>
                                {/* Mostrar si el proveedor ha respondido a tu negociación */}
                                {clause.clientAction === 'NEGOTIATE' && clause.providerCounterNegotiation && (
                                  <div className="mt-3 pt-3 border-t border-orange-300">
                                    <p className="text-xs text-orange-700 font-semibold mb-1">
                                      Respuesta a tu negociación:
                                    </p>
                                    <p className="text-sm font-medium text-orange-900">
                                      {clause.providerCounterNegotiation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Acciones del cliente */}
                          {!fullyAccepted ? (
                            <div className="space-y-3">
                              <Label className="font-semibold">Tu decisión:</Label>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant={clauseActions[clause.id]?.action === 'ACCEPT' ? 'default' : 'outline'}
                                  className={clauseActions[clause.id]?.action === 'ACCEPT' ? 'bg-green-600 hover:bg-green-700' : ''}
                                  onClick={() => handleClauseAction(clause.id, 'ACCEPT')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Aceptar
                                </Button>
                                <Button
                                  size="sm"
                                  variant={clauseActions[clause.id]?.action === 'NEGOTIATE' ? 'default' : 'outline'}
                                  className={clauseActions[clause.id]?.action === 'NEGOTIATE' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                  onClick={() => handleClauseAction(clause.id, 'NEGOTIATE', clauseActions[clause.id]?.negotiation || '')}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Negociar
                                </Button>
                                <Button
                                  size="sm"
                                  variant={clauseActions[clause.id]?.action === 'REJECT' ? 'default' : 'outline'}
                                  className={clauseActions[clause.id]?.action === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : ''}
                                  onClick={() => handleClauseAction(clause.id, 'REJECT')}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rechazar
                                </Button>
                              </div>

                              {/* Campo de negociación */}
                              {clauseActions[clause.id]?.action === 'NEGOTIATE' && (
                                <div className="mt-3">
                                  <Label htmlFor={`negotiation-${clause.id}`} className="text-sm">
                                    Especifica tu propuesta:
                                  </Label>
                                  <Textarea
                                    id={`negotiation-${clause.id}`}
                                    value={clauseActions[clause.id]?.negotiation || ''}
                                    onChange={(e) => handleClauseAction(clause.id, 'NEGOTIATE', e.target.value)}
                                    placeholder="Describe tu contrapropuesta o condiciones..."
                                    rows={3}
                                    className="mt-2"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-700 font-medium flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Esta cláusula ha sido aceptada por ambas partes
                              </p>
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
                  {Object.keys(clauseActions).length} de {clauses.length} cláusulas revisadas
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cerrar
              </Button>
              <Button 
                onClick={handleSaveReview}
                disabled={loading || !allClausesActioned}
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
                    Guardar Revisión
                  </>
                )}
              </Button>
              <Button 
                onClick={handleAcceptOffer}
                disabled={loading || !allClausesAccepted}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Lista
              </Button>
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
