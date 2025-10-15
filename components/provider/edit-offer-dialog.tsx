
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Offer {
  id: string;
  generationSource: string;
  deliveryNode: string;
  energyPrice: number;
  powerPrice: number;
  availableVolume: number;
  term: number;
  paymentTerms: string;
  guarantees: string;
  otherConditions: string | null;
  status: string;
}

interface EditOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  onOfferUpdated: () => void;
}

export default function EditOfferDialog({ 
  open, 
  onOpenChange, 
  offerId,
  onOfferUpdated 
}: EditOfferDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<Offer | null>(null);

  // Cargar datos de la oferta cuando se abra el modal
  useEffect(() => {
    if (open && offerId) {
      loadOfferData();
    }
  }, [open, offerId]);

  const loadOfferData = async () => {
    setLoadingData(true);
    setError('');
    
    try {
      const response = await fetch(`/api/offers/${offerId}`);
      const data = await response.json();
      
      if (response.ok) {
        setOffer(data);
      } else {
        setError(data.error || 'Error al cargar la oferta');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!offer) return;

    setLoading(true);
    setError('');

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      generationSource: formData.get('generationSource'),
      deliveryNode: formData.get('deliveryNode'),
      energyPrice: formData.get('energyPrice'),
      powerPrice: formData.get('powerPrice'),
      availableVolume: formData.get('availableVolume'),
      term: formData.get('term'),
      paymentTerms: formData.get('paymentTerms'),
      guarantees: formData.get('guarantees'),
      otherConditions: formData.get('otherConditions'),
      status: formData.get('status')
    };

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        onOfferUpdated();
        onOpenChange(false);
        setOffer(null);
      } else {
        setError(result.error || 'Error al actualizar la oferta');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Oferta de Energía</DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando datos de la oferta...</span>
          </div>
        ) : !offer ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error al cargar la oferta</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="generationSource">Fuente de Generación *</Label>
                <Select name="generationSource" defaultValue={offer.generationSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIDRAULICA">Hidráulica</SelectItem>
                    <SelectItem value="EOLICA">Eólica</SelectItem>
                    <SelectItem value="SOLAR">Solar</SelectItem>
                    <SelectItem value="TERMICA">Térmica</SelectItem>
                    <SelectItem value="NUCLEAR">Nuclear</SelectItem>
                    <SelectItem value="BIOMASA">Biomasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryNode">Nodo de Entrega *</Label>
                <Select name="deliveryNode" defaultValue={offer.deliveryNode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NODO_BA">Buenos Aires</SelectItem>
                    <SelectItem value="NODO_CORDOBA">Córdoba</SelectItem>
                    <SelectItem value="NODO_SANTA_FE">Santa Fe</SelectItem>
                    <SelectItem value="NODO_MENDOZA">Mendoza</SelectItem>
                    <SelectItem value="NODO_NEA">NEA</SelectItem>
                    <SelectItem value="NODO_NOA">NOA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="energyPrice">Precio Energía ($/MWh) *</Label>
                <Input
                  id="energyPrice"
                  name="energyPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={offer.energyPrice}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="powerPrice">Precio Potencia ($/kW-mes)</Label>
                <Input
                  id="powerPrice"
                  name="powerPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={offer.powerPrice}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableVolume">Volumen Disponible (MWh) *</Label>
                <Input
                  id="availableVolume"
                  name="availableVolume"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={offer.availableVolume}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Plazo (meses) *</Label>
                <Input
                  id="term"
                  name="term"
                  type="number"
                  min="1"
                  max="60"
                  defaultValue={offer.term}
                  required
                />
              </div>
            </div>



            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Condiciones de Pago *</Label>
              <Select name="paymentTerms" defaultValue={offer.paymentTerms}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTADO">Contado</SelectItem>
                  <SelectItem value="30_DIAS">30 días</SelectItem>
                  <SelectItem value="60_DIAS">60 días</SelectItem>
                  <SelectItem value="90_DIAS">90 días</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guarantees">Garantías Requeridas *</Label>
              <Select name="guarantees" defaultValue={offer.guarantees}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIN_GARANTIA">Sin Garantía</SelectItem>
                  <SelectItem value="SEGURO_CAUTION">Seguro de Caución</SelectItem>
                  <SelectItem value="GARANTIA_BANCARIA">Garantía Bancaria</SelectItem>
                  <SelectItem value="DEPOSITO_EFECTIVO">Depósito en Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado de la Oferta</Label>
              <Select name="status" defaultValue={offer.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activa</SelectItem>
                  <SelectItem value="INACTIVE">Inactiva</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherConditions">Otras Condiciones</Label>
              <Textarea
                id="otherConditions"
                name="otherConditions"
                placeholder="Especifica cualquier condición adicional o términos especiales..."
                rows={3}
                defaultValue={offer.otherConditions || ''}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar Oferta'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
