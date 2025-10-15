
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  User, 
  Building2, 
  Phone, 
  MapPin,
  Factory
} from 'lucide-react';

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
    phone: '',
    userType: 'CLIENT' as 'CLIENT' | 'PROVIDER',
    cuit: '',
    // Campos adicionales para clientes
    distributorName: '',
    region: '',
    tariffType: '',
    contractedPower: '',
    userNumber: '',
    address: '',
    city: '',
    province: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams?.get('type');
    if (type === 'provider') {
      setFormData(prev => ({ ...prev, userType: 'PROVIDER' }));
    }
  }, [searchParams]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.companyName) {
      setError('Por favor completá todos los campos obligatorios');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.userType === 'CLIENT' && formData.contractedPower && parseFloat(formData.contractedPower) <= 10) {
      setError('La potencia contratada debe ser mayor a 10 kW');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear la cuenta');
        return;
      }

      // Auto login después del registro
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.ok) {
        router.refresh();
      } else {
        // Si falla el auto login, redirigir a login
        router.push('/auth/signin?message=Cuenta creada exitosamente');
      }
    } catch (error) {
      setError('Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const distributors = [
    'EDESUR', 'EDENOR', 'EDELAP', 'EPE', 'EDEMSA', 'EPEC', 'EDEA', 'EDES', 'EDESE', 'EDET'
  ];

  const provinces = [
    'Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Córdoba', 'Santa Fe', 
    'Mendoza', 'Tucumán', 'Entre Ríos', 'Salta', 'Corrientes', 'Misiones',
    'San Juan', 'Jujuy', 'Río Negro', 'Neuquén', 'Chubut', 'San Luis',
    'Santiago del Estero', 'Catamarca', 'La Rioja', 'La Pampa', 'Chaco',
    'Formosa', 'Santa Cruz', 'Tierra del Fuego'
  ];

  return (
    <div className="w-full max-w-2xl">
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-full p-3">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Crear Cuenta</CardTitle>
            <CardDescription className="text-gray-600">
              Sumate al marketplace de energía más innovador de Argentina
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={formData.userType.toLowerCase()} onValueChange={(value) => handleChange('userType', value.toUpperCase())}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="client" 
                className="flex items-center space-x-2"
                onClick={() => handleChange('userType', 'CLIENT')}
              >
                <Building2 className="h-4 w-4" />
                <span>Cliente Industrial</span>
              </TabsTrigger>
              <TabsTrigger 
                value="provider" 
                className="flex items-center space-x-2"
                onClick={() => handleChange('userType', 'PROVIDER')}
              >
                <Factory className="h-4 w-4" />
                <span>Proveedor</span>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos comunes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Nombre Completo *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-gray-700 font-medium">
                    Empresa *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Mi Empresa SA"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      required
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan@empresa.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Teléfono
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="text"
                      placeholder="+54 11 1234-5678"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuit" className="text-gray-700 font-medium">
                  CUIT
                </Label>
                <Input
                  id="cuit"
                  type="text"
                  placeholder="30-12345678-9"
                  value={formData.cuit}
                  onChange={(e) => handleChange('cuit', e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Contraseña *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                      className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                    Confirmar Contraseña *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repetir contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      required
                      className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Campos específicos para clientes */}
              <TabsContent value="client" className="space-y-4 mt-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Información del Cliente Industrial</h4>
                  <p className="text-sm text-blue-700">
                    Esta información es necesaria para verificar que cumplís con los requisitos (potencia contratada &gt; 10 kW)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userNumber" className="text-gray-700 font-medium">
                      Número de Usuario
                    </Label>
                    <Input
                      id="userNumber"
                      type="text"
                      placeholder="ED001234567"
                      value={formData.userNumber}
                      onChange={(e) => handleChange('userNumber', e.target.value)}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractedPower" className="text-gray-700 font-medium">
                      Potencia Contratada (kW)
                    </Label>
                    <Input
                      id="contractedPower"
                      type="number"
                      placeholder="500"
                      step="0.1"
                      min="10.1"
                      value={formData.contractedPower}
                      onChange={(e) => handleChange('contractedPower', e.target.value)}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distributorName" className="text-gray-700 font-medium">
                      Distribuidora
                    </Label>
                    <Select value={formData.distributorName} onValueChange={(value) => handleChange('distributorName', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar distribuidora" />
                      </SelectTrigger>
                      <SelectContent>
                        {distributors.map((dist) => (
                          <SelectItem key={dist} value={dist}>
                            {dist}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tariffType" className="text-gray-700 font-medium">
                      Tipo de Tarifa
                    </Label>
                    <Select value={formData.tariffType} onValueChange={(value) => handleChange('tariffType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tarifa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TM1">TM1 - Media Tensión</SelectItem>
                        <SelectItem value="TM2">TM2 - Media Tensión</SelectItem>
                        <SelectItem value="TA">TA - Alta Tensión</SelectItem>
                        <SelectItem value="TAT">TAT - Alta Tensión</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province" className="text-gray-700 font-medium">
                    Provincia
                  </Label>
                  <Select value={formData.province} onValueChange={(value) => handleChange('province', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((prov) => (
                        <SelectItem key={prov} value={prov}>
                          {prov}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Campos específicos para proveedores */}
              <TabsContent value="provider" className="space-y-4 mt-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Información del Proveedor</h4>
                  <p className="text-sm text-green-700">
                    Como proveedor de energía, podrás cargar ofertas y negociar con clientes industriales
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700 font-medium">
                    Dirección de la Empresa
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="Av. Corrientes 1234"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-700 font-medium">
                      Ciudad
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Buenos Aires"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-gray-700 font-medium">
                      Provincia
                    </Label>
                    <Select value={formData.province} onValueChange={(value) => handleChange('province', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((prov) => (
                          <SelectItem key={prov} value={prov}>
                            {prov}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-2.5"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>
            </form>
          </Tabs>

          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              ¿Ya tenés cuenta?{' '}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-700">
                Ingresá acá
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Al registrarte, aceptás nuestros términos de servicio y política de privacidad
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
