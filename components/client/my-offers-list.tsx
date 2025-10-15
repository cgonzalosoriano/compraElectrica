
'use client';

import { useState } from 'react';
import { User, Offer, Transaction } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Factory, 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import ClauseNegotiationModal from './clause-negotiation-modal';

interface ClientOfferWithDetails {
  id: string;
  status: string;
  requestedVolume: number | null;
  createdAt: Date;
  offer: (Offer & {
    provider: User;
  }) | null;
}

interface TransactionWithOffer extends Transaction {
  offer: Offer | null;
}

interface MyOffersListProps {
  clientOffers: ClientOfferWithDetails[];
  transactions: TransactionWithOffer[];
  clientId: string;
}

export default function MyOffersList({ clientOffers, transactions, clientId }: MyOffersListProps) {
  const [selectedOfferForNegotiation, setSelectedOfferForNegotiation] = useState<{
    offer: (Offer & { provider: User }) | null;
    clientOfferId: string;
  } | null>(null);

  if (clientOffers.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No has solicitado ofertas aún</p>
        <p className="text-sm text-gray-500">
          Explorá las ofertas disponibles y enviá tu primera solicitud
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4" />;
      case 'NEGOTIATING':
        return <MessageSquare className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'NEGOTIATING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'ACCEPTED':
        return 'Aceptada';
      case 'NEGOTIATING':
        return 'En Negociación';
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'DISPUTED':
        return 'En Disputa';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {clientOffers.map((clientOffer) => {
        // Si la oferta fue eliminada, mostrar información limitada
        if (!clientOffer.offer) {
          return (
            <Card key={clientOffer.id} className="border-0 shadow-sm border-l-4 border-l-amber-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">⚠️</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Oferta Original Eliminada
                      </h3>
                      <p className="text-sm text-gray-600">
                        La oferta original fue eliminada por el proveedor, pero tu solicitud se mantiene activa.
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(clientOffer.status)} flex items-center space-x-1`}>
                    {getStatusIcon(clientOffer.status)}
                    <span>{getStatusText(clientOffer.status)}</span>
                  </Badge>
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    Tu solicitud de {clientOffer.requestedVolume?.toLocaleString()} MWh continúa en proceso de negociación 
                    con las condiciones originales congeladas.
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    Creada el: {clientOffer.createdAt.toLocaleDateString('es-AR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        }

        // Buscar transacción relacionada
        const relatedTransaction = transactions.find(t => 
          t.offerId === clientOffer.offer?.id && t.clientId
        );

        return (
          <Card key={clientOffer.id} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Información Principal */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">
                          {clientOffer.offer.generationSource.toLowerCase().includes('solar') ? '☀️' : 
                           clientOffer.offer.generationSource.toLowerCase().includes('eólica') ? '💨' : '⚡'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {clientOffer.offer.generationSource}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 space-x-4">
                            <span className="flex items-center">
                              <Factory className="h-4 w-4 mr-1" />
                              {clientOffer?.offer?.provider?.companyName}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {clientOffer.offer.deliveryNode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={`${getStatusColor(clientOffer.status)} flex items-center space-x-1`}>
                      {getStatusIcon(clientOffer.status)}
                      <span>{getStatusText(clientOffer.status)}</span>
                    </Badge>
                  </div>

                  {/* Detalles de la Solicitud */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center text-blue-600 mb-1">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Precio Energía</span>
                      </div>
                      <p className="text-sm font-bold text-blue-900">
                        ${clientOffer.offer.energyPrice}/MWh
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center text-purple-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Plazo</span>
                      </div>
                      <p className="text-sm font-bold text-purple-900">
                        {clientOffer.offer.term} meses
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center text-green-600 mb-1">
                        <Factory className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Volumen</span>
                      </div>
                      <p className="text-sm font-bold text-green-900">
                        {clientOffer?.requestedVolume?.toLocaleString() || 'N/A'} MWh
                      </p>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center text-orange-600 mb-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Solicitado</span>
                      </div>
                      <p className="text-sm font-bold text-orange-900">
                        {new Date(clientOffer.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>

                  {/* Información de Transacción si existe */}
                  {relatedTransaction && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Información de Transacción</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Monto Total:</span>
                          <span className="text-gray-900 ml-2">
                            ${relatedTransaction.totalAmount.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Estado Pago:</span>
                          <span className="text-gray-900 ml-2">
                            {relatedTransaction.paymentStatus === 'PENDING' ? 'Pendiente' :
                             relatedTransaction.paymentStatus === 'COMPLETED' ? 'Completado' :
                             relatedTransaction.paymentStatus}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Creado:</span>
                          <span className="text-gray-900 ml-2">
                            {new Date(relatedTransaction.createdAt).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </div>
                      
                      {relatedTransaction.contractGenerated && (
                        <div className="mt-2">
                          <Badge className="bg-green-100 text-green-800">
                            <FileText className="h-3 w-3 mr-1" />
                            Contrato Generado
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col space-y-2 lg:ml-6">
                  {(clientOffer.status === 'PENDING' || clientOffer.status === 'NEGOTIATING') && (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          if (clientOffer.offer) {
                            setSelectedOfferForNegotiation({
                              offer: clientOffer.offer,
                              clientOfferId: clientOffer.id
                            })
                          }
                        }}
                        disabled={!clientOffer.offer}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {clientOffer.status === 'PENDING' ? 'Iniciar Negociación' : 'Ver Negociación'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ver Mensajes
                      </Button>
                    </>
                  )}
                  
                  {clientOffer.status === 'ACCEPTED' && !relatedTransaction?.contractGenerated && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <FileText className="h-4 w-4 mr-2" />
                      Generar Contrato
                    </Button>
                  )}
                  
                  {relatedTransaction?.contractGenerated && relatedTransaction?.contractUrl && (
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Descargar Contrato
                    </Button>
                  )}
                  
                  {clientOffer.status === 'COMPLETED' && relatedTransaction?.paymentStatus === 'PENDING' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Procesar Pago
                    </Button>
                  )}

                  <div className="text-center lg:text-right">
                    <p className="text-xs text-gray-500">
                      ID: {clientOffer.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Modal de Negociación por Cláusulas */}
      {selectedOfferForNegotiation && selectedOfferForNegotiation.offer && (
        <ClauseNegotiationModal
          offer={selectedOfferForNegotiation.offer}
          clientId={clientId}
          clientOfferId={selectedOfferForNegotiation.clientOfferId}
          onClose={() => setSelectedOfferForNegotiation(null)}
          onSuccess={() => {
            setSelectedOfferForNegotiation(null);
            // Refrescar la página para mostrar los cambios
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
