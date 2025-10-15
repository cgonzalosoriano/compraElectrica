

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Clock, Eye, DollarSign, Zap, TrendingUp, Search, Building2, Loader2, Edit, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import ViewQuoteRequestDetailsModal from './view-quote-request-details-modal';
import SendQuoteResponseModal from './send-quote-response-modal';
import ViewMyQuoteResponseModal from './view-my-quote-response-modal';

export default function MyQuoteResponsesList({ providerId }: { providerId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para modales
  const [viewRequestModalOpen, setViewRequestModalOpen] = useState(false);
  const [editResponseModalOpen, setEditResponseModalOpen] = useState(false);
  const [viewMyResponseModalOpen, setViewMyResponseModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);

  useEffect(() => {
    fetchMyResponses();
  }, []);

  const fetchMyResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quote-requests/my-responses');
      
      if (!response.ok) {
        throw new Error('Error al cargar tus ofertas');
      }

      const data = await response.json();
      setResponses(data.responses || []);
    } catch (err) {
      console.error('Error al cargar ofertas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    // Esperar un momento para que la base de datos se actualice completamente
    setTimeout(() => {
      fetchMyResponses();
    }, 500);
  };

  const getResponseStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string, className: string, icon: any }> = {
      'SUBMITTED': { label: 'Oferta Enviada', className: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle },
      'UPDATED': { label: 'Oferta Actualizada', className: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
      'DRAFT': { label: 'Borrador', className: 'bg-gray-100 text-gray-700 border-gray-300', icon: AlertCircle },
      'ACCEPTED': { label: 'Oferta Aceptada ✓', className: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
      'REJECTED': { label: 'Oferta Rechazada', className: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
      'ALL_CLAUSES_ACCEPTED': { label: 'En Proceso de Contrato', className: 'bg-purple-100 text-purple-700 border-purple-300', icon: CheckCircle }
    };
    
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-300', icon: AlertCircle };
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.className} border flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getRequestStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'ACTIVE': { label: 'Activa', variant: 'default' },
      'CLOSED': { label: 'Cerrada', variant: 'secondary' },
      'EXPIRED': { label: 'Vencida', variant: 'destructive' },
      'AWARDED': { label: 'Adjudicada', variant: 'outline' }
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewRequestDetails = (responseData: any) => {
    setSelectedResponse(responseData);
    setViewRequestModalOpen(true);
  };

  const handleViewMyResponse = (responseData: any) => {
    setSelectedResponse(responseData);
    setViewMyResponseModalOpen(true);
  };

  const handleEditResponse = (responseData: any) => {
    setSelectedResponse(responseData);
    setEditResponseModalOpen(true);
  };

  // Calcular totales de energía y potencia
  const calculateTotals = (periods: any[]) => {
    const totalEnergy = periods.reduce((sum, p) => sum + (p.energyMWh || 0), 0);
    const avgPower = periods.length > 0 
      ? periods.reduce((sum, p) => sum + (p.powerKW || 0), 0) / periods.length 
      : 0;
    return { totalEnergy, avgPower };
  };

  const filteredResponses = responses.filter(response =>
    response.quoteRequest?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.quoteRequest?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.quoteRequest?.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Button onClick={fetchMyResponses} className="mt-4">Reintentar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Buscador */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título, descripción o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de ofertas realizadas */}
        {filteredResponses.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes ofertas realizadas</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm ? 'Intentá con otros términos de búsqueda' : 'Cuando envíes ofertas a solicitudes de cotización, aparecerán aquí'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredResponses.map((responseData) => {
            const request = responseData.quoteRequest;
            const myResponse = responseData.myResponse;
            const totals = calculateTotals(request.periods || []);
            
            return (
              <Card key={responseData.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getRequestStatusBadge(request.status)}
                        {getResponseStatusBadge(myResponse.status)}
                        {myResponse.viewedByClient && (
                          <Badge className="bg-purple-100 text-purple-700 border border-purple-300 flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>Vista por el cliente</span>
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {request.description || 'Sin descripción'}
                      </CardDescription>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {request.client?.companyName || request.client?.name || 'Cliente'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Vence: {new Date(request.deadline).toLocaleDateString('es-AR')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Plazo: {request.termMonths} meses
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Información de la solicitud */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Energía Solicitada</p>
                          <p className="text-lg font-bold text-blue-600">{totals.totalEnergy.toFixed(0)} MWh</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-600">Potencia Prom.</p>
                          <p className="text-lg font-bold text-green-600">{totals.avgPower.toFixed(0)} kW</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-600">Total Ofertas</p>
                          <p className="text-lg font-bold text-orange-600">{request._count?.responses || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-600">Mi Oferta Total</p>
                          <p className="text-lg font-bold text-purple-600">
                            {myResponse.totalEstimated 
                              ? `$${myResponse.totalEstimated.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalles de mi oferta */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Mi Oferta:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {myResponse.energyPricePerMWh && (
                        <div>
                          <p className="text-gray-600">Precio Energía:</p>
                          <p className="font-bold text-gray-900">${myResponse.energyPricePerMWh}/MWh</p>
                        </div>
                      )}
                      {myResponse.powerPricePerKW && (
                        <div>
                          <p className="text-gray-600">Precio Potencia:</p>
                          <p className="font-bold text-gray-900">${myResponse.powerPricePerKW}/kW</p>
                        </div>
                      )}
                      {myResponse.deliveryNode && (
                        <div>
                          <p className="text-gray-600">Nodo:</p>
                          <p className="font-bold text-gray-900">{myResponse.deliveryNode}</p>
                        </div>
                      )}
                      {myResponse.generationSource && (
                        <div>
                          <p className="text-gray-600">Fuente:</p>
                          <p className="font-bold text-gray-900">{myResponse.generationSource}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Oferta enviada el {new Date(myResponse.createdAt).toLocaleDateString('es-AR')}
                      {myResponse.updatedAt !== myResponse.createdAt && (
                        <span> • Actualizada el {new Date(myResponse.updatedAt).toLocaleDateString('es-AR')}</span>
                      )}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewRequestDetails(responseData)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Solicitud
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewMyResponse(responseData)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Mi Oferta
                      </Button>
                      {myResponse.status !== 'ACCEPTED' && myResponse.status !== 'REJECTED' && request.status === 'ACTIVE' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleEditResponse(responseData)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Oferta
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modales */}
      {selectedResponse && (
        <>
          <ViewQuoteRequestDetailsModal
            isOpen={viewRequestModalOpen}
            onClose={() => {
              setViewRequestModalOpen(false);
              setSelectedResponse(null);
            }}
            quoteRequest={selectedResponse.quoteRequest}
          />

          <SendQuoteResponseModal
            isOpen={editResponseModalOpen}
            onClose={() => {
              setEditResponseModalOpen(false);
              setSelectedResponse(null);
            }}
            quoteRequest={selectedResponse.quoteRequest}
            existingResponse={selectedResponse.myResponse}
            onSuccess={handleSuccess}
          />

          <ViewMyQuoteResponseModal
            isOpen={viewMyResponseModalOpen}
            onClose={() => {
              setViewMyResponseModalOpen(false);
              setSelectedResponse(null);
            }}
            quoteRequestId={selectedResponse.quoteRequestId}
            onEdit={(response) => handleEditResponse(selectedResponse)}
          />
        </>
      )}
    </>
  );
}

