

'use client'

import { useState } from 'react'
import { X, MessageSquare, DollarSign, Zap, Clock, FileText, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'

interface NegotiationModalProps {
  isOpen: boolean
  onClose: () => void
  contractId: string
  recipientId: string
  recipientName: string
  currentTerms: {
    energyPrice: number
    powerPrice: number
    volume: number
    term: number
    paymentTerms: string
    guarantees: string
    conditions?: string
  }
}

export default function NegotiationModal({ 
  isOpen, 
  onClose, 
  contractId,
  recipientId,
  recipientName,
  currentTerms 
}: NegotiationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    proposedEnergyPrice: currentTerms.energyPrice,
    proposedPowerPrice: currentTerms.powerPrice,
    proposedVolume: currentTerms.volume,
    proposedTerm: currentTerms.term,
    proposedPaymentTerms: currentTerms.paymentTerms,
    proposedGuarantees: currentTerms.guarantees,
    proposedConditions: currentTerms.conditions || '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/negotiations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          clientOfferId: contractId, // Necesitaremos pasarlo correctamente
          recipientId,
          ...formData
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(data.message || 'Propuesta enviada exitosamente')
        onClose()
        // Recargar la página para mostrar los cambios
        window.location.reload()
      } else {
        alert(data.error || 'Error al enviar propuesta')
      }
    } catch (error) {
      console.error('Error sending negotiation:', error)
      alert('Error al enviar propuesta')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Proponer Cambios al Contrato</h2>
            <p className="text-sm text-gray-600 mt-1">Enviando propuesta a: {recipientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Precio de Energía */}
            <div className="space-y-2">
              <Label htmlFor="energyPrice" className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                Precio de Energía ($/MWh)
              </Label>
              <Input
                id="energyPrice"
                type="number"
                step="0.01"
                value={formData.proposedEnergyPrice}
                onChange={(e) => setFormData({...formData, proposedEnergyPrice: parseFloat(e.target.value)})}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">Actual: ${currentTerms.energyPrice}/MWh</p>
            </div>

            {/* Precio de Potencia */}
            <div className="space-y-2">
              <Label htmlFor="powerPrice" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                Precio de Potencia ($/kW-mes)
              </Label>
              <Input
                id="powerPrice"
                type="number"
                step="0.01"
                value={formData.proposedPowerPrice}
                onChange={(e) => setFormData({...formData, proposedPowerPrice: parseFloat(e.target.value)})}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">Actual: ${currentTerms.powerPrice}/kW-mes</p>
            </div>

            {/* Volumen */}
            <div className="space-y-2">
              <Label htmlFor="volume" className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-purple-600" />
                Volumen (MWh)
              </Label>
              <Input
                id="volume"
                type="number"
                step="0.01"
                value={formData.proposedVolume}
                onChange={(e) => setFormData({...formData, proposedVolume: parseFloat(e.target.value)})}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">Actual: {currentTerms.volume} MWh</p>
            </div>

            {/* Plazo */}
            <div className="space-y-2">
              <Label htmlFor="term" className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-orange-600" />
                Plazo (meses)
              </Label>
              <Input
                id="term"
                type="number"
                min="1"
                value={formData.proposedTerm}
                onChange={(e) => setFormData({...formData, proposedTerm: parseInt(e.target.value)})}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">Actual: {currentTerms.term} meses</p>
            </div>
          </div>

          {/* Términos de Pago */}
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Términos de Pago</Label>
            <Input
              id="paymentTerms"
              value={formData.proposedPaymentTerms}
              onChange={(e) => setFormData({...formData, proposedPaymentTerms: e.target.value})}
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500">Actual: {currentTerms.paymentTerms}</p>
          </div>

          {/* Garantías */}
          <div className="space-y-2">
            <Label htmlFor="guarantees">Garantías</Label>
            <Input
              id="guarantees"
              value={formData.proposedGuarantees}
              onChange={(e) => setFormData({...formData, proposedGuarantees: e.target.value})}
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500">Actual: {currentTerms.guarantees}</p>
          </div>

          {/* Condiciones Adicionales */}
          <div className="space-y-2">
            <Label htmlFor="conditions">Condiciones Adicionales</Label>
            <Textarea
              id="conditions"
              value={formData.proposedConditions}
              onChange={(e) => setFormData({...formData, proposedConditions: e.target.value})}
              className="w-full"
              rows={3}
            />
            <p className="text-xs text-gray-500">Actual: {currentTerms.conditions || 'Ninguna'}</p>
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje/Justificación</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="Explique los motivos de los cambios propuestos..."
              className="w-full"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Propuesta
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
