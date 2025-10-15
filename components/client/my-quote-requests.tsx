
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Clock, Eye, Edit, XCircle, Loader2, CheckCircle, DollarSign, Zap, Factory, Building2 } from 'lucide-react';
import ViewQuoteResponsesModal from './view-quote-responses-modal';
import CloseQuoteRequestModal from './close-quote-request-modal';
import EditQuoteRequestModal from './edit-quote-request-modal';

interface QuoteRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string;
  createdAt: string;
  termMonths: number;
  preferredEnergySource: string | null;
  _count: {
    responses: number;
  };
}

interface AwardableOffer {
  id: string;
  energyPricePerMWh: number;
  powerPricePerKW: number;
  totalEstimated: number;
  generationSource: string;
  quoteRequestId: string;
  quoteRequest: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    deadline: string;
    createdAt: string;
    termMonths: number;
    preferredEnergySource: string | null;
  };
  provider: {
    id: string;
    name: string;
    companyName: string;
    email: string;
  };
  review: {
    allClausesAccepted: boolean;
  };
}

export default function MyQuoteRequests({ clientId }: { clientId: string }) {
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [awardableOffers, setAwardableOffers] = useState<AwardableOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAwardable, setLoadingAwardable] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para modales
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);

  useEffect(() => {
    fetchQuoteRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'awardable') {
      fetchAwardableOffers();
    }
  }, [activeTab]);

  const fetchQuoteRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quote-requests');
      
      if (!response.ok) {
        throw new Error('Error al cargar las solicitudes');
      }

      const data = await response.json();
      setRequests(data.quoteRequests || []);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchAwardableOffers = async () => {
    try {
      setLoadingAwardable(true);
      const response = await fetch('/api/quote-requests/awardable-offers');
      
      if (!response.ok) {
        throw new Error('Error al cargar las ofertas adjudicables');
      }

      const data = await response.json();
      setAwardableOffers(data.offers || []);
    } catch (err) {
      console.error('Error al cargar ofertas adjudicables:', err);
    } finally {
      setLoadingAwardable(false);
    }
  };

  const handleAwardOffer = async (offerId: string, offerTitle: string) => {
    if (!confirm(`¿Estás seguro de que deseas adjudicar la oferta de ${offerTitle}?`)) {
      return;
    }

    try {
      setLoadingAwardable(true);
      const response = await fetch(`/api/quote-responses/${offerId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Error al adjudicar la oferta');
      }

      alert('Oferta adjudicada exitosamente. El contrato se encuentra en la pestaña "Contratos" → "Contratos Pendientes de Firma".');
      
      // Refrescar la página completa para cargar los nuevos contratos
      window.location.reload();
    } catch (err) {
      console.error('Error al adjudicar oferta:', err);
      alert('Error al adjudicar la oferta');
    } finally {
      setLoadingAwardable(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'ACTIVE': { label: 'Activa', variant: 'default' },
      'CLOSED': { label: 'Cerrada', variant: 'secondary' },
      'EXPIRED': { label: 'Vencida', variant: 'destructive' },
      'AWARDED': { label: 'Adjudicada', variant: 'outline' }
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewOffers = (request: QuoteRequest) => {
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const handleEdit = (request: QuoteRequest) => {
    setSelectedRequest(request);
    setEditModalOpen(true);
  };

  const handleClose = (request: QuoteRequest) => {
    setSelectedRequest(request);
    setCloseModalOpen(true);
  };

  const handleSuccess = () => {
    fetchQuoteRequests();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchQuoteRequests} className="mt-4">Reintentar</Button>
        </CardContent>
      </Card>
    );
  }

  // Agrupar ofertas adjudicables por solicitud
  const offersGroupedByRequest = awardableOffers.reduce((acc, offer) => {
    if (!acc[offer.quoteRequestId]) {
      acc[offer.quoteRequestId] = {
        requestInfo: offer.quoteRequest,
        offers: []
      };
    }
    acc[offer.quoteRequestId].offers.push(offer);
    return acc;
  }, {} as Record<string, { requestInfo: AwardableOffer['quoteRequest'], offers: AwardableOffer[] }>);

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-gray-200 shadow-sm">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Todas las Solicitudes</span>
          </TabsTrigger>
          <TabsTrigger value="awardable" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Adjudicables</span>
            {awardableOffers.length > 0 && (
              <Badge className="ml-2 bg-green-600">{awardableOffers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Todas las Solicitudes */}
        <TabsContent value="all" className="space-y-4">
        {requests.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tenés solicitudes de cotización</p>
              <p className="text-sm text-gray-400 mt-2">Creá tu primera solicitud para recibir ofertas de proveedores</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-2">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Vence: {new Date(request.deadline).toLocaleDateString('es-AR')}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Creada: {new Date(request.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-lg px-4 py-2">
                      <p className="text-2xl font-bold text-blue-600">{request._count?.responses || 0}</p>
                      <p className="text-xs text-blue-600">Ofertas recibidas</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Plazo:</strong> {request.termMonths} meses</p>
                      {request.preferredEnergySource && (
                        <p className="mt-1"><strong>Fuente:</strong> {request.preferredEnergySource}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewOffers(request)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Ofertas
                    </Button>
                    {request.status === 'ACTIVE' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(request)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleClose(request)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Cerrar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        </TabsContent>

        {/* Tab: Ofertas Adjudicables */}
        <TabsContent value="awardable" className="space-y-6">
          {loadingAwardable ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : Object.keys(offersGroupedByRequest).length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tenés ofertas listas para adjudicar</p>
                <p className="text-sm text-gray-400 mt-2">
                  Las ofertas aparecerán aquí cuando hayas aceptado todas las cláusulas
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(offersGroupedByRequest).map(([requestId, { requestInfo, offers }]) => (
              <Card key={requestId} className="border-2 border-green-200 shadow-lg">
                <CardHeader className="bg-green-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span>{requestInfo.title}</span>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Ofertas con todas las cláusulas aceptadas
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-600">
                      {offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'} adjudicable{offers.length === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {offers.map((offer) => (
                      <div key={offer.id} className="border-2 border-green-300 rounded-lg p-6 bg-gradient-to-r from-green-50 to-white hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 rounded-lg p-2">
                              <Building2 className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{offer.provider.companyName || offer.provider.name}</h3>
                              <p className="text-sm text-gray-600">{offer.provider.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">Todas las cláusulas aceptadas</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-green-100 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Zap className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-gray-600">Precio Energía</span>
                            </div>
                            <p className="text-lg font-bold text-green-700">
                              ${offer.energyPricePerMWh.toFixed(2)}/MWh
                            </p>
                          </div>

                          <div className="bg-purple-100 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Factory className="h-4 w-4 text-purple-600" />
                              <span className="text-xs text-gray-600">Precio Potencia</span>
                            </div>
                            <p className="text-lg font-bold text-purple-700">
                              ${offer.powerPricePerKW.toFixed(2)}/kW-mes
                            </p>
                          </div>

                          <div className="bg-blue-100 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                              <span className="text-xs text-gray-600">Total Estimado</span>
                            </div>
                            <p className="text-lg font-bold text-blue-700">
                              ${offer.totalEstimated.toLocaleString('es-AR')}
                            </p>
                          </div>

                          <div className="bg-orange-100 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Factory className="h-4 w-4 text-orange-600" />
                              <span className="text-xs text-gray-600">Fuente</span>
                            </div>
                            <p className="text-sm font-medium text-orange-700">
                              {offer.generationSource}
                            </p>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p className="font-semibold text-green-900">¿Por qué esta oferta es adjudicable?</p>
                          </div>
                          <ul className="text-sm text-green-800 space-y-1 ml-7">
                            <li>✓ Has revisado todas las cláusulas de esta oferta</li>
                            <li>✓ Has aceptado todas las condiciones propuestas</li>
                            <li>✓ El proveedor aceptó tus contrapropuestas (si las hubo)</li>
                            <li>✓ La oferta está lista para ser formalizada en un contrato</li>
                          </ul>
                        </div>

                        <div className="flex space-x-3">
                          <Button 
                            size="lg" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleAwardOffer(offer.id, offer.provider.companyName || offer.provider.name)}
                            disabled={loadingAwardable}
                          >
                            {loadingAwardable ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Adjudicando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Adjudicar Oferta
                              </>
                            )}
                          </Button>
                          <Button 
                            size="lg" 
                            variant="outline"
                            onClick={() => {
                              // Usar requestInfo con todos los campos que ahora vienen de la API
                              setSelectedRequest({ 
                                ...requestInfo,
                                _count: { responses: offers.length }
                              });
                              setViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-5 w-5 mr-2" />
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modales */}
      {selectedRequest && (
        <>
          <ViewQuoteResponsesModal
            isOpen={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedRequest(null);
            }}
            quoteRequestId={selectedRequest.id}
            clientId={clientId}
          />

          <EditQuoteRequestModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedRequest(null);
            }}
            quoteRequestId={selectedRequest.id}
            onSuccess={handleSuccess}
          />

          <CloseQuoteRequestModal
            isOpen={closeModalOpen}
            onClose={() => {
              setCloseModalOpen(false);
              setSelectedRequest(null);
            }}
            quoteRequestId={selectedRequest.id}
            quoteRequestTitle={selectedRequest.title}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </>
  );
}
