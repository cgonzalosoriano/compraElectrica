
'use client'

import { useState } from 'react'
import { X, MessageSquare, Send, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  clientOfferId: string
  clientName: string
  clientEmail: string
}

export default function MessageModal({ isOpen, onClose, clientOfferId, clientName, clientEmail }: MessageModalProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messageSent, setMessageSent] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) {
      alert('Por favor ingresa un mensaje')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          clientOfferId,
          message: message.trim()
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessageSent(true)
        setMessage('')
      } else {
        alert(data.error || 'Error al enviar mensaje')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error al enviar mensaje')
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setMessage('')
    setMessageSent(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Contactar Cliente</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enviar mensaje a: {clientName} ({clientEmail})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!messageSent ? (
            <div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Escribe tu mensaje aquí..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Este mensaje será enviado directamente al cliente y quedará registrado en el sistema.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={isSending || !message.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
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
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Mensaje Enviado
              </h3>
              <p className="text-gray-600 mb-6">
                Tu mensaje ha sido enviado exitosamente al cliente. El cliente recibirá una notificación y podrá responder a través de la plataforma.
              </p>
              <Button
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
