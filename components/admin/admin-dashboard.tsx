
'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Users, 
  Factory, 
  Building2, 
  TrendingUp, 
  DollarSign,
  LogOut,
  Shield
} from 'lucide-react';

interface AdminDashboardProps {
  data: {
    stats: {
      clients: number;
      providers: number;
      activeOffers: number;
      totalTransactions: number;
      totalVolume: number;
      totalCommissions: number;
    };
    recentTransactions: any[];
    disputes: any[];
  };
}

export default function AdminDashboard({ data }: AdminDashboardProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-lg p-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Panel Administrador</h1>
                <p className="text-sm text-gray-600">Gestión del Marketplace</p>
              </div>
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
      </header>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.clients}</p>
                  <p className="text-sm text-gray-600">Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-lg p-2">
                  <Factory className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.providers}</p>
                  <p className="text-sm text-gray-600">Proveedores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 rounded-lg p-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.activeOffers}</p>
                  <p className="text-sm text-gray-600">Ofertas Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 rounded-lg p-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalTransactions}</p>
                  <p className="text-sm text-gray-600">Transacciones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-lg p-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    ${data.stats.totalVolume.toLocaleString('es-AR')}
                  </p>
                  <p className="text-sm text-gray-600">Volumen Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    ${data.stats.totalCommissions.toLocaleString('es-AR')}
                  </p>
                  <p className="text-sm text-gray-600">Comisiones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>
                Últimas actividades del marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {data.recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction?.client?.companyName || 'Cliente'} → {transaction?.offer?.provider?.companyName || 'Proveedor'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction?.offer?.generationSource} - ${transaction.totalAmount.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {transaction.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No hay transacciones recientes</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Disputas</CardTitle>
              <CardDescription>
                Disputas que requieren atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.disputes.length > 0 ? (
                <div className="space-y-4">
                  {data.disputes.slice(0, 5).map((dispute) => (
                    <div key={dispute.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{dispute.reason}</p>
                        <p className="text-sm text-gray-600">
                          {dispute?.initiator?.companyName} - {new Date(dispute.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {dispute.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No hay disputas activas</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
