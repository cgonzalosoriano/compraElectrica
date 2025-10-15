
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface CloseQuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteRequestId: string;
  quoteRequestTitle: string;
  onSuccess: () => void;
}

export default function CloseQuoteRequestModal({
  isOpen,
  onClose,
  quoteRequestId,
  quoteRequestTitle,
  onSuccess,
}: CloseQuoteRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  const handleClose = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/quote-requests/${quoteRequestId}/close`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cerrar la solicitud');
      }

      showAlert('Solicitud cerrada exitosamente', 'success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error:', error);
      showAlert(error.message || 'Error al cerrar la solicitud', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Cerrar Solicitud de Cotización</span>
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés cerrar esta solicitud?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">Información importante</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Al cerrar esta solicitud:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
                    <li>No podrás recibir más ofertas de proveedores</li>
                    <li>Los proveedores serán notificados del cierre</li>
                    <li>Podrás seguir viendo las ofertas ya recibidas</li>
                    <li>Esta acción no se puede deshacer</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Solicitud:</strong> {quoteRequestTitle}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleClose}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cerrar Solicitud
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertType === 'success' ? 'Éxito' : 'Error'}
            </AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
