
'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin,
  Zap,
  Shield,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';

interface ClientProfileProps {
  client: User;
}

export default function ClientProfile({ client }: ClientProfileProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState({
    name: client?.name || '',
    companyName: client?.companyName || '',
    phone: client?.phone || '',
    address: client?.address || '',
    city: client?.city || '',
    province: client?.province || '',
    postalCode: client?.postalCode || '',
    distributorName: client?.distributorName || '',
    region: client?.region || '',
    tariffType: client?.tariffType || '',
    contractedPower: client?.contractedPower?.toString() || '',
    userNumber: client?.userNumber || ''
  });

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileData,
          contractedPower: profileData.contractedPower ? parseFloat(profileData.contractedPower) : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al actualizar el perfil');
        return;
      }

      setSuccess('Perfil actualizado exitosamente');
      setEditing(false);
      
      // Refrescar la página después de un momento
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setError('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: client?.name || '',
      companyName: client?.companyName || '',
      phone: client?.phone || '',
      address: client?.address || '',
      city: client?.city || '',
      province: client?.province || '',
      postalCode: client?.postalCode || '',
      distributorName: client?.distributorName || '',
      region: client?.region || '',
      tariffType: client?.tariffType || '',
      contractedPower: client?.contractedPower?.toString() || '',
      userNumber: client?.userNumber || ''
    });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Información Personal */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-blue-600" />
              <span>Información Personal</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Badge className={client?.isKycVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                <Shield className="h-3 w-3 mr-1" />
                {client?.isKycVerified ? 'KYC Verificado' : 'KYC Pendiente'}
              </Badge>
              
              {!editing ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              {editing ? (
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  placeholder="Juan Pérez"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{client?.name || 'No especificado'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                {client?.email}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Empresa</Label>
              {editing ? (
                <Input
                  id="companyName"
                  value={profileData.companyName}
                  onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
                  placeholder="Mi Empresa SA"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                  {client?.companyName || 'No especificado'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              {editing ? (
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  placeholder="+54 11 1234-5678"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  {client?.phone || 'No especificado'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>CUIT</Label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded">
                {client?.cuit || 'No especificado'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de Ubicación */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-green-600" />
            <span>Ubicación y Dirección</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            {editing ? (
              <Input
                id="address"
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                placeholder="Av. Industrial 1234"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 p-2 rounded">{client?.address || 'No especificado'}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              {editing ? (
                <Input
                  id="city"
                  value={profileData.city}
                  onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                  placeholder="Buenos Aires"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{client?.city || 'No especificado'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              {editing ? (
                <Input
                  id="province"
                  value={profileData.province}
                  onChange={(e) => setProfileData({...profileData, province: e.target.value})}
                  placeholder="Buenos Aires"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{client?.province || 'No especificado'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Código Postal</Label>
              {editing ? (
                <Input
                  id="postalCode"
                  value={profileData.postalCode}
                  onChange={(e) => setProfileData({...profileData, postalCode: e.target.value})}
                  placeholder="1234"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{client?.postalCode || 'No especificado'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Eléctrica */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <span>Información Eléctrica</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userNumber">Número de Usuario</Label>
              {editing ? (
                <Input
                  id="userNumber"
                  value={profileData.userNumber}
                  onChange={(e) => setProfileData({...profileData, userNumber: e.target.value})}
                  placeholder="ED001234567"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{client?.userNumber || 'No especificado'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractedPower">Potencia Contratada (kW)</Label>
              {editing ? (
                <Input
                  id="contractedPower"
                  type="number"
                  step="0.1"
                  min="10.1"
                  value={profileData.contractedPower}
                  onChange={(e) => setProfileData({...profileData, contractedPower: e.target.value})}
                  placeholder="500"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {client?.contractedPower ? `${client.contractedPower} kW` : 'No especificado'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="distributorName">Distribuidora</Label>
              {editing ? (
                <Input
                  id="distributorName"
                  value={profileData.distributorName}
                  onChange={(e) => setProfileData({...profileData, distributorName: e.target.value})}
                  placeholder="EDESUR"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{client?.distributorName || 'No especificado'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Región</Label>
              {editing ? (
                <Input
                  id="region"
                  value={profileData.region}
                  onChange={(e) => setProfileData({...profileData, region: e.target.value})}
                  placeholder="Zona Norte"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{client?.region || 'No especificado'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tariffType">Tipo de Tarifa</Label>
              {editing ? (
                <Input
                  id="tariffType"
                  value={profileData.tariffType}
                  onChange={(e) => setProfileData({...profileData, tariffType: e.target.value})}
                  placeholder="TM1"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{client?.tariffType || 'No especificado'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-purple-600" />
            <span>Documentos</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Sistema de carga de documentos</p>
            <p className="text-sm text-gray-500">
              Próximamente podrás cargar tus poderes legales y documentos KYC
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
