
'use client';

import { useState } from 'react';
import { User, Offer } from '@prisma/client';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Search, 
  Filter, 
  Building2, 
  TrendingUp, 
  Clock, 
  DollarSign,
  MapPin,
  Factory,
  LogOut,
  User as UserIcon,
  FileText,
  MessageSquare,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
  Ban
} from 'lucide-react';
import OffersList from './offers-list';
import MyOffersList from './my-offers-list';
import ClientProfile from './client-profile';
import ContractSigningModal from '../modals/ContractSigningModal';
import ContactModal from '../modals/ContactModal';
import ContractCancellationModal from '../modals/ContractCancellationModal';
import QuoteRequestForm from './quote-request-form';
import MyQuoteRequests from './my-quote-requests';

interface ExtendedUser extends User {
  clientOffers: Array<{
    id: string;
    status: string;
    requestedVolume: number | null;
    createdAt: Date;
    offer: (Offer & {
      provider: User;
    }) | null;
  }>;
  transactions: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
    offer: Offer | null;
  }>;
}

interface ClientDashboardProps {
  client: ExtendedUser;
  contracts: Array<any>;
  availableOffers: Array<Offer & {
    provider: User;
  }>;
}

export default function ClientDashboard({ client, contracts, availableOffers }: ClientDashboardProps) {
  const { data: session } = useSession() || {};
  const [mode, setMode] = useState<'offers' | 'quotes' | null>(null); // Nuevo estado para el modo
  const [activeTab, setActiveTab] = useState('list'); // Tab dentro de cada modo
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  
  // Estados para los modales
  const [contractSigningModalOpen, setContractSigningModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contractCancellationModalOpen, setContractCancellationModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Función para abrir modal de cancelación de contrato
  const handleRejectContract = (clientOffer: any) => {
    setSelectedContract(clientOffer);
    setContractCancellationModalOpen(true);
  };

  // Función para abrir modal de contacto
  const handleContactProvider = (clientOffer: any) => {
    setSelectedContract(clientOffer);
    setContactModalOpen(true);
  };

  // Función para abrir modal de firma
  const handleSignContract = (item: any) => {
    // El contrato ES el clientOffer directamente
    setSelectedContract(item);
    setContractSigningModalOpen(true);
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

  // Filtrar ofertas
  const filteredOffers = availableOffers.filter(offer => {
    const matchesSearch = offer.generationSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.deliveryNode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.provider.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = sourceFilter === 'all' || offer.generationSource.toLowerCase().includes(sourceFilter);
    
    const matchesPrice = priceFilter === 'all' || 
      (priceFilter === 'low' && offer.energyPrice < 40) ||
      (priceFilter === 'medium' && offer.energyPrice >= 40 && offer.energyPrice < 50) ||
      (priceFilter === 'high' && offer.energyPrice >= 50);

    return matchesSearch && matchesSource && matchesPrice;
  });

  // Calcular estadísticas
  const stats = {
    pendingOffers: client.clientOffers.filter(co => co.status === 'PENDING').length,
    activeTransactions: client.transactions.filter(t => ['ACCEPTED', 'NEGOTIATING'].includes(t.status)).length,
    totalSpent: client.transactions.reduce((sum, t) => sum + t.totalAmount, 0),
    avgPrice: client.transactions.length > 0 ? 
      client.transactions.reduce((sum, t) => sum + t.totalAmount, 0) / client.transactions.length : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-lg p-2">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Panel Cliente</h1>
                <p className="text-sm text-gray-600">{client?.companyName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{client?.name}</p>
                <p className="text-xs text-gray-600">{client?.email}</p>
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
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOffers}</p>
                  <p className="text-sm text-gray-600">Ofertas Pendientes</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.activeTransactions}</p>
                  <p className="text-sm text-gray-600">Transacciones Activas</p>
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
                    ${stats.totalSpent.toLocaleString('es-AR')}
                  </p>
                  <p className="text-sm text-gray-600">Total Invertido</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 rounded-lg p-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {client?.contractedPower ? `${client.contractedPower} kW` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Potencia Contratada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mode Selection - Mostrar solo si no hay modo seleccionado */}
        {!mode && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Qué querés hacer hoy?</h2>
              <p className="text-gray-600">Elegí una opción para comenzar</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Botón Ver Ofertas */}
              <Card 
                className="border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 cursor-pointer hover:shadow-xl group"
                onClick={() => setMode('offers')}
              >
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300">
                      <Zap className="h-12 w-12 text-blue-600 group-hover:text-white transition-all duration-300" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Ver Ofertas</h3>
                      <p className="text-gray-600">
                        Explorá ofertas publicadas por proveedores y solicitá las que te interesen
                      </p>
                    </div>
                    <div className="pt-4">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Explorar Ofertas
                        <Zap className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botón Solicitar Cotización */}
              <Card 
                className="border-2 border-gray-200 hover:border-green-500 transition-all duration-300 cursor-pointer hover:shadow-xl group"
                onClick={() => setMode('quotes')}
              >
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center group-hover:from-green-500 group-hover:to-green-600 transition-all duration-300">
                      <DollarSign className="h-12 w-12 text-green-600 group-hover:text-white transition-all duration-300" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Solicitar Cotización</h3>
                      <p className="text-gray-600">
                        Publicá tus necesidades y recibí cotizaciones de múltiples proveedores
                      </p>
                    </div>
                    <div className="pt-4">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Solicitar Cotización
                        <DollarSign className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content - Mostrar según el modo seleccionado */}
        {mode && (
          <div className="space-y-6">
            {/* Breadcrumb/Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setMode(null);
                    setActiveTab('list');
                  }}
                >
                  <span>← Volver</span>
                </Button>
                <div className="flex items-center space-x-2">
                  {mode === 'offers' ? (
                    <>
                      <div className="bg-blue-100 rounded-lg p-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Ver Ofertas</h2>
                        <p className="text-sm text-gray-600">Explorá y gestioná ofertas de proveedores</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-100 rounded-lg p-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Solicitar Cotización</h2>
                        <p className="text-sm text-gray-600">Gestioná tus solicitudes de cotización</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs según el modo */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {mode === 'offers' ? (
                <TabsList className="bg-white border border-gray-200 shadow-sm">
                  <TabsTrigger value="list" className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Ofertas Disponibles</span>
                  </TabsTrigger>
                  <TabsTrigger value="my-requests" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Mis Solicitudes</span>
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Contratos</span>
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Mensajes</span>
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Perfil</span>
                  </TabsTrigger>
                </TabsList>
              ) : (
                <TabsList className="bg-white border border-gray-200 shadow-sm">
                  <TabsTrigger value="list" className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Nueva Cotización</span>
                  </TabsTrigger>
                  <TabsTrigger value="my-quotes" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Mis Cotizaciones</span>
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Contratos</span>
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Mensajes</span>
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Perfil</span>
                  </TabsTrigger>
                </TabsList>
              )}

              {/* Contenido para modo OFERTAS */}
              {mode === 'offers' && (
                <>
                  {/* Lista de ofertas disponibles */}
                  <TabsContent value="list" className="space-y-6">
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Zap className="h-5 w-5 text-blue-600" />
                          <span>Ofertas de Energía Disponibles</span>
                        </CardTitle>
                        <CardDescription>
                          Explorá y compará ofertas de diferentes proveedores de energía
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Filtros */}
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Buscar por fuente, nodo o proveedor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          
                          <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                              <Filter className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Fuente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las fuentes</SelectItem>
                              <SelectItem value="solar">Solar</SelectItem>
                              <SelectItem value="eólica">Eólica</SelectItem>
                              <SelectItem value="térmica">Térmica</SelectItem>
                              <SelectItem value="renovable">Renovable</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select value={priceFilter} onValueChange={setPriceFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                              <DollarSign className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Precio" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los precios</SelectItem>
                              <SelectItem value="low">Bajo (&lt; $40/MWh)</SelectItem>
                              <SelectItem value="medium">Medio ($40-50/MWh)</SelectItem>
                              <SelectItem value="high">Alto (&gt; $50/MWh)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <OffersList offers={filteredOffers} clientId={client.id} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Mis solicitudes de ofertas */}
                  <TabsContent value="my-requests">
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span>Mis Solicitudes de Ofertas</span>
                        </CardTitle>
                        <CardDescription>
                          Ofertas que has solicitado y están en proceso de negociación
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <MyOffersList 
                          clientOffers={client.clientOffers.filter(co => 
                            co.status === 'PENDING' || co.status === 'NEGOTIATING'
                          )} 
                          transactions={client.transactions as any}
                          clientId={client.id}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </>
              )}

              {/* Contenido para modo COTIZACIONES */}
              {mode === 'quotes' && (
                <>
                  {/* Formulario para solicitar cotización */}
                  <TabsContent value="list" className="space-y-6">
                    <QuoteRequestForm clientId={client.id} />
                  </TabsContent>

                  {/* Mis cotizaciones solicitadas */}
                  <TabsContent value="my-quotes" className="space-y-6">
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-green-600" />
                          <span>Mis Solicitudes de Cotización</span>
                        </CardTitle>
                        <CardDescription>
                          Solicitudes que has publicado y las ofertas que has recibido
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <MyQuoteRequests clientId={client.id} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </>
              )}

              {/* Contratos - Común para ambos modos */}
              <TabsContent value="contracts">
            <div className="space-y-6">
              {/* Contratos Pendientes de Firma */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span>Contratos Pendientes de Firma</span>
                  </CardTitle>
                  <CardDescription>
                    Contratos listos para firmar tras completar las negociaciones
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {(() => {
                    // Contratos de clientOffers (de "ver ofertas")
                    const pendingSignatureFromOffers = client.clientOffers.filter(co => 
                      co.status === 'ACCEPTED' 
                    );
                    
                    // Contratos directos (de "solicitar cotización")
                    const pendingSignatureFromQuotes = contracts.filter(contract => 
                      contract.status === 'PENDING_SIGNATURE'
                    );
                    
                    const totalPending = pendingSignatureFromOffers.length + pendingSignatureFromQuotes.length;
                    
                    return totalPending > 0 ? (
                      <div className="space-y-4">
                        {/* Contratos de clientOffers */}
                        {pendingSignatureFromOffers.map((clientOffer) => (
                          <div key={`offer-${clientOffer.id}`} className="border rounded-lg p-6 bg-orange-50 border-orange-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {clientOffer.offer?.generationSource || 'Oferta Eliminada'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {clientOffer.offer?.provider?.companyName || 'Proveedor'}
                                </p>
                              </div>
                              <Badge className="bg-orange-100 text-orange-800">
                                <Clock className="h-4 w-4 mr-1" />
                                Pendiente de Firma
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-500">Volumen:</span>
                                <p className="font-medium">{clientOffer.requestedVolume?.toLocaleString()} MWh</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Precio:</span>
                                <p className="font-medium">${clientOffer.offer?.energyPrice || 'Ver negociación'}/MWh</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Plazo:</span>
                                <p className="font-medium">{clientOffer.offer?.term || 'Ver negociación'} meses</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Aceptado el:</span>
                                <p className="font-medium">{new Date(clientOffer.createdAt).toLocaleDateString('es-AR')}</p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-3">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleSignContract({ ...clientOffer, _type: 'clientOffer' })}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Firmar Contrato
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleContactProvider(clientOffer)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Contactar Proveedor
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleRejectContract(clientOffer)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Contratos directos de cotizaciones */}
                        {pendingSignatureFromQuotes.map((contract) => {
                          // Extraer datos del contrato
                          const termsText = contract.terms || '';
                          const energyMatch = termsText.match(/Precio Energía: \$([0-9.]+)\/MWh/);
                          const volumeMatch = termsText.match(/Volumen Total: ([0-9.]+) MWh/);
                          const termMatch = termsText.match(/Plazo: (\d+) meses/);
                          const sourceMatch = termsText.match(/Fuente de Generación: ([^\n]+)/);
                          
                          return (
                            <div key={`contract-${contract.id}`} className="border rounded-lg p-6 bg-orange-50 border-orange-200">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {sourceMatch ? sourceMatch[1] : 'Contrato de Cotización'}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {contract.provider?.companyName || contract.provider?.name || 'Proveedor'}
                                  </p>
                                </div>
                                <Badge className="bg-orange-100 text-orange-800">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Pendiente de Firma
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                <div>
                                  <span className="text-gray-500">Volumen:</span>
                                  <p className="font-medium">{volumeMatch ? parseFloat(volumeMatch[1]).toLocaleString() : 'N/A'} MWh</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Precio:</span>
                                  <p className="font-medium">${energyMatch ? energyMatch[1] : 'N/A'}/MWh</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Plazo:</span>
                                  <p className="font-medium">{termMatch ? termMatch[1] : 'N/A'} meses</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Creado el:</span>
                                  <p className="font-medium">{new Date(contract.createdAt).toLocaleDateString('es-AR')}</p>
                                </div>
                              </div>
                              
                              <div className="flex space-x-3">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleSignContract({ ...contract, _type: 'contract' })}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Firmar Contrato
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleContactProvider({ ...contract, provider: contract.provider })}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Contactar Proveedor
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => handleRejectContract(contract)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No tienes contratos pendientes de firma</p>
                        <p className="text-sm text-gray-500">
                          Los contratos aparecerán aquí cuando completes las negociaciones
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
                    <span>Contratos Firmados y Finalizados</span>
                  </CardTitle>
                  <CardDescription>
                    Contratos activos y completados
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {(() => {
                    // Contratos completados de clientOffers
                    const signedContractsFromOffers = client.clientOffers.filter(co => 
                      co.status === 'COMPLETED' 
                    );
                    
                    // Contratos firmados directos (de cotizaciones)
                    const signedContractsFromQuotes = contracts.filter(contract => 
                      contract.status === 'SIGNED'
                    );
                    
                    const totalSigned = signedContractsFromOffers.length + signedContractsFromQuotes.length;
                    
                    return totalSigned > 0 ? (
                      <div className="space-y-4">
                        {/* Contratos completados de clientOffers */}
                        {signedContractsFromOffers.map((clientOffer) => (
                          <div key={`offer-signed-${clientOffer.id}`} className="border rounded-lg p-6 bg-green-50 border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {clientOffer.offer?.generationSource || 'Oferta Eliminada'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {clientOffer.offer?.provider?.companyName || 'Proveedor'}
                                </p>
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Completado
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-500">Volumen:</span>
                                <p className="font-medium">{clientOffer.requestedVolume?.toLocaleString()} MWh</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Estado:</span>
                                <p className="font-medium text-green-600">Finalizado</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Completado el:</span>
                                <p className="font-medium">{new Date(clientOffer.createdAt).toLocaleDateString('es-AR')}</p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadContract(clientOffer.id)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Descargar Contrato
                              </Button>
                              <Button size="sm" variant="outline">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Ver Facturación
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Contratos firmados directos de cotizaciones */}
                        {signedContractsFromQuotes.map((contract) => {
                          const termsText = contract.terms || '';
                          const volumeMatch = termsText.match(/Volumen Total: ([0-9.]+) MWh/);
                          const sourceMatch = termsText.match(/Fuente de Generación: ([^\n]+)/);
                          
                          return (
                            <div key={`contract-signed-${contract.id}`} className="border rounded-lg p-6 bg-green-50 border-green-200">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {sourceMatch ? sourceMatch[1] : 'Contrato de Cotización'}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {contract.provider?.companyName || contract.provider?.name || 'Proveedor'}
                                  </p>
                                </div>
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Firmado
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                <div>
                                  <span className="text-gray-500">Volumen:</span>
                                  <p className="font-medium">{volumeMatch ? parseFloat(volumeMatch[1]).toLocaleString() : 'N/A'} MWh</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Estado:</span>
                                  <p className="font-medium text-green-600">Firmado</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Completado el:</span>
                                  <p className="font-medium">{new Date(contract.createdAt).toLocaleDateString('es-AR')}</p>
                                </div>
                              </div>
                              
                              <div className="flex space-x-3">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadContract(contract.id)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Descargar Contrato
                                </Button>
                                <Button size="sm" variant="outline">
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Ver Facturación
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No tienes contratos firmados aún</p>
                        <p className="text-sm text-gray-500">
                          Los contratos firmados aparecerán aquí cuando completes los procesos
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Contratos Cancelados/Rechazados */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span>Contratos Cancelados y Rechazados</span>
                  </CardTitle>
                  <CardDescription>
                    Contratos que fueron cancelados o rechazados durante el proceso
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {(() => {
                    const cancelledContracts = client.clientOffers.filter(co => 
                      co.status === 'CANCELLED' || co.status === 'REJECTED'
                    );
                    
                    return cancelledContracts.length > 0 ? (
                      <div className="space-y-4">
                        {cancelledContracts.map((clientOffer) => (
                          <div key={clientOffer.id} className="border rounded-lg p-6 bg-red-50 border-red-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {clientOffer.offer?.generationSource || 'Oferta Eliminada'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {clientOffer.offer?.provider?.companyName || 'Proveedor'}
                                </p>
                              </div>
                              <Badge className="bg-red-100 text-red-800">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {clientOffer.status === 'CANCELLED' ? 'Cancelado' : 'Rechazado'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-500">Volumen:</span>
                                <p className="font-medium">{clientOffer.requestedVolume?.toLocaleString()} MWh</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Motivo:</span>
                                <p className="font-medium text-red-600">
                                  {clientOffer.status === 'CANCELLED' ? 'Cancelado por el cliente' : 'Rechazado por el proveedor'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Fecha:</span>
                                <p className="font-medium">{new Date(clientOffer.createdAt).toLocaleDateString('es-AR')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No tienes contratos cancelados</p>
                        <p className="text-sm text-gray-500">
                          Los contratos cancelados o rechazados aparecerán aquí
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
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span>Mensajes y Negociaciones</span>
                </CardTitle>
                <CardDescription>
                  Comunicación con proveedores de energía
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No tenés mensajes aún</p>
                  <p className="text-sm text-gray-500">
                    Los mensajes aparecerán aquí cuando negocies ofertas con proveedores
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

              {/* Perfil - Común para ambos modos */}
              <TabsContent value="profile">
                <ClientProfile client={client} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Modal de Firma de Contrato */}
      {selectedContract && (
        <ContractSigningModal
          isOpen={contractSigningModalOpen}
          onClose={() => {
            setContractSigningModalOpen(false);
            setSelectedContract(null);
          }}
          contractId={selectedContract.id}
          clientName={client.companyName || client.name || 'Cliente'}
          providerName={selectedContract.offer?.provider?.companyName || selectedContract.provider?.companyName || selectedContract.provider?.name || selectedContract.offer?.provider?.name || 'Proveedor'}
          userType="CLIENT"
          contractType={selectedContract._type === 'contract' ? 'quote' : 'offer'}
        />
      )}

      {/* Modal de Contacto */}
      {selectedContract && (
        <ContactModal
          isOpen={contactModalOpen}
          onClose={() => {
            setContactModalOpen(false);
            setSelectedContract(null);
          }}
          contractId={selectedContract.id}
          recipientName={selectedContract.offer?.provider?.companyName || selectedContract.offer?.provider?.name || 'Proveedor'}
          recipientType="PROVIDER"
        />
      )}

      {/* Modal de Cancelación de Contrato */}
      {selectedContract && (
        <ContractCancellationModal
          isOpen={contractCancellationModalOpen}
          onClose={() => {
            setContractCancellationModalOpen(false);
            setSelectedContract(null);
          }}
          contractId={selectedContract.id}
          contractTitle={selectedContract.offer?.generationSource || 'Contrato'}
          providerName={selectedContract.offer?.provider?.companyName || selectedContract.offer?.provider?.name || 'Proveedor'}
        />
      )}
    </div>
  );
}
