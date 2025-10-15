
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EditQuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteRequestId: string;
  onSuccess: () => void;
}

interface Period {
  periodNumber: number;
  periodName: string;
  powerKW: number;
  energyMWh: number;
}

interface Clause {
  clauseName: string;
  clauseDescription: string;
  isRequired: boolean;
}

interface QuoteRequestData {
  title: string;
  description: string | null;
  termMonths: number;
  deadline: string;
  paymentTerms: string | null;
  guaranteesOffered: string | null;
  deliveryNode: string | null;
  periods: Period[];
  clauses: Clause[];
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function EditQuoteRequestModal({
  isOpen,
  onClose,
  quoteRequestId,
  onSuccess,
}: EditQuoteRequestModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [guarantees, setGuarantees] = useState('');
  const [deliveryNode, setDeliveryNode] = useState('');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [clauses, setClauses] = useState<Clause[]>([]);

  useEffect(() => {
    if (isOpen && quoteRequestId) {
      loadQuoteRequest();
    }
  }, [isOpen, quoteRequestId]);

  const loadQuoteRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quote-requests/${quoteRequestId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar la solicitud');
      }

      const data = await response.json();
      const quoteRequest = data.quoteRequest;

      setTitle(quoteRequest.title || '');
      setDescription(quoteRequest.description || '');
      setDeadline(quoteRequest.deadline ? new Date(quoteRequest.deadline).toISOString().split('T')[0] : '');
      setPaymentTerms(quoteRequest.paymentTerms || '');
      setGuarantees(quoteRequest.guaranteesOffered || '');
      setDeliveryNode(quoteRequest.deliveryNode || '');
      setPeriods(quoteRequest.periods || []);
      setClauses(quoteRequest.clauses || []);
    } catch (err) {
      console.error('Error al cargar solicitud:', err);
      showAlert('Error', 'No se pudo cargar la solicitud de cotización');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handlePeriodChange = (index: number, field: 'powerKW' | 'energyMWh', value: string) => {
    const newPeriods = [...periods];
    newPeriods[index][field] = parseFloat(value) || 0;
    setPeriods(newPeriods);
  };

  const addClause = () => {
    setClauses([...clauses, { clauseName: '', clauseDescription: '', isRequired: false }]);
  };

  const removeClause = (index: number) => {
    setClauses(clauses.filter((_, i) => i !== index));
  };

  const handleClauseChange = (index: number, field: 'clauseName' | 'clauseDescription' | 'isRequired', value: string | boolean) => {
    const newClauses = [...clauses];
    if (field === 'isRequired' && typeof value === 'boolean') {
      newClauses[index][field] = value;
    } else if (field !== 'isRequired' && typeof value === 'string') {
      newClauses[index][field] = value;
    }
    setClauses(newClauses);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validaciones
      if (!title.trim()) {
        throw new Error('El título es requerido');
      }
      if (!deadline) {
        throw new Error('La fecha límite es requerida');
      }

      const response = await fetch(`/api/quote-requests/${quoteRequestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          deadline,
          paymentTerms,
          guaranteesOffered: guarantees,
          deliveryNode,
          periods,
          clauses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar la solicitud');
      }

      showAlert('Éxito', 'La solicitud de cotización se actualizó correctamente');
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al actualizar:', err);
      showAlert('Error', err instanceof Error ? err.message : 'Error al actualizar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-blue-600" />
              <span>Editar Solicitud de Cotización</span>
            </DialogTitle>
            <DialogDescription>
              Modificá los detalles de tu solicitud de cotización
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Básica</h3>
                
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título de la solicitud"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción detallada"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Fecha Límite *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Condiciones Comerciales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Condiciones Comerciales</h3>
                
                <div>
                  <Label htmlFor="paymentTerms">Condiciones de Pago</Label>
                  <Input
                    id="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Ej: 30 días fecha factura"
                  />
                </div>

                <div>
                  <Label htmlFor="guarantees">Garantías Ofrecidas</Label>
                  <Input
                    id="guarantees"
                    value={guarantees}
                    onChange={(e) => setGuarantees(e.target.value)}
                    placeholder="Ej: Póliza de caución"
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryNode">Nodo de Entrega</Label>
                  <Input
                    id="deliveryNode"
                    value={deliveryNode}
                    onChange={(e) => setDeliveryNode(e.target.value)}
                    placeholder="Ej: Nodo Buenos Aires"
                  />
                </div>
              </div>

              {/* Períodos de Consumo */}
              {periods.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Períodos de Consumo</h3>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-3">
                    {periods.map((period, index) => (
                      <div key={index} className="grid grid-cols-3 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Label className="text-xs">Período</Label>
                          <p className="font-medium">{period.periodName}</p>
                        </div>
                        <div>
                          <Label htmlFor={`power-${index}`} className="text-xs">Potencia (kW)</Label>
                          <Input
                            id={`power-${index}`}
                            type="number"
                            step="0.01"
                            value={period.powerKW}
                            onChange={(e) => handlePeriodChange(index, 'powerKW', e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`energy-${index}`} className="text-xs">Energía (MWh)</Label>
                          <Input
                            id={`energy-${index}`}
                            type="number"
                            step="0.01"
                            value={period.energyMWh}
                            onChange={(e) => handlePeriodChange(index, 'energyMWh', e.target.value)}
                            className="h-8"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cláusulas Personalizadas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Cláusulas Personalizadas</h3>
                  <Button type="button" size="sm" variant="outline" onClick={addClause}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Cláusula
                  </Button>
                </div>
                
                {clauses.length > 0 && (
                  <div className="space-y-3">
                    {clauses.map((clause, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label htmlFor={`clause-name-${index}`} className="text-xs">Nombre de la Cláusula</Label>
                              <Input
                                id={`clause-name-${index}`}
                                value={clause.clauseName}
                                onChange={(e) => handleClauseChange(index, 'clauseName', e.target.value)}
                                placeholder="Ej: Plazo de entrega"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`clause-desc-${index}`} className="text-xs">Descripción</Label>
                              <Textarea
                                id={`clause-desc-${index}`}
                                value={clause.clauseDescription}
                                onChange={(e) => handleClauseChange(index, 'clauseDescription', e.target.value)}
                                placeholder="Describe la cláusula..."
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`clause-req-${index}`}
                                checked={clause.isRequired}
                                onChange={(e) => handleClauseChange(index, 'isRequired', e.target.checked)}
                                className="rounded h-4 w-4"
                              />
                              <Label htmlFor={`clause-req-${index}`} className="text-sm cursor-pointer">
                                Cláusula obligatoria
                              </Label>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeClause(index)}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
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
