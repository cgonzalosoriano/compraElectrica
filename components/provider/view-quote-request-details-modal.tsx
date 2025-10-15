'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Calendar, Zap, Factory, FileText, MapPin } from 'lucide-react';

interface ViewQuoteRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteRequest: any;
}

export default function ViewQuoteRequestDetailsModal({
  isOpen,
  onClose,
  quoteRequest,
}: ViewQuoteRequestDetailsModalProps) {
  if (!quoteRequest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quoteRequest.title}</DialogTitle>
          <DialogDescription>
            Detalles completos de la solicitud de cotización
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del cliente */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Información del Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Empresa:</span>
                  <p className="font-medium">{quoteRequest.client?.companyName || quoteRequest.client?.name}</p>
                </div>
                {quoteRequest.distributorName && (
                  <div>
                    <span className="text-gray-600">Distribuidora:</span>
                    <p className="font-medium">{quoteRequest.distributorName}</p>
                  </div>
                )}
                {quoteRequest.region && (
                  <div>
                    <span className="text-gray-600">Región:</span>
                    <p className="font-medium">{quoteRequest.region}</p>
                  </div>
                )}
                {quoteRequest.deliveryNode && (
                  <div>
                    <span className="text-gray-600">Nodo de entrega:</span>
                    <p className="font-medium">{quoteRequest.deliveryNode}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información general */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Información General
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Plazo:</span>
                  <p className="font-medium">{quoteRequest.termMonths} meses</p>
                </div>
                <div>
                  <span className="text-gray-600">Vencimiento:</span>
                  <p className="font-medium">{new Date(quoteRequest.deadline).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fuente preferida:</span>
                  <p className="font-medium">{quoteRequest.preferredEnergySource || 'Indistinto'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fecha de inicio:</span>
                  <p className="font-medium">
                    {quoteRequest.startDate 
                      ? new Date(quoteRequest.startDate).toLocaleDateString('es-AR')
                      : 'A definir'}
                  </p>
                </div>
              </div>
              {quoteRequest.description && (
                <div className="mt-4">
                  <span className="text-gray-600">Descripción:</span>
                  <p className="text-gray-700 mt-1">{quoteRequest.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Periodos solicitados */}
          {quoteRequest.periods && quoteRequest.periods.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Períodos Solicitados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Período</th>
                        <th className="px-4 py-2 text-right">Potencia (MW)</th>
                        <th className="px-4 py-2 text-right">Energía (MWh)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteRequest.periods.map((period: any) => (
                        <tr key={period.id} className="border-t">
                          <td className="px-4 py-2">{period.periodName}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            {period.powerKW ? (period.powerKW / 1000).toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {period.energyMWh ? period.energyMWh.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Condiciones solicitadas */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Condiciones Solicitadas</h3>
              <div className="space-y-3 text-sm">
                {quoteRequest.paymentTerms && (
                  <div>
                    <span className="text-gray-600 font-medium">Condiciones de pago:</span>
                    <p className="text-gray-700 mt-1">{quoteRequest.paymentTerms}</p>
                  </div>
                )}
                {quoteRequest.guaranteesOffered && (
                  <div>
                    <span className="text-gray-600 font-medium">Garantías ofrecidas:</span>
                    <p className="text-gray-700 mt-1">{quoteRequest.guaranteesOffered}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cláusulas personalizadas */}
          {quoteRequest.clauses && quoteRequest.clauses.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Cláusulas Especiales</h3>
                <div className="space-y-3">
                  {quoteRequest.clauses.map((clause: any, index: number) => (
                    <div key={clause.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900">{clause.clauseName}</p>
                        {clause.isRequired && (
                          <Badge variant="destructive" className="text-xs">Requerida</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{clause.clauseDescription}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
