
'use client';

import { useState, useEffect } from 'react';
import { User, Offer } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Factory, 
  MapPin, 
  DollarSign, 
  Zap, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  X,
  Check
} from 'lucide-react';

interface OfferWithProvider extends Offer {
  provider: User;
}

interface ClauseNegotiationData {
  id?: string;
  clauseType: string;
  originalValue: string;
  status: 'PENDING' | 'ACCEPTED' | 'NEGOTIATING' | 'AGREED' | 'REJECTED';
  clientProposedValue?: string;
  clientNegotiationNote?: string;
  providerResponse?: string;
  providerResponseNote?: string;
  finalAgreedValue?: string;
}

interface ClauseNegotiationModalProps {
  offer: OfferWithProvider;
  clientId: string;
  clientOfferId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Configuración de las cláusulas
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

export default function ClauseNegotiationModal({ 
  offer, 
  clientId, 
  clientOfferId,
  onClose, 
  onSuccess 
}: ClauseNegotiationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'details' | 'clauses' | 'request'>('details');
  const [clientOfferData, setClientOfferData] = useState<any>(null);
  const [clauses, setClauses] = useState<ClauseNegotiationData[]>([]);
  
  const [requestData, setRequestData] = useState({
    userNumber: '',
    distributorName: '',
    region: '',
    address: '',
    tariffType: '',
    requestedVolume: '',
    message: ''
  });

  // Inicializar las cláusulas basadas en la oferta
  const initializeClauses = (requestedVolume?: number) => {
    const initialClauses: ClauseNegotiationData[] = [
      {
        clauseType: 'ENERGY_PRICE',
        originalValue: offer.energyPrice.toString(),
        status: 'PENDING'
      },
      {
        clauseType: 'POWER_PRICE',
        originalValue: offer.powerPrice.toString(),
        status: 'PENDING'
      },
      {
        clauseType: 'TERM',
        originalValue: offer.term.toString(),
        status: 'PENDING'
      },
      {
        clauseType: 'PAYMENT_TERMS',
        originalValue: offer.paymentTerms,
        status: 'PENDING'
      },
      {
        clauseType: 'GUARANTEES',
        originalValue: offer.guarantees,
        status: 'PENDING'
      }
    ];

    if (requestedVolume) {
      initialClauses.push({
        clauseType: 'VOLUME',
        originalValue: requestedVolume.toString(),
        status: 'PENDING'
      });
    }

    if (offer.otherConditions) {
      initialClauses.push({
        clauseType: 'OTHER_CONDITIONS',
        originalValue: offer.otherConditions,
        status: 'PENDING'
      });
    }

    setClauses(initialClauses);
  };

  // Cargar negociaciones existentes si hay un clientOfferId
  useEffect(() => {
    if (clientOfferId) {
      loadExistingNegotiations();
    }
  }, [clientOfferId]);

  const loadExistingNegotiations = async () => {
    try {
      const response = await fetch(`/api/clause-negotiations/${clientOfferId}`);
      if (response.ok) {
        const data = await response.json();
        setClientOfferData(data.clientOffer);
        
        if (data.negotiations && data.negotiations.length > 0) {
          setClauses(data.negotiations.map((neg: any) => ({
            id: neg.id,
            clauseType: neg.clauseType,
            originalValue: neg.originalValue,
            status: neg.status,
            clientProposedValue: neg.clientProposedValue,
            clientNegotiationNote: neg.clientNegotiationNote,
            providerResponse: neg.providerResponse,
            providerResponseNote: neg.providerResponseNote,
            finalAgreedValue: neg.finalAgreedValue
          })));
        } else {
          initializeClauses(data.clientOffer?.requestedVolume);
        }
      }
    } catch (error) {
      console.error('Error loading negotiations:', error);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/client-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          clientId,
          ...requestData,
          requestedVolume: parseFloat(requestData.requestedVolume)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al solicitar la oferta');
        return;
      }

      // Inicializar las cláusulas con el volumen solicitado
      initializeClauses(parseFloat(requestData.requestedVolume));
      setStep('clauses');
      
      // Guardar el clientOfferId para el próximo paso
      setClientOfferData(data.clientOffer);

    } catch (error) {
      setError('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const [negotiationInputs, setNegotiationInputs] = useState<Record<string, { value: string; note: string; showInputs: boolean }>>({});

  const handleClauseAction = async (clauseIndex: number, action: 'accept' | 'negotiate') => {
    const clause = clauses[clauseIndex];
    
    if (action === 'accept') {
      // Marcar como aceptada
      const updatedClauses = [...clauses];
      updatedClauses[clauseIndex] = {
        ...clause,
        status: 'ACCEPTED'
      };
      setClauses(updatedClauses);
      
      // Guardar en base de datos
      await saveClauseDecision(clause.clauseType, 'ACCEPTED');
    } else if (action === 'negotiate') {
      // Mostrar los campos de entrada para esta cláusula
      setNegotiationInputs(prev => ({
        ...prev,
        [clause.clauseType]: {
          value: prev[clause.clauseType]?.value || clause.originalValue,
          note: prev[clause.clauseType]?.note || '',
          showInputs: true
        }
      }));
    }
  };

  const handleSendNegotiation = async (clauseType: string, clauseIndex: number) => {
    const input = negotiationInputs[clauseType];
    if (!input?.value) return;

    const clause = clauses[clauseIndex];
    const updatedClauses = [...clauses];
    updatedClauses[clauseIndex] = {
      ...clause,
      status: 'NEGOTIATING',
      clientProposedValue: input.value,
      clientNegotiationNote: input.note
    };
    setClauses(updatedClauses);

    // Guardar en base de datos
    await saveClauseDecision(clauseType, 'NEGOTIATING', input.value, input.note);

    // Ocultar los campos de entrada
    setNegotiationInputs(prev => ({
      ...prev,
      [clauseType]: {
        ...prev[clauseType],
        showInputs: false
      }
    }));
  };

  const handleCancelNegotiation = (clauseType: string) => {
    setNegotiationInputs(prev => ({
      ...prev,
      [clauseType]: {
        ...prev[clauseType],
        showInputs: false
      }
    }));
  };

  const saveClauseDecision = async (
    clauseType: string, 
    status: string, 
    proposedValue?: string, 
    note?: string
  ) => {
    try {
      const clientOfferIdToUse = clientOfferId || clientOfferData?.id;
      
      const response = await fetch('/api/clause-negotiations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientOfferId: clientOfferIdToUse,
          clauseType,
          status,
          clientProposedValue: proposedValue,
          clientNegotiationNote: note,
          originalValue: clauses.find(c => c.clauseType === clauseType)?.originalValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error saving clause decision:', errorData);
      }
    } catch (error) {
      console.error('Error saving clause decision:', error);
    }
  };

  const handleRejectClause = async (clauseIndex: number) => {
    const confirmed = confirm('¿Estás seguro de que quieres rechazar esta cláusula? Esto cerrará la negociación sin acuerdo.');
    
    if (confirmed) {
      const clause = clauses[clauseIndex];
      const updatedClauses = [...clauses];
      updatedClauses[clauseIndex] = {
        ...clause,
        status: 'REJECTED'
      };
      setClauses(updatedClauses);
      
      await saveClauseDecision(clause.clauseType, 'REJECTED');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'AGREED':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Aceptada</Badge>;
      case 'NEGOTIATING':
        return <Badge className="bg-yellow-100 text-yellow-800"><MessageSquare className="h-3 w-3 mr-1" />Negociando</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pendiente</Badge>;
    }
  };

  const calculateEstimatedCost = () => {
    const volume = parseFloat(requestData.requestedVolume) || 0;
    const energyCost = volume * offer.energyPrice;
    const powerCost = (offer.powerPrice * offer.term);
    return energyCost + powerCost;
  };

  const canProceedToContract = () => {
    return clauses.every(clause => clause.status === 'ACCEPTED' || clause.status === 'AGREED');
  };

  const renderClauseCard = (clause: ClauseNegotiationData, index: number) => {
    const config = CLAUSE_CONFIG[clause.clauseType as keyof typeof CLAUSE_CONFIG];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <Card key={`${clause.clauseType}-${index}`} className="border-2 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent className={`h-5 w-5 text-${config.color}-600`} />
              <CardTitle className="text-lg">{config.label}</CardTitle>
            </div>
            {getStatusBadge(clause.status)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-1">Valor Propuesto por el Proveedor:</p>
            <p className="text-lg font-semibold">{clause.originalValue} {config.unit}</p>
          </div>

          {clause.clientProposedValue && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600 mb-1">Tu Propuesta:</p>
              <p className="text-lg font-semibold text-blue-900">{clause.clientProposedValue} {config.unit}</p>
              {clause.clientNegotiationNote && (
                <p className="text-sm text-blue-700 mt-2">{clause.clientNegotiationNote}</p>
              )}
            </div>
          )}

          {clause.providerResponse && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600 mb-1">Respuesta del Proveedor:</p>
              <p className="text-lg font-semibold text-green-900">{clause.providerResponse}</p>
              {clause.providerResponseNote && (
                <p className="text-sm text-green-700 mt-2">{clause.providerResponseNote}</p>
              )}
            </div>
          )}

          {clause.status === 'PENDING' && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleClauseAction(index, 'accept')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aceptar Cláusula
                </Button>
                <Button 
                  onClick={() => handleClauseAction(index, 'negotiate')}
                  variant="outline"
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Negociar
                </Button>
                <Button 
                  onClick={() => handleRejectClause(index)}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Campos de negociación */}
              {negotiationInputs[clause.clauseType]?.showInputs && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h5 className="font-medium text-blue-900">Propón tu cambio:</h5>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`value-${clause.clauseType}`} className="text-sm font-medium">
                      Tu propuesta para {config.label}:
                    </Label>
                    <Input
                      id={`value-${clause.clauseType}`}
                      value={negotiationInputs[clause.clauseType]?.value || ''}
                      onChange={(e) => setNegotiationInputs(prev => ({
                        ...prev,
                        [clause.clauseType]: {
                          ...prev[clause.clauseType],
                          value: e.target.value,
                          showInputs: true
                        }
                      }))}
                      placeholder={`Ingresa tu propuesta${config.unit ? ` (${config.unit})` : ''}`}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`note-${clause.clauseType}`} className="text-sm font-medium">
                      Justificación (opcional):
                    </Label>
                    <Textarea
                      id={`note-${clause.clauseType}`}
                      value={negotiationInputs[clause.clauseType]?.note || ''}
                      onChange={(e) => setNegotiationInputs(prev => ({
                        ...prev,
                        [clause.clauseType]: {
                          ...prev[clause.clauseType],
                          note: e.target.value,
                          showInputs: true
                        }
                      }))}
                      placeholder="Explica por qué quieres este cambio..."
                      rows={2}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleSendNegotiation(clause.clauseType, index)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!negotiationInputs[clause.clauseType]?.value}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Enviar Propuesta
                    </Button>
                    <Button
                      onClick={() => handleCancelNegotiation(clause.clauseType)}
                      variant="outline"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {clause.status === 'NEGOTIATING' && (
            <div className="text-center py-2">
              <p className="text-sm text-yellow-600">Esperando respuesta del proveedor...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="text-2xl">
              {offer.generationSource.toLowerCase().includes('solar') ? '☀️' : 
               offer.generationSource.toLowerCase().includes('eólica') ? '💨' : '⚡'}
            </div>
            <span>{offer.generationSource}</span>
          </DialogTitle>
          <DialogDescription>
            {step === 'details' ? 'Revisa los detalles de la oferta' :
             step === 'request' ? 'Completa tu información para solicitar la oferta' :
             'Revisa y negocia las cláusulas de la oferta'}
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <div className="space-y-6">
            {/* Contenido de detalles similar al modal original */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Factory className="h-5 w-5 text-blue-600" />
                  <span>Información del Proveedor</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p><strong>Empresa:</strong> {offer?.provider?.companyName}</p>
                    <p><strong>Contacto:</strong> {offer?.provider?.name}</p>
                    {offer?.provider?.phone && (
                      <p><strong>Teléfono:</strong> {offer.provider.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p><strong>Ubicación:</strong> {offer?.provider?.city}, {offer?.provider?.province}</p>
                    {offer?.provider?.cuit && (
                      <p><strong>CUIT:</strong> {offer.provider.cuit}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de la Oferta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-600 font-medium">Precio Energía</p>
                    <p className="text-xl font-bold text-blue-900">${offer.energyPrice}/MWh</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <Zap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-purple-600 font-medium">Precio Potencia</p>
                    <p className="text-xl font-bold text-purple-900">${offer.powerPrice}/kW-mes</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-orange-600 font-medium">Plazo</p>
                    <p className="text-xl font-bold text-orange-900">{offer.term} meses</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <Factory className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-600 font-medium">Volumen Disponible</p>
                    <p className="text-xl font-bold text-green-900">{offer.availableVolume.toLocaleString()} MWh</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Condiciones de Pago</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{offer.paymentTerms}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Garantías Requeridas</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{offer.guarantees}</p>
                  </div>

                  {offer.otherConditions && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Otras Condiciones</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{offer.otherConditions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button 
                onClick={() => clientOfferId ? setStep('clauses') : setStep('request')}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {clientOfferId ? 'Ver Negociación' : 'Solicitar esta Oferta'}
              </Button>
            </div>
          </div>
        ) : step === 'request' ? (
          <form onSubmit={handleRequestSubmit} className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Información para la Solicitud</CardTitle>
                <DialogDescription>
                  Completá los datos necesarios para solicitar esta oferta
                </DialogDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userNumber">Número de Usuario</Label>
                    <Input
                      id="userNumber"
                      value={requestData.userNumber}
                      onChange={(e) => setRequestData({...requestData, userNumber: e.target.value})}
                      placeholder="ED001234567"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="distributorName">Distribuidora</Label>
                    <Input
                      id="distributorName"
                      value={requestData.distributorName}
                      onChange={(e) => setRequestData({...requestData, distributorName: e.target.value})}
                      placeholder="EDESUR"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Región</Label>
                    <Input
                      id="region"
                      value={requestData.region}
                      onChange={(e) => setRequestData({...requestData, region: e.target.value})}
                      placeholder="Zona Norte"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tariffType">Tipo de Tarifa</Label>
                    <Input
                      id="tariffType"
                      value={requestData.tariffType}
                      onChange={(e) => setRequestData({...requestData, tariffType: e.target.value})}
                      placeholder="TM1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección de Suministro</Label>
                  <Input
                    id="address"
                    value={requestData.address}
                    onChange={(e) => setRequestData({...requestData, address: e.target.value})}
                    placeholder="Av. Industrial 1234"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestedVolume">Volumen Solicitado (MWh)</Label>
                  <Input
                    id="requestedVolume"
                    type="number"
                    step="0.1"
                    min="1"
                    max={offer.availableVolume}
                    value={requestData.requestedVolume}
                    onChange={(e) => setRequestData({...requestData, requestedVolume: e.target.value})}
                    placeholder="1000"
                    required
                  />
                  <p className="text-sm text-gray-600">
                    Máximo disponible: {offer.availableVolume.toLocaleString()} MWh
                  </p>
                </div>

                {requestData.requestedVolume && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Estimación de Costo</h4>
                    <p className="text-2xl font-bold text-blue-900">
                      ${calculateEstimatedCost().toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p className="text-sm text-blue-700">
                      Cálculo aproximado para {requestData.requestedVolume} MWh por {offer.term} meses
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('details')}
                disabled={loading}
              >
                Volver
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Continuar con Negociación
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Negociación de Cláusulas</span>
                  <Badge className={canProceedToContract() ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {canProceedToContract() ? "Listo para Contrato" : "Negociación en Progreso"}
                  </Badge>
                </CardTitle>
                <DialogDescription>
                  Revisa cada cláusula de la oferta. Puedes aceptar, negociar o rechazar cada una individualmente.
                </DialogDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {clauses.map((clause, index) => renderClauseCard(clause, index))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              {canProceedToContract() && (
                <Button 
                  onClick={() => {
                    alert('¡Todas las cláusulas han sido aceptadas! El proveedor puede proceder a generar el contrato.');
                    onSuccess();
                  }}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Proceder al Contrato
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
