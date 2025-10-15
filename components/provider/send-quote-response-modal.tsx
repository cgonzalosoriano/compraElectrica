'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, DollarSign, Send, AlertCircle, CheckCircle, MessageSquare, XCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';

interface SendQuoteResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteRequest: any;
  onSuccess: () => void;
  existingResponse?: any; // Para editar una respuesta existente
}

// Opciones de fuentes de generación
const GENERATION_SOURCES = [
  { id: 'solar', label: 'Solar' },
  { id: 'eolica', label: 'Eólica' },
  { id: 'hidraulica', label: 'Hidráulica' },
  { id: 'termica', label: 'Térmica' },
  { id: 'biomasa', label: 'Biomasa' },
  { id: 'nuclear', label: 'Nuclear' },
  { id: 'otra', label: 'Otra' },
];

interface ClauseResponse {
  clauseId: string;
  action: 'ACCEPT' | 'NEGOTIATE';
  negotiation?: string;
}

export default function SendQuoteResponseModal({
  isOpen,
  onClose,
  quoteRequest,
  onSuccess,
  existingResponse,
}: SendQuoteResponseModalProps) {
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  const isEditing = !!existingResponse;

  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [otherSource, setOtherSource] = useState('');

  const [formData, setFormData] = useState({
    energyPricePerMWh: '',
    powerPricePerKW: '',
    paymentTerms: '',
    guaranteesRequired: '',
    deliveryNode: quoteRequest?.deliveryNode || '',
    otherConditions: '',
    providerComments: '',
  });

  // Estado para las respuestas a cláusulas
  const [clauseResponses, setClauseResponses] = useState<Record<string, ClauseResponse>>({});

  useEffect(() => {
    // Inicializar formulario con datos existentes si es edición
    if (isOpen && existingResponse && isEditing) {
      setFormData({
        energyPricePerMWh: existingResponse.energyPricePerMWh?.toString() || '',
        powerPricePerKW: existingResponse.powerPricePerKW?.toString() || '',
        paymentTerms: existingResponse.paymentTerms || '',
        guaranteesRequired: existingResponse.guaranteesRequired || '',
        deliveryNode: existingResponse.deliveryNode || '',
        otherConditions: existingResponse.otherConditions || '',
        providerComments: existingResponse.providerComments || '',
      });

      // Parsear fuentes de generación existentes
      if (existingResponse.generationSource) {
        const sources = existingResponse.generationSource.split(', ').map((s: string) => s.trim());
        const knownSources = GENERATION_SOURCES.map(gs => gs.label);
        const selected: string[] = [];
        const otherSources: string[] = [];
        
        sources.forEach((source: string) => {
          const matchingSource = GENERATION_SOURCES.find(gs => gs.label === source);
          if (matchingSource) {
            selected.push(matchingSource.id);
          } else {
            otherSources.push(source);
          }
        });
        
        if (otherSources.length > 0) {
          selected.push('otra');
          setOtherSource(otherSources.join(', '));
        }
        
        setSelectedSources(selected);
      }

      // Inicializar respuestas de cláusulas
      if (existingResponse.clauseResponses) {
        const initialResponses: Record<string, ClauseResponse> = {};
        existingResponse.clauseResponses.forEach((cr: any) => {
          initialResponses[cr.clauseId] = {
            clauseId: cr.clauseId,
            action: cr.action,
            negotiation: cr.negotiation || ''
          };
        });
        setClauseResponses(initialResponses);
      }
    } else if (isOpen && !isEditing) {
      // Inicializar con valores por defecto para nueva oferta
      setFormData({
        energyPricePerMWh: '',
        powerPricePerKW: '',
        paymentTerms: '',
        guaranteesRequired: '',
        deliveryNode: quoteRequest?.deliveryNode || '',
        otherConditions: '',
        providerComments: '',
      });
      setSelectedSources([]);
      setOtherSource('');
      
      // Inicializar respuestas de cláusulas cuando se abre el modal
      if (quoteRequest?.clauses) {
        const initialResponses: Record<string, ClauseResponse> = {};
        quoteRequest.clauses.forEach((clause: any) => {
          initialResponses[clause.id] = {
            clauseId: clause.id,
            action: 'ACCEPT',
            negotiation: ''
          };
        });
        setClauseResponses(initialResponses);
      }
    }
  }, [quoteRequest, isOpen, existingResponse, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources(prev => {
      if (prev.includes(sourceId)) {
        return prev.filter(id => id !== sourceId);
      } else {
        return [...prev, sourceId];
      }
    });
  };

  const handleClauseActionChange = (clauseId: string, action: 'ACCEPT' | 'NEGOTIATE') => {
    setClauseResponses(prev => ({
      ...prev,
      [clauseId]: {
        ...prev[clauseId],
        action,
        negotiation: action === 'ACCEPT' ? '' : prev[clauseId]?.negotiation || ''
      }
    }));
  };

  const handleClauseNegotiationChange = (clauseId: string, negotiation: string) => {
    setClauseResponses(prev => ({
      ...prev,
      [clauseId]: {
        ...prev[clauseId],
        negotiation
      }
    }));
  };

  const calculateEstimatedTotal = () => {
    const energyPrice = parseFloat(formData.energyPricePerMWh) || 0;
    const powerPrice = parseFloat(formData.powerPricePerKW) || 0;
    
    let totalEnergy = 0;
    let avgPower = 0;
    
    if (quoteRequest?.periods) {
      totalEnergy = quoteRequest.periods.reduce((sum: number, p: any) => sum + (p.energyMWh || 0), 0);
      const totalPower = quoteRequest.periods.reduce((sum: number, p: any) => sum + (p.powerKW || 0), 0);
      avgPower = quoteRequest.periods.length > 0 ? totalPower / quoteRequest.periods.length : 0;
    }
    
    const energyCost = totalEnergy * energyPrice;
    const powerCost = avgPower * powerPrice * (quoteRequest?.termMonths || 12);
    
    return energyCost + powerCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.energyPricePerMWh || !formData.powerPricePerKW) {
      showAlert('Por favor, completá los precios de energía y potencia', 'error');
      return;
    }

    if (selectedSources.length === 0) {
      showAlert('Por favor, seleccioná al menos una fuente de generación', 'error');
      return;
    }

    // Validar cláusulas que requieren negociación
    const hasInvalidNegotiations = Object.values(clauseResponses).some(
      response => response.action === 'NEGOTIATE' && !response.negotiation?.trim()
    );

    if (hasInvalidNegotiations) {
      showAlert('Por favor, escribí las condiciones propuestas para las cláusulas que querés negociar', 'error');
      return;
    }

    try {
      setLoading(true);

      const totalEstimated = calculateEstimatedTotal();
      
      // Construir string de fuentes de generación
      let generationSource = selectedSources
        .filter(id => id !== 'otra')
        .map(id => GENERATION_SOURCES.find(s => s.id === id)?.label)
        .join(', ');
      
      if (selectedSources.includes('otra') && otherSource.trim()) {
        generationSource += (generationSource ? ', ' : '') + otherSource.trim();
      }
      
      const url = '/api/quote-responses';
      const method = isEditing ? 'PATCH' : 'POST';
      const bodyData = isEditing ? {
        responseId: existingResponse.id,
        ...formData,
        generationSource,
        totalEstimated,
        clauseResponses: Object.values(clauseResponses),
      } : {
        quoteRequestId: quoteRequest.id,
        ...formData,
        generationSource,
        totalEstimated,
        clauseResponses: Object.values(clauseResponses),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error al ${isEditing ? 'actualizar' : 'enviar'} la oferta`);
      }

      showAlert(
        isEditing 
          ? '¡Oferta actualizada exitosamente!' 
          : '¡Oferta enviada exitosamente! El cliente será notificado.', 
        'success'
      );
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setSelectedSources([]);
        setOtherSource('');
        setFormData({
          energyPricePerMWh: '',
          powerPricePerKW: '',
          paymentTerms: '',
          guaranteesRequired: '',
          deliveryNode: quoteRequest?.deliveryNode || '',
          otherConditions: '',
          providerComments: '',
        });
      }, 1500);
    } catch (error: any) {
      console.error('Error:', error);
      showAlert(error.message || 'Error al enviar la oferta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  const estimatedTotal = calculateEstimatedTotal();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span>{isEditing ? 'Editar Oferta' : 'Enviar Oferta'}</span>
            </DialogTitle>
            <DialogDescription>
              {quoteRequest?.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Precios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="energyPricePerMWh">Precio de Energía ($/MWh) *</Label>
                <Input
                  id="energyPricePerMWh"
                  name="energyPricePerMWh"
                  type="number"
                  step="0.01"
                  required
                  value={formData.energyPricePerMWh}
                  onChange={handleChange}
                  placeholder="Ej: 45.50"
                />
              </div>

              <div>
                <Label htmlFor="powerPricePerKW">Precio de Potencia ($/kW-mes) *</Label>
                <Input
                  id="powerPricePerKW"
                  name="powerPricePerKW"
                  type="number"
                  step="0.01"
                  required
                  value={formData.powerPricePerKW}
                  onChange={handleChange}
                  placeholder="Ej: 12.30"
                />
              </div>
            </div>

            {/* Total estimado */}
            {(formData.energyPricePerMWh || formData.powerPricePerKW) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Estimado:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${estimatedTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Basado en {quoteRequest?.termMonths || 12} meses
                </p>
              </div>
            )}

            {/* Fuentes de generación con checkboxes */}
            <div>
              <Label className="mb-3 block">Fuente de Generación *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {GENERATION_SOURCES.map((source) => (
                  <div key={source.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={source.id}
                      checked={selectedSources.includes(source.id)}
                      onCheckedChange={() => handleSourceToggle(source.id)}
                    />
                    <Label 
                      htmlFor={source.id}
                      className="cursor-pointer font-normal"
                    >
                      {source.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* Campo de texto para "Otra" */}
              {selectedSources.includes('otra') && (
                <div className="mt-3">
                  <Input
                    placeholder="Especificá la fuente de generación"
                    value={otherSource}
                    onChange={(e) => setOtherSource(e.target.value)}
                  />
                </div>
              )}

              {selectedSources.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Fuentes seleccionadas: {selectedSources
                    .filter(id => id !== 'otra')
                    .map(id => GENERATION_SOURCES.find(s => s.id === id)?.label)
                    .join(', ')}
                    {selectedSources.includes('otra') && otherSource ? `, ${otherSource}` : ''}
                </p>
              )}
            </div>

            {/* Nodo de entrega */}
            <div>
              <Label htmlFor="deliveryNode">Nodo de Entrega</Label>
              <Input
                id="deliveryNode"
                name="deliveryNode"
                value={formData.deliveryNode}
                onChange={handleChange}
                placeholder="Nodo donde se realizará la entrega"
              />
            </div>

            {/* Condiciones de pago */}
            <div>
              <Label htmlFor="paymentTerms">Condiciones de Pago</Label>
              <Textarea
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                placeholder="Describe las condiciones de pago (30 días, adelantado, etc.)"
                rows={3}
              />
            </div>

            {/* Garantías requeridas */}
            <div>
              <Label htmlFor="guaranteesRequired">Garantías Requeridas</Label>
              <Textarea
                id="guaranteesRequired"
                name="guaranteesRequired"
                value={formData.guaranteesRequired}
                onChange={handleChange}
                placeholder="Garantías que solicitás al cliente"
                rows={3}
              />
            </div>

            {/* Otras condiciones */}
            <div>
              <Label htmlFor="otherConditions">Otras Condiciones</Label>
              <Textarea
                id="otherConditions"
                name="otherConditions"
                value={formData.otherConditions}
                onChange={handleChange}
                placeholder="Cualquier otra condición relevante"
                rows={3}
              />
            </div>

            {/* Respuestas a cláusulas personalizadas */}
            {quoteRequest?.clauses && quoteRequest.clauses.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                  Respuesta a Cláusulas del Cliente
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  El cliente ha incluido cláusulas específicas. Podés aceptarlas o proponer condiciones alternativas.
                </p>

                <div className="space-y-4">
                  {quoteRequest.clauses.map((clause: any) => (
                    <Card key={clause.id} className="border-2 border-gray-200">
                      <CardContent className="p-4">
                        {/* Lo que solicitó el cliente - Desplegable */}
                        <details className="mb-4">
                          <summary className="cursor-pointer bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">
                                Ver lo que solicitó el cliente
                              </span>
                            </div>
                          </summary>
                          <div className="mt-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs font-semibold text-gray-700 uppercase">Cláusula</p>
                                <p className="text-sm text-gray-900">{clause.clauseName}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-700 uppercase">Descripción / Requisito</p>
                                <p className="text-sm text-gray-900">{clause.clauseDescription}</p>
                              </div>
                              {clause.isRequired && (
                                <div className="flex items-center space-x-1 mt-2">
                                  <XCircle className="h-3 w-3 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">Esta cláusula es obligatoria para el cliente</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </details>

                        <div className="mb-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">Tu respuesta a esta cláusula</h4>
                            {clause.isRequired && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Obligatoria
                              </span>
                            )}
                          </div>
                        </div>

                        <RadioGroup
                          value={clauseResponses[clause.id]?.action || 'ACCEPT'}
                          onValueChange={(value: 'ACCEPT' | 'NEGOTIATE') => 
                            handleClauseActionChange(clause.id, value)
                          }
                        >
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ACCEPT" id={`accept-${clause.id}`} />
                              <Label htmlFor={`accept-${clause.id}`} className="flex items-center cursor-pointer">
                                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                                Aceptar cláusula
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="NEGOTIATE" id={`negotiate-${clause.id}`} />
                              <Label htmlFor={`negotiate-${clause.id}`} className="flex items-center cursor-pointer">
                                <MessageSquare className="h-4 w-4 text-blue-600 mr-1" />
                                Negociar condiciones
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>

                        {clauseResponses[clause.id]?.action === 'NEGOTIATE' && (
                          <div className="mt-3">
                            <Label htmlFor={`negotiation-${clause.id}`} className="text-sm">
                              Condiciones propuestas *
                            </Label>
                            <Textarea
                              id={`negotiation-${clause.id}`}
                              placeholder="Escribí las condiciones que proponés para esta cláusula..."
                              value={clauseResponses[clause.id]?.negotiation || ''}
                              onChange={(e) => handleClauseNegotiationChange(clause.id, e.target.value)}
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Comentarios */}
            <div>
              <Label htmlFor="providerComments">Comentarios Adicionales</Label>
              <Textarea
                id="providerComments"
                name="providerComments"
                value={formData.providerComments}
                onChange={handleChange}
                placeholder="Información adicional que quieras compartir con el cliente"
                rows={3}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-900 font-medium">Recordá</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Una vez enviada tu oferta, el cliente podrá verla y compararla con otras ofertas recibidas.
                    Asegurate de ofrecer precios competitivos y condiciones claras.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Actualizando...' : 'Enviando...'}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {isEditing ? 'Actualizar Oferta' : 'Enviar Oferta'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
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
