
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  DollarSign,
  Zap,
  Calendar,
  Factory,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ClauseNegotiationData {
  id: string;
  clauseType: string;
  originalValue: string;
  status: string;
  clientProposedValue?: string;
  clientNegotiationNote?: string;
  providerResponse?: string;
  providerResponseNote?: string;
  finalAgreedValue?: string;
  clientOffer: {
    id: string;
    client: {
      name: string;
      email: string;
      companyName?: string;
    };
    offer: {
      id: string;
      generationSource: string;
      deliveryNode: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface ProviderResponseModalProps {
  negotiation: ClauseNegotiationData;
  onClose: () => void;
  onSuccess: () => void;
}

const CLAUSE_CONFIG = {
  ENERGY_PRICE: { 
    label: 'Precio de Energía', 
    unit: '$/MWh', 
    icon: DollarSign, 
    color: 'blue' 
  },
  POWER_PRICE: { 
    label: 'Precio de Potencia', 
    unit: '$/kW-mes', 
    icon: Zap, 
    color: 'purple' 
  },
  TERM: { 
    label: 'Plazo', 
    unit: 'meses', 
    icon: Calendar, 
    color: 'orange' 
  },
  PAYMENT_TERMS: { 
    label: 'Condiciones de Pago', 
    unit: '', 
    icon: DollarSign, 
    color: 'green' 
  },
  GUARANTEES: { 
    label: 'Garantías', 
    unit: '', 
    icon: CheckCircle, 
    color: 'red' 
  },
  VOLUME: { 
    label: 'Volumen', 
    unit: 'MWh', 
    icon: Factory, 
    color: 'indigo' 
  },
  OTHER_CONDITIONS: { 
    label: 'Otras Condiciones', 
    unit: '', 
    icon: MessageSquare, 
    color: 'gray' 
  }
};

function ProviderResponseModal({ negotiation, onClose, onSuccess }: ProviderResponseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'accept' | 'reject' | 'counter'>('accept');
  const [responseNote, setResponseNote] = useState('');
  const [counterValue, setCounterValue] = useState('');

  const config = CLAUSE_CONFIG[negotiation.clauseType as keyof typeof CLAUSE_CONFIG];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/clause-negotiations/provider-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clauseNegotiationId: negotiation.id,
          action,
          providerResponse: action === 'accept' ? negotiation.clientProposedValue : 
                           action === 'counter' ? counterValue : 
                           'Rechazada',
          providerResponseNote: responseNote,
          finalAgreedValue: action === 'counter' ? counterValue : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al procesar la respuesta');
        return;
      }

      onSuccess();
    } catch (error) {
      setError('Error al enviar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {config && <config.icon className={`h-5 w-5 text-${config.color}-600`} />}
            <span>Responder Negociación: {config?.label}</span>
          </DialogTitle>
          <DialogDescription>
            Cliente: {negotiation.clientOffer.client.companyName || negotiation.clientOffer.client.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalles de la Negociación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Tu Propuesta Original:</p>
                  <p className="text-lg font-semibold">{negotiation.originalValue} {config?.unit}</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-600 mb-1">Propuesta del Cliente:</p>
                  <p className="text-lg font-semibold text-blue-900">{negotiation.clientProposedValue} {config?.unit}</p>
                  {negotiation.clientNegotiationNote && (
                    <p className="text-sm text-blue-700 mt-2">{negotiation.clientNegotiationNote}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tu Respuesta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="accept"
                      name="action"
                      value="accept"
                      checked={action === 'accept'}
                      onChange={(e) => setAction(e.target.value as any)}
                      className="text-green-600"
                    />
                    <label htmlFor="accept" className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Aceptar propuesta del cliente</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="counter"
                      name="action"
                      value="counter"
                      checked={action === 'counter'}
                      onChange={(e) => setAction(e.target.value as any)}
                      className="text-yellow-600"
                    />
                    <label htmlFor="counter" className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-yellow-600" />
                      <span>Hacer contraoferta</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="reject"
                      name="action"
                      value="reject"
                      checked={action === 'reject'}
                      onChange={(e) => setAction(e.target.value as any)}
                      className="text-red-600"
                    />
                    <label htmlFor="reject" className="flex items-center space-x-2">
                      <X className="h-4 w-4 text-red-600" />
                      <span>Rechazar negociación</span>
                    </label>
                  </div>
                </div>

                {action === 'counter' && (
                  <div className="space-y-2">
                    <Label htmlFor="counterValue">Tu Contraoferta</Label>
                    <Input
                      id="counterValue"
                      value={counterValue}
                      onChange={(e) => setCounterValue(e.target.value)}
                      placeholder={`Ingresa tu contraoferta${config?.unit ? ` (${config.unit})` : ''}`}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="responseNote">Mensaje al Cliente (opcional)</Label>
                  <Textarea
                    id="responseNote"
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    placeholder="Explica tu decisión al cliente..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
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
              className={`${
                action === 'accept' ? 'bg-green-600 hover:bg-green-700' :
                action === 'counter' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  {action === 'accept' && <Check className="h-4 w-4 mr-2" />}
                  {action === 'counter' && <MessageSquare className="h-4 w-4 mr-2" />}
                  {action === 'reject' && <X className="h-4 w-4 mr-2" />}
                  {action === 'accept' ? 'Aceptar' : action === 'counter' ? 'Enviar Contraoferta' : 'Rechazar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClauseNegotiationsList({ providerId }: { providerId: string }) {
  const [negotiations, setNegotiations] = useState<ClauseNegotiationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNegotiation, setSelectedNegotiation] = useState<ClauseNegotiationData | null>(null);
  const [responseInputs, setResponseInputs] = useState<Record<string, { action: 'accept' | 'reject' | 'counter'; counterValue: string; note: string; showInputs: boolean }>>({});

  useEffect(() => {
    loadNegotiations();
  }, [providerId]);

  const loadNegotiations = async () => {
    try {
      const response = await fetch('/api/provider/clause-negotiations');
      if (response.ok) {
        const data = await response.json();
        setNegotiations(data.negotiations);
      }
    } catch (error) {
      console.error('Error loading negotiations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowResponseInputs = (negotiationId: string) => {
    setResponseInputs(prev => ({
      ...prev,
      [negotiationId]: {
        action: 'accept',
        counterValue: '',
        note: '',
        showInputs: true
      }
    }));
  };

  const handleCancelResponse = (negotiationId: string) => {
    setResponseInputs(prev => ({
      ...prev,
      [negotiationId]: {
        ...prev[negotiationId],
        showInputs: false
      }
    }));
  };

  const handleSendResponse = async (negotiation: ClauseNegotiationData) => {
    const input = responseInputs[negotiation.id];
    if (!input) return;

    setLoading(true);

    try {
      const response = await fetch('/api/clause-negotiations/provider-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clauseNegotiationId: negotiation.id,
          action: input.action,
          providerResponse: input.action === 'accept' ? negotiation.clientProposedValue : 
                           input.action === 'counter' ? input.counterValue : 
                           'Rechazada',
          providerResponseNote: input.note,
          finalAgreedValue: input.action === 'counter' ? input.counterValue : undefined
        })
      });

      if (response.ok) {
        // Ocultar los campos de entrada
        handleCancelResponse(negotiation.id);
        // Recargar las negociaciones
        loadNegotiations();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al procesar la respuesta');
      }
    } catch (error) {
      alert('Error al enviar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEGOTIATING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'AGREED':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Acordada</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rechazada</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Aceptada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pendiente</Badge>;
    }
  };

  const groupedNegotiations = negotiations.reduce((acc, neg) => {
    const key = neg.clientOffer.id;
    if (!acc[key]) {
      acc[key] = {
        clientOffer: neg.clientOffer,
        negotiations: []
      };
    }
    acc[key].negotiations.push(neg);
    return acc;
  }, {} as Record<string, { clientOffer: any; negotiations: ClauseNegotiationData[] }>);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Cargando negociaciones...</p>
      </div>
    );
  }

  if (negotiations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No hay negociaciones pendientes</p>
        <p className="text-sm text-gray-500">Las negociaciones de cláusulas aparecerán aquí cuando los clientes soliciten cambios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedNegotiations).map(([clientOfferId, group]) => (
        <Card key={clientOfferId} className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {group.clientOffer.client.companyName || group.clientOffer.client.name}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {group.clientOffer.offer.generationSource} - {group.clientOffer.offer.deliveryNode}
                </p>
              </div>
              <Badge className={`${
                group.negotiations.some(n => n.status === 'NEGOTIATING') ? 'bg-yellow-100 text-yellow-800' : 
                group.negotiations.every(n => n.status === 'AGREED' || n.status === 'ACCEPTED') ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {group.negotiations.some(n => n.status === 'NEGOTIATING') ? 'Negociación Activa' :
                 group.negotiations.every(n => n.status === 'AGREED' || n.status === 'ACCEPTED') ? 'Totalmente Acordada' :
                 'En Revisión'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4">
              {group.negotiations.map((negotiation) => {
                const config = CLAUSE_CONFIG[negotiation.clauseType as keyof typeof CLAUSE_CONFIG];
                if (!config) return null;

                const IconComponent = config.icon;

                return (
                  <div key={negotiation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`h-4 w-4 text-${config.color}-600`} />
                        <h4 className="font-medium">{config.label}</h4>
                      </div>
                      {getStatusBadge(negotiation.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Tu Propuesta:</p>
                        <p className="font-medium">{negotiation.originalValue} {config.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Propuesta Cliente:</p>
                        <p className="font-medium text-blue-600">{negotiation.clientProposedValue} {config.unit}</p>
                      </div>
                      {negotiation.finalAgreedValue && (
                        <div>
                          <p className="text-sm text-gray-600">Valor Acordado:</p>
                          <p className="font-medium text-green-600">{negotiation.finalAgreedValue} {config.unit}</p>
                        </div>
                      )}
                    </div>

                    {negotiation.clientNegotiationNote && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Nota del Cliente:</p>
                        <p className="text-sm bg-blue-50 p-2 rounded">{negotiation.clientNegotiationNote}</p>
                      </div>
                    )}

                    {negotiation.providerResponseNote && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Tu Respuesta:</p>
                        <p className="text-sm bg-gray-50 p-2 rounded">{negotiation.providerResponseNote}</p>
                      </div>
                    )}

                    {negotiation.status === 'NEGOTIATING' && (
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleShowResponseInputs(negotiation.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Responder
                          </Button>
                        </div>
                        
                        {/* Campos de respuesta */}
                        {responseInputs[negotiation.id]?.showInputs && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                            <h5 className="font-medium text-gray-900">Tu respuesta a la propuesta del cliente:</h5>
                            
                            {/* Opciones de respuesta */}
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`accept-${negotiation.id}`}
                                  name={`action-${negotiation.id}`}
                                  value="accept"
                                  checked={responseInputs[negotiation.id]?.action === 'accept'}
                                  onChange={(e) => setResponseInputs(prev => ({
                                    ...prev,
                                    [negotiation.id]: {
                                      ...prev[negotiation.id],
                                      action: e.target.value as any
                                    }
                                  }))}
                                  className="text-green-600"
                                />
                                <label htmlFor={`accept-${negotiation.id}`} className="flex items-center space-x-2 text-green-700">
                                  <Check className="h-4 w-4" />
                                  <span>Aceptar propuesta del cliente: <strong>{negotiation.clientProposedValue} {config?.unit}</strong></span>
                                </label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`counter-${negotiation.id}`}
                                  name={`action-${negotiation.id}`}
                                  value="counter"
                                  checked={responseInputs[negotiation.id]?.action === 'counter'}
                                  onChange={(e) => setResponseInputs(prev => ({
                                    ...prev,
                                    [negotiation.id]: {
                                      ...prev[negotiation.id],
                                      action: e.target.value as any
                                    }
                                  }))}
                                  className="text-yellow-600"
                                />
                                <label htmlFor={`counter-${negotiation.id}`} className="flex items-center space-x-2 text-yellow-700">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>Hacer contraoferta</span>
                                </label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`reject-${negotiation.id}`}
                                  name={`action-${negotiation.id}`}
                                  value="reject"
                                  checked={responseInputs[negotiation.id]?.action === 'reject'}
                                  onChange={(e) => setResponseInputs(prev => ({
                                    ...prev,
                                    [negotiation.id]: {
                                      ...prev[negotiation.id],
                                      action: e.target.value as any
                                    }
                                  }))}
                                  className="text-red-600"
                                />
                                <label htmlFor={`reject-${negotiation.id}`} className="flex items-center space-x-2 text-red-700">
                                  <X className="h-4 w-4" />
                                  <span>Rechazar negociación</span>
                                </label>
                              </div>
                            </div>

                            {/* Campo de contraoferta */}
                            {responseInputs[negotiation.id]?.action === 'counter' && (
                              <div className="space-y-2">
                                <Label htmlFor={`counter-value-${negotiation.id}`} className="text-sm font-medium">
                                  Tu contraoferta:
                                </Label>
                                <Input
                                  id={`counter-value-${negotiation.id}`}
                                  value={responseInputs[negotiation.id]?.counterValue || ''}
                                  onChange={(e) => setResponseInputs(prev => ({
                                    ...prev,
                                    [negotiation.id]: {
                                      ...prev[negotiation.id],
                                      counterValue: e.target.value
                                    }
                                  }))}
                                  placeholder={`Ingresa tu contraoferta${config?.unit ? ` (${config.unit})` : ''}`}
                                  className="w-full"
                                />
                              </div>
                            )}

                            {/* Campo de mensaje */}
                            <div className="space-y-2">
                              <Label htmlFor={`note-${negotiation.id}`} className="text-sm font-medium">
                                Mensaje al cliente (opcional):
                              </Label>
                              <Textarea
                                id={`note-${negotiation.id}`}
                                value={responseInputs[negotiation.id]?.note || ''}
                                onChange={(e) => setResponseInputs(prev => ({
                                  ...prev,
                                  [negotiation.id]: {
                                    ...prev[negotiation.id],
                                    note: e.target.value
                                  }
                                }))}
                                placeholder="Explica tu decisión al cliente..."
                                rows={2}
                                className="w-full"
                              />
                            </div>

                            {/* Botones de acción */}
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleSendResponse(negotiation)}
                                size="sm"
                                className={`${
                                  responseInputs[negotiation.id]?.action === 'accept' ? 'bg-green-600 hover:bg-green-700' :
                                  responseInputs[negotiation.id]?.action === 'counter' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                  'bg-red-600 hover:bg-red-700'
                                }`}
                                disabled={
                                  loading ||
                                  (responseInputs[negotiation.id]?.action === 'counter' && !responseInputs[negotiation.id]?.counterValue)
                                }
                              >
                                {loading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <>
                                    {responseInputs[negotiation.id]?.action === 'accept' && <Check className="h-4 w-4 mr-2" />}
                                    {responseInputs[negotiation.id]?.action === 'counter' && <MessageSquare className="h-4 w-4 mr-2" />}
                                    {responseInputs[negotiation.id]?.action === 'reject' && <X className="h-4 w-4 mr-2" />}
                                  </>
                                )}
                                {responseInputs[negotiation.id]?.action === 'accept' ? 'Aceptar' : 
                                 responseInputs[negotiation.id]?.action === 'counter' ? 'Enviar Contraoferta' : 'Rechazar'}
                              </Button>
                              <Button
                                onClick={() => handleCancelResponse(negotiation.id)}
                                variant="outline"
                                size="sm"
                                disabled={loading}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedNegotiation && (
        <ProviderResponseModal
          negotiation={selectedNegotiation}
          onClose={() => setSelectedNegotiation(null)}
          onSuccess={() => {
            setSelectedNegotiation(null);
            loadNegotiations();
          }}
        />
      )}
    </div>
  );
}
