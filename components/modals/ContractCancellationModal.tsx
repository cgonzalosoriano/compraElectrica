
'use client';

import { useState } from 'react';
import { X, MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';

interface ContractCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractTitle: string;
  providerName: string;
}

export default function ContractCancellationModal({
  isOpen,
  onClose,
  contractId,
  contractTitle,
  providerName
}: ContractCancellationModalProps) {
  const [subject, setSubject] = useState(`Cancelación de contrato: ${contractTitle}`);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Por favor, proporciona un motivo para la cancelación');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/contracts/${contractId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reason: message.trim(),
          subject: subject.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al cancelar el contrato');
      }
    } catch (error) {
      console.error('Error cancelling contract:', error);
      alert('Error al cancelar el contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSubject(`Cancelación de contrato: ${contractTitle}`);
      setMessage('');
      setSuccess(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 rounded-lg p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Cancelar Contrato
              </h2>
              <p className="text-sm text-gray-600">
                Enviar mensaje al proveedor sobre la cancelación
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Contrato Cancelado
              </h3>
              <p className="text-green-600 mb-4">
                El mensaje ha sido enviado al proveedor y el contrato ha sido cancelado exitosamente.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <p className="text-sm text-green-700">
                  <strong>Proveedor notificado:</strong> {providerName}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Asunto:</strong> {subject}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">
                      Información del Contrato
                    </h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      <strong>Contrato:</strong> {contractTitle}
                    </p>
                    <p className="text-sm text-yellow-700 mb-2">
                      <strong>Proveedor:</strong> {providerName}
                    </p>
                    <p className="text-sm text-yellow-700">
                      Al cancelar este contrato, se enviará un mensaje al proveedor con el motivo de la cancelación y el estado del contrato cambiará a "Cancelado".
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto del mensaje
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Asunto del mensaje..."
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la cancelación *
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Por favor, explica el motivo de la cancelación del contrato..."
                    rows={5}
                    disabled={isSubmitting}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este mensaje será enviado al proveedor junto con la notificación de cancelación.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !message.trim()}
                  className="bg-red-600 hover:bg-red-700 flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelando contrato...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Cancelar Contrato y Enviar Mensaje
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Volver
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
