
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Building2, 
  Factory, 
  Shield, 
  TrendingUp, 
  Users, 
  FileText, 
  MessageSquare,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  const [userType, setUserType] = useState<'provider' | 'client'>('client');

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Marketplace Transparente",
      description: "Compará ofertas de energía de múltiples proveedores en una sola plataforma"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Transacciones Seguras",
      description: "Sistema de pagos integrado con MercadoPago y verificación KYC completa"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Contratos Automáticos",
      description: "Generación automática de contratos en PDF una vez acordados los términos"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Negociación Integrada",
      description: "Sistema de mensajería para negociar términos específicos directamente en la plataforma"
    }
  ];

  const benefits = {
    provider: [
      "Acceso a una amplia base de clientes industriales",
      "Herramientas avanzadas para gestionar ofertas",
      "Comisiones competitivas del 2%",
      "Proceso de pago automatizado y seguro"
    ],
    client: [
      "Compará precios de energía de múltiples proveedores",
      "Negociá términos específicos para tu empresa",
      "Gestión simplificada de documentación legal",
      "Seguimiento completo de transacciones"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Energía<span className="text-blue-600">Market</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  Ingresar
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Registrarse
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            🇦🇷 Hecho para el mercado argentino
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Marketplace de
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Energía Eléctrica</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Conectamos proveedores de energía con clientes comerciales e industriales 
            para facilitar transacciones seguras, transparentes y eficientes en Argentina.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup?type=client">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                <Building2 className="mr-2 h-5 w-5" />
                Soy Cliente Industrial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/auth/signup?type=provider">
              <Button size="lg" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 px-8">
                <Factory className="mr-2 h-5 w-5" />
                Soy Proveedor de Energía
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* User Type Toggle */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona para vos?
            </h2>
            
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setUserType('client')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  userType === 'client' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="inline mr-2 h-4 w-4" />
                Cliente Industrial
              </button>
              <button
                onClick={() => setUserType('provider')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  userType === 'provider' 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Factory className="inline mr-2 h-4 w-4" />
                Proveedor de Energía
              </button>
            </div>
          </div>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-white">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-gray-900">
                {userType === 'client' ? 'Para Empresas Consumidoras' : 'Para Proveedores de Energía'}
              </CardTitle>
              <CardDescription className="text-lg">
                {userType === 'client' 
                  ? 'Potencia contratada mayor a 10 kW' 
                  : 'Generadores y comercializadores de energía'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">Beneficios principales:</h4>
                  <ul className="space-y-3">
                    {benefits[userType].map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">Proceso simplificado:</h4>
                  <div className="space-y-4">
                    {userType === 'client' ? (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                          <span className="text-gray-700">Explorá ofertas disponibles</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                          <span className="text-gray-700">Negociá términos específicos</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                          <span className="text-gray-700">Firmá contrato automático</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                          <span className="text-gray-700">Cargá tus ofertas de energía</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                          <span className="text-gray-700">Recibí consultas de clientes</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                          <span className="text-gray-700">Cobrá con 2% de comisión</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Plataforma completa y segura
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Todas las herramientas que necesitás para comprar o vender energía eléctrica de forma segura
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <div className="text-blue-600">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-12">El marketplace líder en Argentina</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">2%</div>
              <div className="text-blue-100">Comisión competitiva</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Plataforma disponible</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Transacciones seguras</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ¿Listo para comenzar?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Sumate al marketplace de energía más innovador de Argentina y 
            descubrí nuevas oportunidades para tu empresa.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 px-8">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Zap className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-bold">
                Energía<span className="text-blue-400">Market</span>
              </span>
            </div>
            
            <div className="text-gray-400 text-center">
              <p>© 2024 EnergíaMarket Argentina. Plataforma de comercialización de energía eléctrica.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
