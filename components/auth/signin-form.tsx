
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('Credenciales incorrectas');
      } else if (result?.ok) {
        // La redirección se manejará automáticamente por NextAuth
        router.refresh();
      }
    } catch (error) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-600 to-green-600 rounded-full p-3">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Ingresar</CardTitle>
            <CardDescription className="text-gray-600">
              Accedé a tu cuenta del marketplace de energía
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-2.5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              ¿No tenés cuenta?{' '}
              <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-700">
                Registrate acá
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Al ingresar, aceptás nuestros términos de servicio y política de privacidad
              </p>
            </div>
          </div>

          {/* Demo credentials for testing */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-medium text-blue-800">Cuentas de prueba:</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Admin:</strong> admin@energiamarket.com.ar / admin123</p>
              <p><strong>Proveedor:</strong> comercial@energiarenovable.com.ar / password123</p>
              <p><strong>Cliente:</strong> compras@metalurgicasur.com.ar / password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
