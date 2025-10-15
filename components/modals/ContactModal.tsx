
'use client'

import { useState } from 'react'
import { X, MessageSquare, Send, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  contractId: string
  recipientName: string
  recipientType: 'CLIENT' | 'PROVIDER'
}

export default function ContactModal({ 
  isOpen, 
  onClose, 
  contractId, 
  recipientName, 
  recipientType 
}: ContactModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const sendMessage = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Por favor, completa el asunto y el mensaje')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch(`/api/contracts/${contractId}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subject: subject.trim(),
          message: message.trim()
        })
      })

      if (response.ok) {
        alert('Mensaje enviado exitosamente')
        setSubject('')
        setMessage('')
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al enviar el mensaje')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error al enviar el mensaje')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Contactar {recipientType === 'PROVIDER' ? 'Proveedor' : 'Cliente'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Enviar mensaje a: {recipientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Asunto
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del mensaje..."
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={6}
              className="w-full resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Comunicación del Contrato</p>
                <p>Este mensaje se enviará al {recipientType === 'PROVIDER' ? 'proveedor' : 'cliente'} relacionado con este contrato. Mantén una comunicación profesional y clara.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={sendMessage}
              disabled={isSending || !subject.trim() || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 flex-1"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
