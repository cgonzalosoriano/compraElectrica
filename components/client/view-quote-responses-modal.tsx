
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Building2, DollarSign, Calendar, Zap, Factory, AlertCircle, CheckCircle, X, MessageSquare, Eye, Filter, ArrowUpDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OfferDetailReviewModal from './offer-detail-review-modal';

interface ViewQuoteResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteRequestId: string;
  clientId: string;
}

export default function ViewQuoteResponsesModal({
  isOpen,
  onClose,
  quoteRequestId,
  clientId,
}: ViewQuoteResponsesModalProps) {
  const [loading, setLoading] = useState(true);
  const [quoteRequest, setQuoteRequest] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<any[]>([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  
  // Estados para filtros y ordenamiento
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('price-asc');
  
  // Estados para los modales
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOfferForReview, setSelectedOfferForReview] = useState<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedOfferForContact, setSelectedOfferForContact] = useState<any>(null);
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    if (isOpen && quoteRequestId) {
      fetchResponses();
    }
  }, [isOpen, quoteRequestId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [responses, filterStatus, sortBy]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quote-requests/${quoteRequestId}/responses`);
      
      if (!response.ok) {
        throw new Error('Error al cargar las respuestas');
      }

      const data = await response.json();
      setQuoteRequest(data.quoteRequest);
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al cargar las ofertas recibidas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...responses];

    // Aplicar filtro por estado
    if (filterStatus === 'reviewed') {
      filtered = filtered.filter(r => r.review?.isReviewed);
    } else if (filterStatus === 'all-accepted') {
      filtered = filtered.filter(r => r.review?.allClausesAccepted);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(r => !r.review?.isReviewed);
    }

    // Aplicar ordenamiento
    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => (a.totalEstimated || 0) - (b.totalEstimated || 0));
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => (b.totalEstimated || 0) - (a.totalEstimated || 0));
    } else if (sortBy === 'energy-asc') {
      filtered.sort((a, b) => (a.energyPricePerMWh || 0) - (b.energyPricePerMWh || 0));
    } else if (sortBy === 'energy-desc') {
      filtered.sort((a, b) => (b.energyPricePerMWh || 0) - (a.energyPricePerMWh || 0));
    } else if (sortBy === 'power-asc') {
      filtered.sort((a, b) => (a.powerPricePerKW || 0) - (b.powerPricePerKW || 0));
    } else if (sortBy === 'power-desc') {
      filtered.sort((a, b) => (b.powerPricePerKW || 0) - (a.powerPricePerKW || 0));
    } else if (sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    setFilteredResponses(filtered);
  };

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  const handleViewOffer = (response: any) => {
    setSelectedOfferForReview(response);
    setShowReviewModal(true);
  };

  const handleContactProvider = (response: any) => {
    setSelectedOfferForContact(response);
    setContactMessage('');
    setShowContactModal(true);
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim()) {
      showAlert('Por favor escribe un mensaje', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/quote-responses/${selectedOfferForContact.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contactMessage,
          clientId: clientId,
          providerId: selectedOfferForContact.providerId
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje');
      }

      showAlert('Mensaje enviado exitosamente al proveedor', 'success');
      setShowContactModal(false);
      setContactMessage('');
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al enviar el mensaje', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'SUBMITTED': { label: 'Enviada', variant: 'default' },
      'UPDATED': { label: 'Actualizada', variant: 'secondary' },
      'ACCEPTED': { label: 'Aceptada', variant: 'outline' },
      'REJECTED': { label: 'Rechazada', variant: 'destructive' },
    };
    
    const c = config[status] || { label: status, variant: 'outline' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ofertas Recibidas</DialogTitle>
            <DialogDescription>
              {quoteRequest?.title}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información de la solicitud */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Plazo:</span>
                      <p className="font-medium">{quoteRequest?.termMonths} meses</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Vence:</span>
                      <p className="font-medium">{new Date(quoteRequest?.deadline).toLocaleDateString('es-AR')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Fuente preferida:</span>
                      <p className="font-medium">{quoteRequest?.preferredEnergySource || 'Indistinto'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ofertas recibidas:</span>
                      <p className="font-medium text-blue-600">{responses.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filtros y Ordenamiento */}
              {responses.length > 0 && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          Filtrar por estado
                        </Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las ofertas</SelectItem>
                            <SelectItem value="pending">Pendientes de revisión</SelectItem>
                            <SelectItem value="reviewed">Revisadas</SelectItem>
                            <SelectItem value="all-accepted">Todas las cláusulas aceptadas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 flex items-center">
                          <ArrowUpDown className="h-4 w-4 mr-2" />
                          Ordenar por
                        </Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger>
                            <SelectValue placeholder="Ordenar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price-asc">Precio Total (menor a mayor)</SelectItem>
                            <SelectItem value="price-desc">Precio Total (mayor a menor)</SelectItem>
                            <SelectItem value="energy-asc">Precio Energía (menor a mayor)</SelectItem>
                            <SelectItem value="energy-desc">Precio Energía (mayor a menor)</SelectItem>
                            <SelectItem value="power-asc">Precio Potencia (menor a mayor)</SelectItem>
                            <SelectItem value="power-desc">Precio Potencia (mayor a menor)</SelectItem>
                            <SelectItem value="date-desc">Más recientes</SelectItem>
                            <SelectItem value="date-asc">Más antiguas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de respuestas */}
              {responses.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aún no hay ofertas para esta solicitud</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Los proveedores verán tu solicitud y podrán enviar sus propuestas
                  </p>
                </div>
              ) : filteredResponses.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay ofertas que coincidan con los filtros seleccionados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredResponses.map((response) => (
                    <Card key={response.id} className="border-2 hover:border-blue-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 rounded-lg p-2">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{response.provider.companyName || response.provider.name}</h3>
                              <p className="text-sm text-gray-600">{response.provider.email}</p>
                            </div>
                          </div>
                          {getStatusBadge(response.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Zap className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-gray-600">Precio Energía</span>
                            </div>
                            <p className="text-lg font-bold text-green-600">
                              ${response.energyPricePerMWh?.toFixed(2)}/MWh
                            </p>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Factory className="h-4 w-4 text-purple-600" />
                              <span className="text-xs text-gray-600">Precio Potencia</span>
                            </div>
                            <p className="text-lg font-bold text-purple-600">
                              ${response.powerPricePerKW?.toFixed(2)}/kW-mes
                            </p>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                              <span className="text-xs text-gray-600">Total Estimado</span>
                            </div>
                            <p className="text-lg font-bold text-blue-600">
                              ${response.totalEstimated?.toLocaleString('es-AR') || 'N/A'}
                            </p>
                          </div>

                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Factory className="h-4 w-4 text-orange-600" />
                              <span className="text-xs text-gray-600">Fuente</span>
                            </div>
                            <p className="text-sm font-medium text-orange-600">
                              {response.generationSource || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {response.providerComments && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-600">
                              <strong>Comentarios del proveedor:</strong>
                            </p>
                            <p className="text-sm text-gray-700 mt-1">{response.providerComments}</p>
                          </div>
                        )}

                        {/* Estado de revisión */}
                        {response.review?.isReviewed && (
                          <div className={`rounded-lg p-3 mb-4 ${
                            response.review.allClausesAccepted 
                              ? 'bg-green-50 border-2 border-green-200' 
                              : 'bg-orange-50 border-2 border-orange-200'
                          }`}>
                            <div className="flex items-center space-x-2">
                              {response.review.allClausesAccepted ? (
                                <>
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  <span className="text-sm font-semibold text-green-800">
                                    Todas las cláusulas aceptadas
                                  </span>
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="h-5 w-5 text-orange-600" />
                                  <span className="text-sm font-semibold text-orange-800">
                                    Revisión en progreso
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleViewOffer(response)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {response.review?.allClausesAccepted ? 'Ver Detalles' : 'Revisar Oferta'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleContactProvider(response)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contactar
                          </Button>
                          {response.review?.allClausesAccepted && (
                            <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1 flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4" />
                              <span>Lista para adjudicar</span>
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
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

      {/* Modal de Revisión Detallada */}
      {showReviewModal && selectedOfferForReview && (
        <OfferDetailReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedOfferForReview(null);
            fetchResponses();
          }}
          quoteResponse={selectedOfferForReview}
          quoteRequest={quoteRequest}
          onOfferAccepted={() => {
            fetchResponses();
            showAlert('Oferta aceptada exitosamente', 'success');
          }}
        />
      )}

      {/* Modal de Contacto */}
      {showContactModal && selectedOfferForContact && (
        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span>Contactar Proveedor</span>
              </DialogTitle>
              <DialogDescription>
                Envía un mensaje a {selectedOfferForContact.provider?.companyName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-message">Tu mensaje</Label>
                <Textarea
                  id="contact-message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Escribe tu consulta o comentario..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowContactModal(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={loading || !contactMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Enviar Mensaje
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
