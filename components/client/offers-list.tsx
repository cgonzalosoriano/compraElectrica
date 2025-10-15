
'use client';

import { useState } from 'react';
import { User, Offer } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Factory, 
  MapPin, 
  Clock, 
  Zap, 
  DollarSign, 
  Calendar,
  Eye,
  CheckCircle
} from 'lucide-react';
import ClauseNegotiationModal from './clause-negotiation-modal';

interface OfferWithProvider extends Offer {
  provider: User;
}

interface OffersListProps {
  offers: OfferWithProvider[];
  clientId: string;
}

export default function OffersList({ offers, clientId }: OffersListProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferWithProvider | null>(null);

  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No se encontraron ofertas</p>
        <p className="text-sm text-gray-500">
          Intentá cambiar los filtros para ver más ofertas disponibles
        </p>
      </div>
    );
  }

  const getSourceIcon = (source: string) => {
    if (source.toLowerCase().includes('solar')) {
      return '☀️';
    } else if (source.toLowerCase().includes('eólica')) {
      return '💨';
    } else if (source.toLowerCase().includes('térmica')) {
      return '🔥';
    }
    return '⚡';
  };

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <Card key={offer.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Información Principal */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getSourceIcon(offer.generationSource)}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {offer.generationSource}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <span className="flex items-center">
                            <Factory className="h-4 w-4 mr-1" />
                            {offer?.provider?.companyName}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {offer.deliveryNode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Badge className="bg-green-100 text-green-800">
                    {offer.status === 'ACTIVE' ? 'Disponible' : offer.status}
                  </Badge>
                </div>

                {/* Detalles de Precio */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center text-blue-600 mb-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Energía</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900">
                      ${offer.energyPrice}/MWh
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center text-purple-600 mb-1">
                      <Zap className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Potencia</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900">
                      ${offer.powerPrice}/kW-mes
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center text-orange-600 mb-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Plazo</span>
                    </div>
                    <p className="text-lg font-bold text-orange-900">
                      {offer.term} meses
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center text-green-600 mb-1">
                      <Factory className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Disponible</span>
                    </div>
                    <p className="text-lg font-bold text-green-900">
                      {offer.availableVolume.toLocaleString()} MWh
                    </p>
                  </div>
                </div>

                {/* Condiciones */}
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Pago:</strong> {offer.paymentTerms}</p>
                  <p><strong>Garantías:</strong> {offer.guarantees}</p>
                  {offer.otherConditions && (
                    <p><strong>Condiciones:</strong> {offer.otherConditions}</p>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col space-y-3 lg:ml-6">
                <Dialog open={!!selectedOffer} onOpenChange={(open) => !open && setSelectedOffer(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedOffer(offer)}
                      className="w-full lg:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </DialogTrigger>
                </Dialog>

                <Button 
                  className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={() => setSelectedOffer(offer)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Solicitar Oferta
                </Button>

                <div className="text-center lg:text-right">
                  <p className="text-xs text-gray-500">
                    Publicado {new Date(offer.createdAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Modal de Negociación por Cláusulas */}
      {selectedOffer && (
        <ClauseNegotiationModal
          offer={selectedOffer}
          clientId={clientId}
          onClose={() => setSelectedOffer(null)}
          onSuccess={() => {
            setSelectedOffer(null);
            // Aquí podrías refrescar la página o mostrar un mensaje de éxito
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
