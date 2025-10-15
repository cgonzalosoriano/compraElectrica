
'use client';

import { useState } from 'react';
import { User, Offer } from '@prisma/client';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateOfferDialog from '@/components/provider/create-offer-dialog';
import EditOfferDialog from '@/components/provider/edit-offer-dialog';
import { 
  Zap, 
  Factory, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Plus,
  LogOut,
  User as UserIcon,
  FileText,
  MessageSquare,
  Settings,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban
} from 'lucide-react';
import ContractModal from '../modals/ContractModal';
import ContractViewModal from '../modals/ContractViewModal';
import MessageModal from '../modals/MessageModal';
import ClauseNegotiationsList from './clause-negotiations-list';
import ContractSigningModal from '../modals/ContractSigningModal';
import ContactModal from '../modals/ContactModal';
import QuoteRequestsList from './quote-requests-list';
import MyQuoteResponsesList from './my-quote-responses-list';

interface ExtendedClientOffer {
  id: string;
  offerId: string | null;
  clientId: string;
  userNumber: string | null;
  distributorName: string | null;
  region: string | null;
  address: string | null;
  tariffType: string | null;
  requestedVolume: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  client: User;
  _contractType?: 'offer' | 'quote'; // Tipo de contrato para el modal
}

interface ExtendedOffer extends Offer {
  clientOffers: ExtendedClientOffer[];
  transactions: Array<{
    id: string;
    status: string;
    totalAmount: number;
  }>;
}

interface ExtendedUser extends User {
  offers: ExtendedOffer[];
}

interface ProviderDashboardProps {
  provider: ExtendedUser;
}

