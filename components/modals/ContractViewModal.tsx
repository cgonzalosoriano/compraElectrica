

'use client'

import { useState, useEffect } from 'react'
import { X, Eye, Download, FileText, Loader2, MessageSquare, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import NegotiationModal from './NegotiationModal'

interface ContractViewModalProps {
  isOpen: boolean
  onClose: () => void
  contractId: string
}

interface Contract {
  id: string
  status: string
  terms: string
  createdAt: string
  client: {
    id: string
    name: string
    companyName: string
  }
  provider: {
    id: string
    name: string
    companyName: string
  }
  offer: {
    energyPrice: number
    powerPrice: number
    availableVolume: number
    term: number
    paymentTerms: string
    guarantees: string
    otherConditions?: string
  }
  negotiations: Array<{
    id: string
    status: string
    message: string
    responseMessage: string
    proposedEnergyPrice: number
    proposedPowerPrice: number
    proposedVolume: number
    proposedTerm: number
    proposedPaymentTerms: string
    proposedGuarantees: string
    proposedConditions: string
    createdAt: string
    proposer: {
      id: string
      name: string
      companyName: string
    }
    recipient: {
      id: string
      name: string
      companyName: string
    }
  }>
}

export default function ContractViewModal({ isOpen, onClose, contractId }: ContractViewModalProps) {
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    if (isOpen && contractId) {
      fetchContract()
    }
  }, [isOpen, contractId])

  const fetchContract = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/contracts/${contractId}`)
      if (response.ok) {
        const data = await response.json()
        setContract(data.contract)
        
        // Obtener usuario actual (simulado - en una implementación real lo obtendrías del contexto)
        const sessionResponse = await fetch('/api/auth/session')
        if (sessionResponse.ok) {
          const session = await sessionResponse.json()
          // Aquí necesitarías obtener el ID del usuario actual
          setCurrentUserId(data.contract.client.id) // Por ahora simulamos
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadContract = () => {
    if (!contract) return
    
    const blob = new Blob([contract.terms], { type: 'text/plain; charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `contrato_${contract.id}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleNegotiationResponse = async (negotiationId: string, response: string, responseMessage?: string) => {
    try {
      const res = await fetch(`/api/negotiations/${negotiationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, responseMessage })
      })

      if (res.ok) {
        const data = await res.json()
        alert(data.message)
        fetchContract() // Refrescar el contrato
      } else {
        const error = await res.json()
        alert(error.error || 'Error al responder')
      }
    } catch (error) {
      console.error('Error responding to negotiation:', error)
      alert('Error al responder a la negociación')
    }
  }

  const finalizeContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/finalize`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        fetchContract() // Refrescar el contrato
      } else {
        const error = await response.json()
        alert(error.error || 'Error al finalizar contrato')
      }
    } catch (error) {
      console.error('Error finalizing contract:', error)
      alert('Error al finalizar el contrato')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEGOTIATING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En Negociación</Badge>
      case 'DRAFT':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Borrador</Badge>
      case 'ACTIVE':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activo</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getNegotiationStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pendiente</Badge>
      case 'ACCEPTED':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Aceptada</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Rechazada</Badge>
      case 'COUNTER_OFFERED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Contra-oferta</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Contrato y Negociaciones</h2>
              <p className="text-sm text-gray-600 mt-1">ID: {contractId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Cargando contrato...</span>
              </div>
            ) : contract ? (
              <div className="space-y-6">
                {/* Estado del contrato */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-medium">Estado del Contrato</h3>
                    {getStatusBadge(contract.status)}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={downloadContract}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                    {contract.status === 'NEGOTIATING' && (
                      <Button
                        onClick={() => setNegotiationModalOpen(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Proponer Cambios
                      </Button>
                    )}
                    {contract.status === 'NEGOTIATING' && contract.negotiations.some(n => n.status === 'ACCEPTED') && (
                      <Button
                        onClick={finalizeContract}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar Contrato
                      </Button>
                    )}
                  </div>
                </div>

                {/* Negociaciones */}
                {contract.negotiations && contract.negotiations.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Historial de Negociaciones</h4>
                    <div className="space-y-3">
                      {contract.negotiations.map((negotiation) => (
                        <div key={negotiation.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">
                                {negotiation.proposer.companyName || negotiation.proposer.name}
                              </span>
                              <span className="text-sm text-gray-600">
                                → {negotiation.recipient.companyName || negotiation.recipient.name}
                              </span>
                              {getNegotiationStatusBadge(negotiation.status)}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(negotiation.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Energía:</span>
                              <p>${negotiation.proposedEnergyPrice}/MWh</p>
                            </div>
                            <div>
                              <span className="font-medium">Potencia:</span>
                              <p>${negotiation.proposedPowerPrice}/kW-mes</p>
                            </div>
                            <div>
                              <span className="font-medium">Volumen:</span>
                              <p>{negotiation.proposedVolume} MWh</p>
                            </div>
                            <div>
                              <span className="font-medium">Plazo:</span>
                              <p>{negotiation.proposedTerm} meses</p>
                            </div>
                          </div>

                          {negotiation.message && (
                            <div>
                              <span className="font-medium text-sm">Mensaje:</span>
                              <p className="text-sm text-gray-600 mt-1">{negotiation.message}</p>
                            </div>
                          )}

                          {negotiation.responseMessage && (
                            <div>
                              <span className="font-medium text-sm">Respuesta:</span>
                              <p className="text-sm text-gray-600 mt-1">{negotiation.responseMessage}</p>
                            </div>
                          )}

                          {negotiation.status === 'PENDING' && negotiation.recipient.id === currentUserId && (
                            <div className="flex space-x-2 pt-2 border-t">
                              <Button
                                onClick={() => handleNegotiationResponse(negotiation.id, 'ACCEPTED', '')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aceptar
                              </Button>
                              <Button
                                onClick={() => {
                                  const message = prompt('Mensaje de rechazo (opcional):')
                                  handleNegotiationResponse(negotiation.id, 'REJECTED', message || '')
                                }}
                                size="sm"
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                              <Button
                                onClick={() => setNegotiationModalOpen(true)}
                                size="sm"
                                variant="outline"
                              >
                                Contra-oferta
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Términos del contrato */}
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-gray-900">Términos del Contrato</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {contract.terms}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No se pudo cargar el contrato</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de negociación */}
      {contract && (
        <NegotiationModal
          isOpen={negotiationModalOpen}
          onClose={() => setNegotiationModalOpen(false)}
          contractId={contract.id}
          recipientId={currentUserId === contract.client.id ? contract.provider.id : contract.client.id}
          recipientName={currentUserId === contract.client.id ? 
            (contract.provider.companyName || contract.provider.name) : 
            (contract.client.companyName || contract.client.name)
          }
          currentTerms={{
            energyPrice: contract.offer.energyPrice,
            powerPrice: contract.offer.powerPrice,
            volume: contract.offer.availableVolume,
            term: contract.offer.term,
            paymentTerms: contract.offer.paymentTerms,
            guarantees: contract.offer.guarantees,
            conditions: contract.offer.otherConditions
          }}
        />
      )}
    </>
  )
}
