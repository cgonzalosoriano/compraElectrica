
'use client';

import { useState } from 'react';
import { User, Offer } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Factory, 
  MapPin, 
  DollarSign, 
  Zap, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  User as UserIcon,
  Phone,
  Building2
} from 'lucide-react';

interface OfferWithProvider extends Offer {
  provider: User;
}

interface OfferDetailsModalProps {
  offer: OfferWithProvider;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OfferDetailsModal({ 
  offer, 
  clientId, 
  onClose, 
  onSuccess 
}: OfferDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'details' | 'request'>('details');
  
  const [requestData, setRequestData] = useState({
    userNumber: '',
    distributorName: '',
    region: '',
    address: '',
    tariffType: '',
    requestedVolume: '',
    message: ''
  });

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

      onSuccess();
    } catch (error) {
      setError('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedCost = () => {
    const volume = parseFloat(requestData.requestedVolume) || 0;
    const energyCost = volume * offer.energyPrice;
    const powerCost = (offer.powerPrice * offer.term); // Simplificado
    return energyCost + powerCost;
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="text-2xl">
              {offer.generationSource.toLowerCase().includes('solar') ? '☀️' : 
               offer.generationSource.toLowerCase().includes('eólica') ? '💨' : '⚡'}
            </div>
            <span>{offer.generationSource}</span>
          </DialogTitle>
          <DialogDescription>
            Oferta de {offer?.provider?.companyName} - {offer.deliveryNode}
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <div className="space-y-6">
            {/* Información del Proveedor */}
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
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Empresa:</span>
                      <span className="text-sm">{offer?.provider?.companyName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Contacto:</span>
                      <span className="text-sm">{offer?.provider?.name}</span>
                    </div>
                    {offer?.provider?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Teléfono:</span>
                        <span className="text-sm">{offer.provider.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Ubicación:</span>
                      <span className="text-sm">{offer?.provider?.city}, {offer?.provider?.province}</span>
                    </div>
                    {offer?.provider?.cuit && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">CUIT:</span>
                        <span className="text-sm">{offer.provider.cuit}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalles de la Oferta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <span>Detalles de la Oferta</span>
                </CardTitle>
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

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Fuente de Generación</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{offer.generationSource}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Nodo de Entrega</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{offer.deliveryNode}</p>
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

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button 
                onClick={() => setStep('request')}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Solicitar esta Oferta
              </Button>
            </div>
          </div>
        ) : (
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

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje Adicional (Opcional)</Label>
                  <Textarea
                    id="message"
                    value={requestData.message}
                    onChange={(e) => setRequestData({...requestData, message: e.target.value})}
                    placeholder="Información adicional o consultas específicas..."
                    rows={3}
                  />
                </div>
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
                    Enviar Solicitud
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