export default function ProviderDashboard({ provider }: ProviderDashboardProps) {
  const { data: session } = useSession() || {};
  const [activeTab, setActiveTab] = useState('dashboard');
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [editOfferOpen, setEditOfferOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractViewModalOpen, setContractViewModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedClientOffer, setSelectedClientOffer] = useState<ExtendedClientOffer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  // Nuevos estados para los modales
  const [providerContractSigningModalOpen, setProviderContractSigningModalOpen] = useState(false);
  const [providerContactModalOpen, setProviderContactModalOpen] = useState(false);
  
  // Estado para rastrear el contexto de la sección (ofertar vs cotizar)
  const [sectionContext, setSectionContext] = useState<'offer' | 'quote'>('offer');
  
  const router = useRouter();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleOfferCreated = () => {
    // Refrescar la página para mostrar la nueva oferta
    router.refresh();
  };

  const handleOfferUpdated = () => {
    // Refrescar la página para mostrar los cambios
    router.refresh();
  };

  const handleEditOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
    setEditOfferOpen(true);
  };

  const handleDeleteOffer = async (offerId: string, offerTitle: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar la oferta "${offerTitle}"?\n\nEsta acción no se puede deshacer. Se eliminarán también todas las solicitudes pendientes asociadas.`
    );

    if (!confirmDelete) return;

    setDeleteLoading(offerId);

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        alert('Oferta eliminada exitosamente');
        router.refresh();
      } else {
        alert(result.error || 'Error al eliminar la oferta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al eliminar la oferta');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'ACCEPTED' | 'REJECTED', message?: string) => {
    try {
      const response = await fetch(`/api/client-offers/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action,
          message: message || null
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Mostrar mensaje de éxito (podrías usar un toast aquí)
        alert(result.message);
        // Refrescar la página para mostrar los cambios
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    }
  };

  // Función para rechazar contrato (proveedor)
  const handleRejectContract = async (contractId: string, contractTitle: string, isQuoteContract: boolean = false) => {
    const reason = window.prompt(`¿Por qué deseas rechazar el contrato "${contractTitle}"? (opcional)`);
    
    if (reason === null) return; // Usuario canceló
    
    try {
      // Determinar la API correcta según el tipo de contrato
      const apiPath = isQuoteContract 
        ? `/api/quote-contracts/${contractId}/reject`
        : `/api/contracts/${contractId}/reject`;
      
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || 'Sin especificar' })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        window.location.reload(); // Refrescar para mostrar los cambios
      } else {
        const error = await response.json();
        alert(error.error || 'Error al rechazar el contrato');
      }
    } catch (error) {
      console.error('Error rejecting contract:', error);
      alert('Error al rechazar el contrato');
    }
  };

  // Función para descargar contrato final
  const handleDownloadContract = async (clientOfferId: string) => {
    try {
      const response = await fetch(`/api/contracts/${clientOfferId}/download-final`);
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Error al descargar el contrato');
        return;
      }

      const data = await response.json();
      
      // Crear un elemento <a> temporal para iniciar la descarga
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.target = '_blank';
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar contrato:', error);
      alert('Error al descargar el contrato');
    }
  };

  // Función para abrir modal de contacto (proveedor)
  const handleContactClient = (clientOffer: ExtendedClientOffer) => {
    setSelectedClientOffer(clientOffer);
    setProviderContactModalOpen(true);
  };

  // Función para abrir modal de firma (proveedor)
  const handleProviderSignContract = (clientOffer: ExtendedClientOffer, contractType: 'offer' | 'quote' = 'offer') => {
    setSelectedClientOffer({ ...clientOffer, _contractType: contractType });
    setProviderContractSigningModalOpen(true);
  };

  // Función para calcular el volumen disponible de una oferta
  const calculateAvailableVolume = (offer: ExtendedOffer) => {
    // Solo contar las solicitudes que aún están referenciadas a esta oferta
    const acceptedVolume = offer.clientOffers
      ?.filter(co => co.offerId === offer.id && (co.status === 'ACCEPTED' || co.status === 'NEGOTIATING' || co.status === 'COMPLETED'))
      ?.reduce((sum, co) => sum + (co.requestedVolume || 0), 0) || 0;
    return Math.max(0, offer.availableVolume - acceptedVolume);
  };

  // Separar ofertas disponibles de ofertas con solicitudes
  const availableOffers = provider.offers?.filter(offer => {
    const availableVolume = calculateAvailableVolume(offer);
    return availableVolume > 0 && offer.status === 'ACTIVE';
  }) || [];

  const offersWithRequests = provider.offers?.filter(offer => {
    return offer.clientOffers?.some(co => co.status === 'ACCEPTED' || co.status === 'PENDING' || co.status === 'NEGOTIATING');
  }) || [];

  // Calcular estadísticas
  const stats = {
    totalOffers: provider.offers?.length || 0,
    activeOffers: availableOffers.length,
    pendingRequests: provider.offers?.reduce((sum, o) => sum + (o.clientOffers?.filter(co => co.status === 'PENDING')?.length || 0), 0) || 0,
    totalRevenue: provider.offers?.reduce((sum, o) => sum + (o.transactions?.reduce((tSum, t) => tSum + (t.totalAmount || 0), 0) || 0), 0) || 0
  };

  // Función para manejar el cambio de tab y actualizar el contexto
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    
    // Actualizar el contexto según el tab seleccionado
    if (newTab === 'quote-requests' || newTab === 'offered-quotes') {
      setSectionContext('quote');
    } else if (newTab === 'offers' || newTab === 'requests' || newTab === 'negotiations') {
      setSectionContext('offer');
    }
    // No cambiamos el contexto para 'contracts', 'messages', 'profile' - mantienen el contexto actual
  };

  // Tabs visibles según el contexto
  const visibleTabs = sectionContext === 'quote'
    ? ['quote-requests', 'offered-quotes', 'contracts', 'messages', 'profile']  // Solo tabs relevantes para solicitudes de cotización
    : ['offers', 'requests', 'negotiations', 'contracts', 'messages', 'profile'];  // Tabs para ofertas del proveedor

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-lg p-2">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Panel Proveedor</h1>
                <p className="text-sm text-gray-600">{provider?.companyName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{provider?.name}</p>
                <p className="text-xs text-gray-600">{provider?.email}</p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="border-gray-200 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOffers}</p>
                  <p className="text-sm text-gray-600">Total Ofertas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-lg p-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeOffers}</p>
                  <p className="text-sm text-gray-600">Ofertas Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 rounded-lg p-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                  <p className="text-sm text-gray-600">Solicitudes Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 rounded-lg p-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.totalRevenue.toLocaleString('es-AR')}
                  </p>
                  <p className="text-sm text-gray-600">Ingresos Totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mostrar botones principales solo si no hay tab activo */}
        {activeTab === 'dashboard' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Qué querés hacer hoy?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Botón Gestionar Mis Ofertas */}
              <Card 
                className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => handleTabChange('offers')}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-6 group-hover:scale-110 transition-transform">
                      <Zap className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Gestionar Mis Ofertas
                      </h3>
                      <p className="text-gray-600">
                        Creá, editá y gestioná tus ofertas de energía publicadas en el mercado
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mt-4"
                    >
                      Gestionar Ofertas
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Botón Ver Solicitudes de Cotización */}
              <Card 
                className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => handleTabChange('quote-requests')}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-gradient-to-br from-blue-500 to-green-500 rounded-full p-6 group-hover:scale-110 transition-transform">
                      <DollarSign className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Ver Solicitudes de Cotización
                      </h3>
                      <p className="text-gray-600">
                        Explorá solicitudes de clientes y enviá tus ofertas personalizadas
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 mt-4"
                    >
                      Ver Solicitudes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Accesos Rápidos */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card 
                  className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTabChange('requests')}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Clock className="h-8 w-8 text-orange-600" />
                      <p className="text-sm font-medium text-gray-900">Solicitudes</p>
                      <Badge className="bg-orange-100 text-orange-800">
                        {stats.pendingRequests}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTabChange('negotiations')}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <MessageSquare className="h-8 w-8 text-blue-600" />
                      <p className="text-sm font-medium text-gray-900">Negociaciones</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTabChange('contracts')}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <FileText className="h-8 w-8 text-green-600" />
                      <p className="text-sm font-medium text-gray-900">Contratos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTabChange('profile')}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Settings className="h-8 w-8 text-gray-600" />
                      <p className="text-sm font-medium text-gray-900">Perfil</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {activeTab !== 'dashboard' && (
            <div className="flex items-center justify-between">
              <TabsList className="bg-white border border-gray-200 shadow-sm">
                {visibleTabs.includes('offers') && (
                  <TabsTrigger value="offers" className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Ofertar</span>
                  </TabsTrigger>
                )}
                {visibleTabs.includes('quote-requests') && (
                  <TabsTrigger value="quote-requests" className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Cotizar</span>
                  </TabsTrigger>
                )}
                {visibleTabs.includes('offered-quotes') && (
                  <TabsTrigger value="offered-quotes" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Ofertas Realizadas</span>
                  </TabsTrigger>
                )}
                {visibleTabs.includes('requests') && (
                  <TabsTrigger value="requests" className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Solicitudes</span>
                  </TabsTrigger>
                )}
                {visibleTabs.includes('negotiations') && (
                  <TabsTrigger value="negotiations" className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Negociaciones</span>
                  </TabsTrigger>
                )}
                {visibleTabs.includes('contracts') && (
                  <TabsTrigger value="contracts" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Contratos</span>
                  </TabsTrigger>
                )}
                {visibleTabs.includes('messages') && (
                  <TabsTrigger value="messages" className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Mensajes</span>
                  </TabsTrigger>
                )}
                {visibleTabs.includes('profile') && (
                  <TabsTrigger value="profile" className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Perfil</span>
                  </TabsTrigger>
                )}
              </TabsList>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleTabChange('dashboard')}
                className="border-gray-200 hover:bg-gray-50"
              >
                ← Volver al Inicio
              </Button>
            </div>
          )}

          {/* Mis Ofertas */}
          <TabsContent value="offers" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <span>Mis Ofertas de Energía</span>
                    </CardTitle>
                    <CardDescription>
                      Gestioná y monitoreá tus ofertas publicadas
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setCreateOfferOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Oferta
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {availableOffers.length > 0 ? (
                  <div className="space-y-4">
                    {availableOffers.map((offer) => {
                      const availableVolume = calculateAvailableVolume(offer);
                      const totalRequestedVolume = offer.clientOffers
                        ?.filter(co => co.status === 'ACCEPTED' || co.status === 'NEGOTIATING' || co.status === 'COMPLETED')
                        ?.reduce((sum, co) => sum + (co.requestedVolume || 0), 0) || 0;
                      
                      return (
                        <div key={offer.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">{offer.generationSource}</h3>
                              <p className="text-sm text-gray-600">{offer.deliveryNode}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              Disponible para nuevos clientes
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Precio Energía:</span>
                              <p className="font-medium">${offer.energyPrice}/MWh</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Volumen Disponible:</span>
                              <p className="font-medium text-green-600">{availableVolume.toLocaleString()} MWh</p>
                              {totalRequestedVolume > 0 && (
                                <p className="text-xs text-gray-500">
                                  (Original: {offer.availableVolume.toLocaleString()}, Comprometido: {totalRequestedVolume.toLocaleString()})
                                </p>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-500">Plazo:</span>
                              <p className="font-medium">{offer.term} meses</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Nuevas Solicitudes:</span>
                              <p className="font-medium">{offer.clientOffers?.filter(co => co.status === 'PENDING')?.length || 0}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditOffer(offer.id)}
                              className="hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteOffer(offer.id, offer.generationSource)}
                              disabled={deleteLoading === offer.id}
                              className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                            >
                              {deleteLoading === offer.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                                  Eliminando...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Eliminar
                                </>
                              )}
                            </Button>

                            {offer.clientOffers?.some(co => co.status === 'PENDING') && (
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleTabChange('requests')}
                              >
                                Ver Solicitudes ({offer.clientOffers?.filter(co => co.status === 'PENDING')?.length || 0})
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      {provider.offers && provider.offers.length > 0 
                        ? "Todas tus ofertas tienen solicitudes aceptadas o están agotadas"
                        : "No has publicado ofertas disponibles aún"
                      }
                    </p>
                    <Button 
                      onClick={() => setCreateOfferOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {provider.offers && provider.offers.length > 0 ? "Crear Nueva Oferta" : "Crear Primera Oferta"}
                    </Button>
                    {provider.offers && provider.offers.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Todas tus ofertas están en la pestaña "Solicitudes" porque ya tienen clientes interesados
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Solicitudes de Cotización (RFQ) */}
          <TabsContent value="quote-requests" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span>Solicitudes de Cotización de Clientes</span>
                </CardTitle>
                <CardDescription>
                  Explorá solicitudes de cotización publicadas por clientes y enviá tu oferta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuoteRequestsList providerId={provider.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ofertas Realizadas */}
          <TabsContent value="offered-quotes" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span>Mis Ofertas Realizadas</span>
                </CardTitle>
                <CardDescription>
                  Seguí el estado de tus ofertas enviadas y gestioná las negociaciones con clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MyQuoteResponsesList providerId={provider.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Solicitudes de Clientes */}
          <TabsContent value="requests" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Solicitudes de Clientes</span>
                </CardTitle>
                <CardDescription>
                  Solicitudes pendientes de aprobación de clientes interesados en tus ofertas
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {(() => {
                  // Obtener solo las solicitudes PENDIENTES
                  const pendingRequests = offersWithRequests?.flatMap(offer => 
                    offer.clientOffers?.filter(co => co.status === 'PENDING').map(clientOffer => ({
                      ...clientOffer,
                      offerDetails: offer,
                      hasOriginalOffer: true
                    })) || []
                  ) || [];
                  
                  // TODO: Agregar lógica para solicitudes sin oferta (eliminadas) 
                  // cuando se modifique la consulta del servidor
                  
                  return pendingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">{request.client?.name || request.client?.email}</h3>
                              <p className="text-sm text-gray-600">{request.client?.companyName}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge className={
                                request.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                                request.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {request.status === 'PENDING' ? 'Pendiente' :
                                 request.status === 'ACCEPTED' ? 'Aceptada' : 'Rechazada'}
                              </Badge>
                              <div className="text-sm text-gray-500">
                                {new Date(request.createdAt).toLocaleDateString('es-AR')}
                              </div>
                            </div>
                          </div>
                          
                          {/* Detalles de la oferta solicitada */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            {request.hasOriginalOffer && request.offerDetails ? (
                              <>
                                <h4 className="font-medium text-gray-900 mb-2">Oferta Solicitada</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Fuente:</span>
                                    <p className="font-medium">{request.offerDetails.generationSource}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Nodo:</span>
                                    <p className="font-medium">{request.offerDetails.deliveryNode}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Precio:</span>
                                    <p className="font-medium">${request.offerDetails.energyPrice}/MWh</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Volumen Restante:</span>
                                    <p className="font-medium text-blue-600">{calculateAvailableVolume(request.offerDetails).toLocaleString()} MWh</p>
                                    <p className="text-xs text-gray-500">
                                      Original: {request.offerDetails.availableVolume.toLocaleString()} MWh
                                    </p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                                  Oferta Eliminada - Condiciones Congeladas
                                </h4>
                                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                                  <p className="text-amber-800 mb-2">
                                    La oferta original fue eliminada, pero esta solicitud mantiene las condiciones acordadas al momento de la solicitud.
                                  </p>
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="text-amber-700">Volumen Solicitado:</span>
                                      <p className="font-medium">{request.requestedVolume?.toLocaleString()} MWh</p>
                                    </div>
                                    <div>
                                      <span className="text-amber-700">Estado:</span>
                                      <p className="font-medium">Negociación independiente</p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Información del cliente */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Información del Cliente</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Usuario Nro:</span>
                                  <span className="font-medium">{request.userNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Distribuidora:</span>
                                  <span className="font-medium">{request.distributorName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Región:</span>
                                  <span className="font-medium">{request.region}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Tipo Tarifa:</span>
                                  <span className="font-medium">{request.tariffType}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Detalles de Solicitud</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Volumen Solicitado:</span>
                                  <span className="font-medium">{request.requestedVolume?.toLocaleString()} MWh</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Valor Estimado:</span>
                                  <span className="font-medium text-green-600">
                                    {request.hasOriginalOffer && request.offerDetails 
                                      ? `$${((request.requestedVolume || 0) * request.offerDetails.energyPrice).toLocaleString('es-AR')}`
                                      : 'Ver condiciones en negociación'
                                    }
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Estado:</span>
                                  <span className="font-medium">
                                    {request.status === 'PENDING' ? 'Esperando respuesta' :
                                     request.status === 'ACCEPTED' ? 'Aceptada - Pendiente contrato' :
                                     'Rechazada'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Dirección */}
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Dirección de Suministro</h4>
                            <p className="text-sm text-gray-600">{request.address}</p>
                          </div>
                          
                          {/* Acciones */}
                          {request.status === 'PENDING' && (
                            <div className="flex space-x-3 pt-4 border-t">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  const confirmMessage = window.prompt('¿Deseas agregar un mensaje al cliente? (opcional)');
                                  if (confirmMessage !== null) { // Usuario no canceló
                                    handleRequestAction(request.id, 'ACCEPTED', confirmMessage || undefined);
                                  }
                                }}
                              >
                                Aceptar Solicitud
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  const confirmMessage = window.prompt('¿Deseas agregar un motivo del rechazo? (opcional)');
                                  if (confirmMessage !== null) { // Usuario no canceló
                                    handleRequestAction(request.id, 'REJECTED', confirmMessage || undefined);
                                  }
                                }}
                              >
                                Rechazar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedClientOffer(request);
                                  setMessageModalOpen(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Contactar Cliente
                              </Button>
                            </div>
                          )}
                          
                          {request.status === 'ACCEPTED' && (
                            <div className="flex space-x-3 pt-4 border-t">
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  setSelectedClientOffer(request);
                                  setContractModalOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Generar Contrato
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedClientOffer(request);
                                  setMessageModalOpen(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Contactar Cliente
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No tienes ofertas con solicitudes de clientes</p>
                      <p className="text-sm text-gray-500">Cuando los clientes se interesen en tus ofertas, aparecerán aquí junto con sus solicitudes</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Negociaciones por Cláusulas */}
          <TabsContent value="negotiations">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span>Negociaciones Activas</span>
                </CardTitle>
                <CardDescription>
                  Solicitudes en proceso de negociación con tus clientes
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {(() => {
                  // Obtener solo las solicitudes EN NEGOCIACIÓN
                  const negotiatingRequests = offersWithRequests?.flatMap(offer => 
                    offer.clientOffers?.filter(co => co.status === 'NEGOTIATING').map(clientOffer => ({
                      ...clientOffer,
                      offerDetails: offer,
                      hasOriginalOffer: true
                    })) || []
                  ) || [];
                  
                  return negotiatingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {negotiatingRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-6 bg-blue-50 border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {request.client?.name || request.client?.email}
                              </h3>
                              <p className="text-sm text-gray-600">{request.client?.companyName}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              En Negociación
                            </Badge>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">
                              {request.hasOriginalOffer && request.offerDetails ? 
                                request.offerDetails.generationSource : 'Condiciones Congeladas'}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Volumen:</span>
                                <p className="font-medium">{request.requestedVolume?.toLocaleString()} MWh</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Estado:</span>
                                <p className="font-medium text-blue-600">Negociando términos</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Iniciada el:</span>
                                <p className="font-medium">{new Date(request.updatedAt).toLocaleDateString('es-AR')}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Cliente desde:</span>
                                <p className="font-medium">{new Date(request.createdAt).toLocaleDateString('es-AR')}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Ver Negociación
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedClientOffer(request);
                                setMessageModalOpen(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Enviar Mensaje
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No tienes negociaciones activas</p>
                      <p className="text-sm text-gray-500">
                        Las negociaciones aparecerán aquí cuando los clientes inicien procesos de negociación
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <div className="space-y-6">
              {/* Contratos Pendientes de Firma */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span>Contratos Pendientes de Firma {sectionContext === 'offer' ? '(Ofertas)' : '(Cotizaciones)'}</span>
                  </CardTitle>
                  <CardDescription>
                    {sectionContext === 'offer' 
                      ? 'Contratos de tus ofertas aceptadas por clientes' 
                      : 'Contratos de cotizaciones enviadas y aceptadas por clientes'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Filtrar según el contexto
                    const acceptedFromOffers = provider.offers.flatMap(offer => 
                      offer.clientOffers.filter(co => co.status === 'ACCEPTED')
                    );
                    
                    // Transformar los contratos de cotizaciones a un formato compatible con la visualización
                    const acceptedFromQuotes = (provider as any).providerQuoteContracts
                      ?.filter((contract: any) => contract.status === 'PENDING_SIGNATURE')
                      .map((contract: any) => ({
                        id: contract.id,
                        client: contract.client,
                        updatedAt: contract.createdAt,
                        requestedVolume: contract.quoteRequest?.estimatedAnnualVolume || 0,
                        region: contract.client?.region || 'N/A',
                        distributorName: contract.client?.distributorName || 'N/A',
                        _type: 'quoteContract', // Marcador para identificar el tipo
                        quoteRequest: contract.quoteRequest,
                        quoteResponse: contract.quoteResponse
                      })) || [];
                    
                    // Mostrar solo los contratos relevantes al contexto actual
                    const acceptedRequests = sectionContext === 'offer' 
                      ? acceptedFromOffers 
                      : acceptedFromQuotes;
                    
                    return acceptedRequests.length > 0 ? (
                      <div className="space-y-4">
                        {acceptedRequests.map((request: any) => (
                          <div key={request.id} className="border rounded-lg p-6 bg-orange-50 border-orange-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {request.client?.companyName || request.client?.name || 'Cliente'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Solicitud aceptada el {new Date(request.updatedAt).toLocaleDateString('es-AR')}
                                </p>
                              </div>
                              <Badge className="bg-orange-100 text-orange-800">
                                <Clock className="h-4 w-4 mr-1" />
                                Pendiente de Firma
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="font-medium text-gray-700">Volumen:</span>
                                <p className="text-gray-900">{request.requestedVolume?.toLocaleString()} MWh</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Región:</span>
                                <p className="text-gray-900">{request.region || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Distribuidora:</span>
                                <p className="text-gray-900">{request.distributorName || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Cliente:</span>
                                <p className="text-gray-900">{request.client?.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-3">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleProviderSignContract(request, 'quote')}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Firmar Contrato
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleContactClient(request)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Contactar Cliente
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleRejectContract(
                                  request.id, 
                                  request.client?.companyName || 'Contrato',
                                  request._type === 'quoteContract'
                                )}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No tienes contratos pendientes de firma</p>
                        <p className="text-sm text-gray-500">
                          Los contratos aparecerán aquí cuando aceptes solicitudes de clientes
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Contratos Firmados/Finalizados */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Contratos Firmados y Finalizados {sectionContext === 'offer' ? '(Ofertas)' : '(Cotizaciones)'}</span>
                  </CardTitle>
                  <CardDescription>
                    {sectionContext === 'offer' 
                      ? 'Contratos completados de tus ofertas' 
                      : 'Contratos completados de tus cotizaciones'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const completedFromOffers = provider.offers.flatMap(offer => 
                      offer.clientOffers.filter(co => co.status === 'COMPLETED')
                    );
                    
                    // Transformar los contratos de cotizaciones a un formato compatible con la visualización
                    const completedFromQuotes = (provider as any).providerQuoteContracts
                      ?.filter((contract: any) => contract.status === 'SIGNED')
                      .map((contract: any) => ({
                        id: contract.id,
                        client: contract.client,
                        updatedAt: contract.createdAt,
                        requestedVolume: contract.quoteRequest?.estimatedAnnualVolume || 0,
                        region: contract.client?.region || 'N/A',
                        distributorName: contract.client?.distributorName || 'N/A',
                        _type: 'quoteContract', // Marcador para identificar el tipo
                        quoteRequest: contract.quoteRequest,
                        quoteResponse: contract.quoteResponse,
                        status: 'COMPLETED' // Para que sea compatible con la lógica existente
                      })) || [];
                    
                    // Mostrar solo los contratos relevantes al contexto actual
                    const completedRequests = sectionContext === 'offer' 
                      ? completedFromOffers 
                      : completedFromQuotes;
                    
                    return completedRequests.length > 0 ? (
                      <div className="space-y-4">
                        {completedRequests.map((request: any) => (
                          <div key={request.id} className="border rounded-lg p-6 bg-green-50 border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {request.client?.companyName || request.client?.name || 'Cliente'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Contrato completado el {new Date(request.updatedAt).toLocaleDateString('es-AR')}
                                </p>
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Completado
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="font-medium text-gray-700">Volumen:</span>
                                <p className="text-gray-900">{request.requestedVolume?.toLocaleString()} MWh</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Estado:</span>
                                <p className="text-green-600 font-medium">Finalizado</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Cliente:</span>
                                <p className="text-gray-900">{request.client?.email}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Fecha:</span>
                                <p className="text-gray-900">{new Date(request.updatedAt).toLocaleDateString('es-AR')}</p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadContract(request.id)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Descargar Contrato
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No tienes contratos completados aún</p>
                        <p className="text-sm text-gray-500">
                          Los contratos finalizados aparecerán aquí
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mensajes */}
          <TabsContent value="messages">
            <Card className="border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">El sistema de mensajería estará disponible próximamente</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Perfil */}
          <TabsContent value="profile">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <span>Mi Perfil</span>
                </CardTitle>
                <CardDescription>
                  Información de tu cuenta de proveedor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Información Personal</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nombre</p>
                        <p className="font-medium">{provider?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{provider?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Información de la Empresa</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nombre de la Empresa</p>
                        <p className="font-medium">{provider?.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tipo de Usuario</p>
                        <p className="font-medium">
                          <Badge className="bg-purple-100 text-purple-800">Proveedor</Badge>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Estadísticas</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-gray-500">Ofertas Totales</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.totalOffers}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-gray-500">Solicitudes Pendientes</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-gray-500">Ingresos</p>
                        <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales */}
      <CreateOfferDialog 
        open={createOfferOpen}
        onOpenChange={setCreateOfferOpen}
        onOfferCreated={handleOfferCreated}
      />
      
      <EditOfferDialog
        open={editOfferOpen}
        onOpenChange={setEditOfferOpen}
        offerId={selectedOfferId}
        onOfferUpdated={handleOfferUpdated}
      />

      {selectedClientOffer && (
        <>
          <ContractModal
            isOpen={contractModalOpen}
            onClose={() => setContractModalOpen(false)}
            clientOfferId={selectedClientOffer.id}
            clientName={selectedClientOffer.client?.name || 'Cliente'}
          />

          <MessageModal
            isOpen={messageModalOpen}
            onClose={() => setMessageModalOpen(false)}
            clientOfferId={selectedClientOffer.id}
            clientName={selectedClientOffer.client?.name || 'Cliente'}
            clientEmail={selectedClientOffer.client?.email || ''}
          />

          <ContractSigningModal 
            isOpen={providerContractSigningModalOpen}
            onClose={() => setProviderContractSigningModalOpen(false)}
            contractId={selectedClientOffer.id}
            clientName={selectedClientOffer.client?.name || 'Cliente'}
            providerName={provider?.name || 'Proveedor'}
            userType="PROVIDER"
            contractType={(selectedClientOffer as any)._contractType || 'offer'}
          />

          <ContactModal 
            isOpen={providerContactModalOpen}
            onClose={() => setProviderContactModalOpen(false)}
            contractId={selectedClientOffer.id}
            recipientName={selectedClientOffer.client?.name || 'Cliente'}
            recipientType="CLIENT"
          />
        </>
      )}
    </div>
  );
}
