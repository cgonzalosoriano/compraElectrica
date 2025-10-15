
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSession } from 'next-auth/react';

import { Loader2 } from 'lucide-react';

interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfferCreated: () => void;
}

export default function CreateOfferDialog({ 
  open, 
  onOpenChange, 
  onOfferCreated 
}: CreateOfferDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    energyPrice: '',
    powerPrice: '',
    term: '',
    availableVolume: '',
    deliveryNode: '',
    paymentMethods: '',
    requiredGuarantees: '',
    generationSource: '',
    additionalConditions: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      alert('Debes estar autenticado para crear una oferta');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          energyPrice: parseFloat(formData.energyPrice),
          powerPrice: parseFloat(formData.powerPrice),
          term: parseInt(formData.term),
          availableVolume: parseFloat(formData.availableVolume),
          providerId: session.user.id
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear la oferta');
      }

      const result = await response.json();
      
      alert('¡Oferta creada exitosamente!');
      
      // Reset form
      setFormData({
        energyPrice: '',
        powerPrice: '',
        term: '',
        availableVolume: '',
        deliveryNode: '',
        paymentMethods: '',
        requiredGuarantees: '',
        generationSource: '',
        additionalConditions: ''
      });
      
      onOfferCreated();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la oferta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Oferta de Energía</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Precio de Energía */}
            <div className="space-y-2">
              <Label htmlFor="energyPrice">Precio de Energía ($/MWh)*</Label>
              <Input
                id="energyPrice"
                type="number"
                step="0.01"
                required
                value={formData.energyPrice}
                onChange={(e) => handleChange('energyPrice', e.target.value)}
                placeholder="Ej: 85.50"
              />
            </div>

            {/* Precio de Potencia */}
            <div className="space-y-2">
              <Label htmlFor="powerPrice">Precio de Potencia ($/kW/mes)*</Label>
              <Input
                id="powerPrice"
                type="number"
                step="0.01"
                required
                value={formData.powerPrice}
                onChange={(e) => handleChange('powerPrice', e.target.value)}
                placeholder="Ej: 125.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Plazo */}
            <div className="space-y-2">
              <Label htmlFor="term">Plazo (meses)*</Label>
              <Select value={formData.term} onValueChange={(value) => handleChange('term', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plazo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="18">18 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                  <SelectItem value="36">36 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Volumen Disponible */}
            <div className="space-y-2">
              <Label htmlFor="availableVolume">Volumen Disponible (MWh)*</Label>
              <Input
                id="availableVolume"
                type="number"
                step="0.01"
                required
                value={formData.availableVolume}
                onChange={(e) => handleChange('availableVolume', e.target.value)}
                placeholder="Ej: 1000"
              />
            </div>
          </div>

          {/* Nodo de Entrega */}
          <div className="space-y-2">
            <Label htmlFor="deliveryNode">Nodo de Entrega*</Label>
            <Input
              id="deliveryNode"
              required
              value={formData.deliveryNode}
              onChange={(e) => handleChange('deliveryNode', e.target.value)}
              placeholder="Ej: CAMMESA - Nodo San Martín"
            />
          </div>

          {/* Fuente de Generación */}
          <div className="space-y-2">
            <Label htmlFor="generationSource">Fuente de Generación*</Label>
            <Select value={formData.generationSource} onValueChange={(value) => handleChange('generationSource', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Solar">Solar</SelectItem>
                <SelectItem value="Eólica">Eólica</SelectItem>
                <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                <SelectItem value="Térmica">Térmica</SelectItem>
                <SelectItem value="Nuclear">Nuclear</SelectItem>
                <SelectItem value="Biogás">Biogás</SelectItem>
                <SelectItem value="Biomasa">Biomasa</SelectItem>
                <SelectItem value="Cogeneración">Cogeneración</SelectItem>
                <SelectItem value="Mixta">Mixta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formas de Pago */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethods">Formas de Pago Aceptadas*</Label>
            <Textarea
              id="paymentMethods"
              required
              value={formData.paymentMethods}
              onChange={(e) => handleChange('paymentMethods', e.target.value)}
              placeholder="Ej: Transferencia bancaria, Cheque a 30/60/90 días, Pagaré"
              rows={2}
            />
          </div>

          {/* Garantías Requeridas */}
          <div className="space-y-2">
            <Label htmlFor="requiredGuarantees">Garantías Requeridas*</Label>
            <Textarea
              id="requiredGuarantees"
              required
              value={formData.requiredGuarantees}
              onChange={(e) => handleChange('requiredGuarantees', e.target.value)}
              placeholder="Ej: Seguro de caución del 10% del monto total, Aval bancario"
              rows={2}
            />
          </div>

          {/* Condiciones Adicionales */}
          <div className="space-y-2">
            <Label htmlFor="additionalConditions">Condiciones Adicionales</Label>
            <Textarea
              id="additionalConditions"
              value={formData.additionalConditions}
              onChange={(e) => handleChange('additionalConditions', e.target.value)}
              placeholder="Cualquier condición especial, cláusulas de reajuste, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                'Crear Oferta'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
