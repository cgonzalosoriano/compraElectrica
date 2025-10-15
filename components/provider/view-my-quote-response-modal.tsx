'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Loader2, DollarSign, Zap, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import ProviderResponseReviewModal from './provider-response-review-modal';

interface ViewMyQuoteResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteRequestId: string;
  onEdit?: (response: any) => void;
}

export default function ViewMyQuoteResponseModal({
  isOpen,
  onClose,
  quoteRequestId,
  onEdit,
}: ViewMyQuoteResponseModalProps) {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasClientReview, setHasClientReview] = useState(false);

  useEffect(() => {
    if (isOpen && quoteRequestId) {
      fetchMyResponse();
    }
  }, [isOpen, quoteRequestId]);

  const fetchMyResponse = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/quote-responses');
      if (!res.ok) {
        throw new Error('Error al cargar la oferta');
      }
      
      const data = await res.json();
      const myResponse = data.responses?.find((r: any) => r.quoteRequestId === quoteRequestId);
      
      if (!myResponse) {
        setError('No se encontró tu oferta');
      } else {
        setResponse(myResponse);
        
        // Verificar si el cliente ha revisado la oferta
        // Buscar si hay alguna cláusula con respuesta del cliente
        const hasClientActions = myResponse.clauseResponses?.some((clause: any) => 
          clause.clientAction === 'NEGOTIATE' || clause.clientAction === 'REJECT'
        );
        
        setHasClientReview(hasClientActions || (myResponse.review && myResponse.review.isReviewed));
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar la oferta');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = response && !response.viewedByClient;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>Mi Oferta</span>
          </DialogTitle>
          <DialogDescription>
            {response?.quoteRequest?.title || 'Detalles de tu oferta'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : response ? (
          <div className="space-y-6">
            {/* Estado */}
            <div className="flex items-center justify-between">
              <Badge className={
                response.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                response.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                response.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }>
                {response.status === 'SUBMITTED' ? 'Enviada' :
                 response.status === 'ACCEPTED' ? 'Aceptada' :
                 response.status === 'REJECTED' ? 'Rechazada' :
                 response.status}
              </Badge>
              
              {response.viewedByClient ? (
                <Badge variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Vista por el cliente
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No vista aún
                </Badge>
              )}
            </div>

            {/* Precios ofrecidos */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Precios Ofrecidos
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Precio de Energía</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${response.energyPricePerMWh?.toFixed(2)} / MWh
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Precio de Potencia</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${response.powerPricePerKW?.toFixed(2)} / kW-mes
                    </p>
                  </div>
                </div>

                {response.totalEstimated && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Estimado:</span>
                      <span className="text-3xl font-bold text-gray-900">
                        ${response.totalEstimated.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fuente de generación */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                Fuente de Generación
              </h3>
              <p className="text-gray-700">{response.generationSource || 'No especificada'}</p>
            </div>

            {/* Nodo de entrega */}
            {response.deliveryNode && (
              <div>
                <h3 className="font-semibold mb-2">Nodo de Entrega</h3>
                <p className="text-gray-700">{response.deliveryNode}</p>
              </div>
            )}

            {/* Condiciones de pago */}
            {response.paymentTerms && (
              <div>
                <h3 className="font-semibold mb-2">Condiciones de Pago</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{response.paymentTerms}</p>
              </div>
            )}

            {/* Garantías requeridas */}
            {response.guaranteesRequired && (
              <div>
                <h3 className="font-semibold mb-2">Garantías Requeridas</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{response.guaranteesRequired}</p>
              </div>
            )}

            {/* Otras condiciones */}
            {response.otherConditions && (
              <div>
                <h3 className="font-semibold mb-2">Otras Condiciones</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{response.otherConditions}</p>
              </div>
            )}



            {/* Comentarios adicionales */}
            {response.providerComments && (
              <div>
                <h3 className="font-semibold mb-2">Comentarios Adicionales</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{response.providerComments}</p>
              </div>
            )}

            {/* Información adicional */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>Enviada el: {new Date(response.createdAt).toLocaleString('es-AR')}</p>
              {response.updatedAt !== response.createdAt && (
                <p>Última actualización: {new Date(response.updatedAt).toLocaleString('es-AR')}</p>
              )}
              {response.viewedAt && (
                <p>Vista por el cliente: {new Date(response.viewedAt).toLocaleString('es-AR')}</p>
              )}
            </div>

            {/* Alerta de edición */}
            {canEdit && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">Podés editar esta oferta</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Como el cliente aún no ha visto tu oferta, podés modificarla si lo deseás.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!canEdit && !hasClientReview && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Oferta no editable</p>
                    <p className="text-sm text-gray-700 mt-1">
                      El cliente ya ha visto esta oferta. Si necesitás modificar las condiciones, podés negociar las cláusulas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasClientReview && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">Cliente ha revisado tu oferta</p>
                      <p className="text-sm text-blue-800 mt-1">
                        El cliente ha respondido a las cláusulas de tu oferta. Haz clic para ver los detalles y responder.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowReviewModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Negociaciones
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontró la oferta</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
          {hasClientReview && (
            <Button
              onClick={() => setShowReviewModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ver Negociaciones
            </Button>
          )}
          {canEdit && onEdit && (
            <Button
              onClick={() => {
                onEdit(response);
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Oferta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Modal de revisión de negociaciones */}
    {response && (
      <ProviderResponseReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        quoteResponseId={response.id}
        onResponseUpdated={fetchMyResponse}
      />
    )}
    </>
  );
}
