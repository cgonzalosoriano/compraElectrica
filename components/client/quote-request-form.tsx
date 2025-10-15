
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, FileText, Calendar, Zap, Building2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mapeo de meses
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Meses de inicio permitidos (inicio de trimestre)
const START_MONTHS = [
  { value: '1', label: 'Febrero' },   // índice 1
  { value: '4', label: 'Mayo' },      // índice 4
  { value: '7', label: 'Agosto' },    // índice 7
  { value: '10', label: 'Noviembre' } // índice 10
];

export default function QuoteRequestForm({ clientId }: { clientId: string }) {
  const [termMonths, setTermMonths] = useState(12);
  const [startMonth, setStartMonth] = useState('1'); // Febrero por defecto
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [customClauses, setCustomClauses] = useState<Array<{name: string, description: string, isRequired: boolean}>>([]);
  
  // Condiciones generales
  const [paymentTerms, setPaymentTerms] = useState('');
  const [guarantees, setGuarantees] = useState('');
  const [deliveryNode, setDeliveryNode] = useState('');
  
  // Tipo de energía (múltiples selecciones)
  const [energySources, setEnergySources] = useState<string[]>(['todas']);
  const [requiresRenewableCertificate, setRequiresRenewableCertificate] = useState(false);
  
  // Manejar cambios en las fuentes de energía
  const handleEnergySourceChange = (source: string) => {
    if (source === 'todas') {
      if (energySources.includes('todas')) {
        // Si "Todas" ya está marcado, desmarcar todo
        setEnergySources([]);
      } else {
        // Si "Todas" no está marcado, marcar todo
        setEnergySources(['todas', 'solar', 'eolica', 'hidraulica', 'termica', 'nuclear', 'biomasa']);
      }
    } else {
      if (energySources.includes(source)) {
        // Desmarcar esta fuente y "todas"
        const newSources = energySources.filter(s => s !== source && s !== 'todas');
        setEnergySources(newSources);
      } else {
        // Marcar esta fuente
        const newSources = [...energySources.filter(s => s !== 'todas'), source];
        // Si todas las fuentes individuales están marcadas, marcar "todas"
        if (newSources.length === 6) {
          newSources.push('todas');
        }
        setEnergySources(newSources);
      }
    }
  };
  
  // Calcular nombres de meses basados en el mes de inicio
  const getMonthName = (index: number) => {
    const startIdx = parseInt(startMonth);
    const monthIdx = (startIdx + index) % 12;
    return MONTHS[monthIdx];
  };

  // Generar períodos basados en termMonths
  const [periods, setPeriods] = useState<Array<{periodNumber: number, periodName: string, powerMW: string, energyMWh: string}>>(
    Array.from({length: termMonths}, (_, i) => ({
      periodNumber: i + 1,
      periodName: getMonthName(i),
      powerMW: '',
      energyMWh: ''
    }))
  );

  const handleTermChange = (value: number) => {
    setTermMonths(value);
    updatePeriods(value, startMonth);
  };

  const handleStartMonthChange = (value: string) => {
    setStartMonth(value);
    updatePeriods(termMonths, value);
  };

  const updatePeriods = (months: number, start: string) => {
    setPeriods(
      Array.from({length: months}, (_, i) => {
        const existing = periods[i];
        const startIdx = parseInt(start);
        const monthIdx = (startIdx + i) % 12;
        return {
          periodNumber: i + 1,
          periodName: MONTHS[monthIdx],
          powerMW: existing?.powerMW || '',
          energyMWh: existing?.energyMWh || ''
        };
      })
    );
  };

  const handlePeriodChange = (index: number, field: 'powerMW' | 'energyMWh', value: string) => {
    const newPeriods = [...periods];
    newPeriods[index][field] = value;
    setPeriods(newPeriods);
  };

  const addCustomClause = () => {
    setCustomClauses([...customClauses, { name: '', description: '', isRequired: false }]);
  };

  const removeCustomClause = (index: number) => {
    setCustomClauses(customClauses.filter((_, i) => i !== index));
  };

  const handleClauseChange = (index: number, field: 'name' | 'description' | 'isRequired', value: string | boolean) => {
    const newClauses = [...customClauses];
    if (field === 'isRequired' && typeof value === 'boolean') {
      newClauses[index][field] = value;
    } else if (field !== 'isRequired' && typeof value === 'string') {
      newClauses[index][field] = value;
    }
    setCustomClauses(newClauses);
  };

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    const labels = periods.map(p => p.periodName);
    const powerData = periods.map(p => parseFloat(p.powerMW) || 0);
    const energyData = periods.map(p => parseFloat(p.energyMWh) || 0);

    return {
      power: {
        labels,
        datasets: [
          {
            label: 'Potencia (MW)',
            data: powerData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      energy: {
        labels,
        datasets: [
          {
            label: 'Energía (MWh)',
            data: energyData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
    };
  }, [periods]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validar campos requeridos
      if (!title.trim()) {
        throw new Error('El título es requerido');
      }
      if (!deadline) {
        throw new Error('La fecha límite es requerida');
      }
      if (!termMonths || termMonths <= 0) {
        throw new Error('El plazo debe ser mayor a 0 meses');
      }

      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          termMonths,
          startMonth,
          periods,
          paymentTerms,
          guarantees,
          deliveryNode,
          energySources,
          requiresRenewableCertificate,
          deadline,
          customClauses
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la solicitud');
      }

      // Mostrar diálogo de éxito
      setShowSuccessDialog(true);
      
      // Limpiar formulario
      setTimeout(() => {
        window.location.href = '/client?tab=cotizaciones';
      }, 2000);
      
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificar si hay datos para mostrar gráficos
  const hasData = periods.some(p => parseFloat(p.powerMW) > 0 || parseFloat(p.energyMWh) > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Información de la Solicitud</span>
          </CardTitle>
          <CardDescription>Detalles generales de tu solicitud de cotización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título de la Solicitud *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Compra de energía renovable para planta industrial"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe detalles adicionales sobre tu necesidad..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">Fuente de Energía</Label>
              <p className="text-xs text-gray-600 mb-3">
                Seleccioná las fuentes de energía de tu interés (podés seleccionar múltiples opciones)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id="todas"
                    checked={energySources.includes('todas')}
                    onChange={() => handleEnergySourceChange('todas')}
                    className="rounded h-4 w-4"
                  />
                  <Label htmlFor="todas" className="text-sm font-medium cursor-pointer">
                    Todas
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id="solar"
                    checked={energySources.includes('solar')}
                    onChange={() => handleEnergySourceChange('solar')}
                    className="rounded h-4 w-4"
                  />
                  <Label htmlFor="solar" className="text-sm font-normal cursor-pointer">
                    Solar
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id="eolica"
                    checked={energySources.includes('eolica')}
                    onChange={() => handleEnergySourceChange('eolica')}
                    className="rounded h-4 w-4"
                  />
                  <Label htmlFor="eolica" className="text-sm font-normal cursor-pointer">
                    Eólica
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id="hidraulica"
                    checked={energySources.includes('hidraulica')}
                    onChange={() => handleEnergySourceChange('hidraulica')}
                    className="rounded h-4 w-4"
                  />
                  <Label htmlFor="hidraulica" className="text-sm font-normal cursor-pointer">
                    Hidráulica
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id="termica"
                    checked={energySources.includes('termica')}
                    onChange={() => handleEnergySourceChange('termica')}
                    className="rounded h-4 w-4"
                  />
                  <Label htmlFor="termica" className="text-sm font-normal cursor-pointer">
                    Térmica
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id="nuclear"
                    checked={energySources.includes('nuclear')}
                    onChange={() => handleEnergySourceChange('nuclear')}
                    className="rounded h-4 w-4"
                  />
                  <Label htmlFor="nuclear" className="text-sm font-normal cursor-pointer">
                    Nuclear
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id="biomasa"
                    checked={energySources.includes('biomasa')}
                    onChange={() => handleEnergySourceChange('biomasa')}
                    className="rounded h-4 w-4"
                  />
                  <Label htmlFor="biomasa" className="text-sm font-normal cursor-pointer">
                    Biomasa
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <input
                type="checkbox"
                id="renewableCertificate"
                checked={requiresRenewableCertificate}
                onChange={(e) => setRequiresRenewableCertificate(e.target.checked)}
                className="rounded h-4 w-4"
              />
              <Label htmlFor="renewableCertificate" className="text-sm font-medium cursor-pointer">
                Requiere certificado de energía renovable (I-REC o equivalente)
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startMonth">Inicio del Suministro *</Label>
              <Select value={startMonth} onValueChange={handleStartMonthChange}>
                <SelectTrigger id="startMonth">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {START_MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Solo se puede iniciar en el primer mes de cada trimestre</p>
            </div>

            <div>
              <Label htmlFor="termMonths">Plazo (meses) *</Label>
              <Input
                id="termMonths"
                type="number"
                min="1"
                max="120"
                value={termMonths}
                onChange={(e) => handleTermChange(parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Se generarán {termMonths} períodos mensuales</p>
            </div>

            <div>
              <Label htmlFor="deadline">Fecha Límite para Recibir Ofertas *</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Potencia y Energía */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span>Potencia y Energía por Período</span>
          </CardTitle>
          <CardDescription>Ingresá los valores de potencia (MW) y energía (MWh) para cada mes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold text-sm">Período</th>
                  <th className="text-left p-3 font-semibold text-sm">Potencia (MW)</th>
                  <th className="text-left p-3 font-semibold text-sm">Energía (MWh)</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period, index) => (
                  <tr key={period.periodNumber} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <Badge variant="outline">{period.periodName}</Badge>
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={period.powerMW}
                        onChange={(e) => handlePeriodChange(index, 'powerMW', e.target.value)}
                        placeholder="0.00"
                        className="max-w-[150px]"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={period.energyMWh}
                        onChange={(e) => handlePeriodChange(index, 'energyMWh', e.target.value)}
                        placeholder="0.00"
                        className="max-w-[150px]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      {hasData && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Visualización de Volúmenes</span>
            </CardTitle>
            <CardDescription>Gráficos de potencia y energía solicitada en el período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Potencia */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Potencia Solicitada (MW)</h4>
                <div className="h-[300px] w-full">
                  <Line data={chartData.power} options={chartOptions} />
                </div>
              </div>

              {/* Gráfico de Energía */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Energía Solicitada (MWh)</h4>
                <div className="h-[300px] w-full">
                  <Line data={chartData.energy} options={chartOptions} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Condiciones Generales */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>Condiciones Generales del Contrato</span>
          </CardTitle>
          <CardDescription>
            Definí las condiciones contractuales que serán incluidas en el contrato final. Estas cláusulas son vinculantes y deben redactarse de forma clara y profesional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Condiciones de Pago */}
          <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label htmlFor="paymentTerms" className="text-base font-semibold text-gray-900">
              1. Condiciones de Pago
            </Label>
            <p className="text-xs text-gray-600 mb-2">
              Especificá las condiciones de pago, plazos, modalidad y cualquier requisito financiero aplicable al contrato.
            </p>
            <Textarea
              id="paymentTerms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Ejemplo: El comprador se compromete a realizar el pago dentro de los 30 (treinta) días calendario posteriores a la emisión de la factura correspondiente, mediante transferencia bancaria a la cuenta designada por el proveedor. Los pagos se realizarán de forma mensual y vencida."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Garantías */}
          <div className="space-y-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Label htmlFor="guarantees" className="text-base font-semibold text-gray-900">
              2. Garantías y Avales
            </Label>
            <p className="text-xs text-gray-600 mb-2">
              Indicá las garantías que ofrecés como comprador (ej: garantía bancaria, aval, depósito en garantía) para respaldar el cumplimiento del contrato.
            </p>
            <Textarea
              id="guarantees"
              value={guarantees}
              onChange={(e) => setGuarantees(e.target.value)}
              placeholder="Ejemplo: El comprador constituirá una garantía bancaria irrevocable e incondicional equivalente al 10% del valor total del contrato, la cual deberá mantenerse vigente durante toda la duración del suministro y por 60 días adicionales posteriores a su finalización. La garantía será ejecutable ante cualquier incumplimiento de las obligaciones contractuales del comprador."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Punto de Entrega */}
          <div className="space-y-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <Label htmlFor="deliveryNode" className="text-base font-semibold text-gray-900">
              3. Punto de Entrega y Nodo de Suministro
            </Label>
            <p className="text-xs text-gray-600 mb-2">
              Indicá el nodo de entrega donde se realizará el suministro y cualquier especificación técnica asociada.
            </p>
            <Textarea
              id="deliveryNode"
              value={deliveryNode}
              onChange={(e) => setDeliveryNode(e.target.value)}
              placeholder="Ejemplo: La entrega de energía se realizará en el nodo de transmisión [especificar nodo exacto, ej: Buenos Aires - Ezeiza], según la configuración del MEM (Mercado Eléctrico Mayorista). El proveedor asumirá todos los costos de transporte y pérdidas hasta el punto de entrega especificado. Cualquier cambio en el punto de entrega deberá ser acordado por escrito entre las partes con al menos 60 días de anticipación."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Nota Informativa */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Nota importante:</strong> Las condiciones aquí establecidas formarán parte del contrato final. Es fundamental que sean redactadas con precisión y claridad, ya que serán vinculantes para ambas partes. Se recomienda consultar con asesoría legal para garantizar que las cláusulas cumplan con la normativa vigente y protejan adecuadamente tus intereses.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cláusulas Personalizadas */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Cláusulas Personalizadas</span>
              </CardTitle>
              <CardDescription>Agregá cláusulas específicas para tu solicitud</CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addCustomClause}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cláusula
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {customClauses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay cláusulas personalizadas. Hacé clic en "Agregar Cláusula" para agregar una.
            </p>
          ) : (
            customClauses.map((clause, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="Nombre de la cláusula"
                        value={clause.name}
                        onChange={(e) => handleClauseChange(index, 'name', e.target.value)}
                      />
                      <Textarea
                        placeholder="Descripción de la cláusula"
                        value={clause.description}
                        onChange={(e) => handleClauseChange(index, 'description', e.target.value)}
                        rows={2}
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={clause.isRequired}
                          onChange={(e) => handleClauseChange(index, 'isRequired', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`required-${index}`} className="text-sm">
                          Esta cláusula es obligatoria
                        </Label>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCustomClause(index)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Mensaje de error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Botón de envío */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => window.location.href = '/client'}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Enviando...' : 'Publicar Solicitud de Cotización'}
        </Button>
      </div>

      {/* Diálogo de éxito */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">¡Solicitud Creada!</h3>
              <p className="text-sm text-gray-500 mb-4">
                Tu solicitud de cotización ha sido publicada exitosamente. Los proveedores comenzarán a enviar sus ofertas.
              </p>
              <p className="text-xs text-gray-400">
                Redirigiendo a Mis Cotizaciones...
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
