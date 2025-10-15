
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Clock, Eye, DollarSign, Zap, TrendingUp, Search, Building2, Loader2 } from 'lucide-react';
import ViewQuoteRequestDetailsModal from './view-quote-request-details-modal';
import SendQuoteResponseModal from './send-quote-response-modal';
import ViewMyQuoteResponseModal from './view-my-quote-response-modal';

export default function QuoteRequestsList({ providerId }: { providerId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para modales
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [sendResponseModalOpen, setSendResponseModalOpen] = useState(false);
  const [viewMyResponseModalOpen, setViewMyResponseModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [editingResponse, setEditingResponse] = useState<any>(null);

  useEffect(() => {
    fetchQuoteRequests();
  }, []);

  const fetchQuoteRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quote-requests/available');
      
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

  const handleSuccess = () => {
    // Esperar un momento para que la base de datos se actualice completamente
    setTimeout(() => {
      fetchQuoteRequests();
    }, 500);
  };

  // Datos de ejemplo para desarrollo (comentados después de cargar desde API)
  const mockRequests = [
    {
      id: '1',
      title: 'Compra de energía renovable para planta industrial',
      description: 'Necesitamos suministro de energía renovable para nuestra planta en Buenos Aires',
      client: {
        name: 'Industrias del Norte SA',
        companyName: 'Industrias del Norte SA'
      },
      termMonths: 12,
      deadline: '2025-10-15T23:59:59',
      responsesCount: 5,
      myResponseStatus: null, // 'SUBMITTED', 'UPDATED', null
      status: 'ACTIVE',
      createdAt: '2025-10-01T10:00:00',
      totalEnergyMWh: 1200,
      totalPowerKW: 500
    },
    {
      id: '2',
      title: 'Suministro de energía térmica - 24 meses',
      description: 'Buscamos proveedor para energía térmica con contratos de largo plazo',
      client: {
        name: 'Metalúrgica del Sur',
        companyName: 'Metalúrgica del Sur'
      },
      termMonths: 24,
      deadline: '2025-10-20T23:59:59',
      responsesCount: 3,
      myResponseStatus: 'SUBMITTED',
      status: 'ACTIVE',
      createdAt: '2025-09-28T14:30:00',
      totalEnergyMWh: 2400,
      totalPowerKW: 800
    },
    {
      id: '3',
      title: 'Energía solar para parque industrial',
      description: 'Parque industrial busca proveedor de energía 100% solar',
      client: {
        name: 'Parque Industrial La Plata',
        companyName: 'Parque Industrial La Plata'
      },
      termMonths: 36,
      deadline: '2025-10-10T23:59:59',
      responsesCount: 8,
      myResponseStatus: null,
      status: 'ACTIVE',
      createdAt: '2025-09-25T09:00:00',
      totalEnergyMWh: 3600,
      totalPowerKW: 1200
    }
  ];

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

  const getMyResponseBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusConfig: Record<string, { label: string, className: string }> = {
      'SUBMITTED': { label: 'Oferta Enviada', className: 'bg-blue-100 text-blue-700' },
      'UPDATED': { label: 'Oferta Actualizada', className: 'bg-green-100 text-green-700' },
      'ACCEPTED': { label: 'Oferta Aceptada', className: 'bg-green-100 text-green-700' },
      'REJECTED': { label: 'Oferta Rechazada', className: 'bg-red-100 text-red-700' }
    };
    
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const handleSendResponse = (request: any) => {
    setSelectedRequest(request);
    setSendResponseModalOpen(true);
  };

  const handleViewMyResponse = (request: any) => {
    setSelectedRequest(request);
    setViewMyResponseModalOpen(true);
  };

  const handleEditMyResponse = (request: any, response?: any) => {
    setSelectedRequest(request);
    setEditingResponse(response || null);
    setSendResponseModalOpen(true);
  };

  // Calcular totales de energía y potencia
  const calculateTotals = (periods: any[]) => {
    const totalEnergy = periods.reduce((sum, p) => sum + (p.energyMWh || 0), 0);
    const avgPower = periods.length > 0 
      ? periods.reduce((sum, p) => sum + (p.powerKW || 0), 0) / periods.length 
      : 0;
    return { totalEnergy, avgPower };
  };

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <Button onClick={fetchQuoteRequests} className="mt-4">Reintentar</Button>
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

        {/* Lista de solicitudes */}
        {filteredRequests.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay solicitudes de cotización disponibles</p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm ? 'Intentá con otros términos de búsqueda' : 'Cuando los clientes publiquen solicitudes, aparecerán aquí'}
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredRequests.map((request) => {
          const totals = calculateTotals(request.periods || []);
          return (
            <Card key={request.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusBadge(request.status)}
                      {getMyResponseBadge(request.myResponseStatus)}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Energía Total</p>
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
                        <p className="text-xs text-gray-600">Ofertas Recibidas</p>
                        <p className="text-lg font-bold text-orange-600">{request._count?.responses || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Plazo</p>
                        <p className="text-lg font-bold text-purple-600">{request.termMonths} meses</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Publicada el {new Date(request.createdAt).toLocaleDateString('es-AR')}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(request)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    {!request._count?.providerResponses || request._count.providerResponses === 0 ? (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleSendResponse(request)}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Enviar Oferta
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleViewMyResponse(request)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Mi Oferta
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
      {selectedRequest && (
        <>
          <ViewQuoteRequestDetailsModal
            isOpen={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedRequest(null);
            }}
            quoteRequest={selectedRequest}
          />

          <SendQuoteResponseModal
            isOpen={sendResponseModalOpen}
            onClose={() => {
              setSendResponseModalOpen(false);
              setSelectedRequest(null);
              setEditingResponse(null);
            }}
            quoteRequest={selectedRequest}
            existingResponse={editingResponse}
            onSuccess={handleSuccess}
          />

          <ViewMyQuoteResponseModal
            isOpen={viewMyResponseModalOpen}
            onClose={() => {
              setViewMyResponseModalOpen(false);
              setSelectedRequest(null);
            }}
            quoteRequestId={selectedRequest.id}
            onEdit={(response) => handleEditMyResponse(selectedRequest, response)}
          />
        </>
      )}
    </>
  );
}
