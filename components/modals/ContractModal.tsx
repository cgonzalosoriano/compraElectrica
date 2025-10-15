
'use client'

import { useState } from 'react'
import { X, FileText, Download, Eye, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'

interface ContractModalProps {
  isOpen: boolean
  onClose: () => void
  clientOfferId: string
  clientName: string
}

export default function ContractModal({ isOpen, onClose, clientOfferId, clientName }: ContractModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [contractGenerated, setContractGenerated] = useState(false)
  const [contractContent, setContractContent] = useState('')
  const [contractId, setContractId] = useState('')
  const [contractExists, setContractExists] = useState(false)

  const generateContract = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientOfferId }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setContractGenerated(true)
        setContractId(data.contractId)
        setContractExists(data.existing || false)
        // Obtener el contenido del contrato
        await fetchContractContent(data.contractId)
      } else {
        alert(data.error || 'Error al iniciar negociación')
      }
    } catch (error) {
      console.error('Error generating contract:', error)
      alert('Error al generar contrato')
    } finally {
      setIsGenerating(false)
    }
  }

  const fetchContractContent = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`)
      if (response.ok) {
        const data = await response.json()
        setContractContent(data.contract.terms)
      }
    } catch (error) {
      console.error('Error fetching contract content:', error)
    }
  }

  const downloadContract = () => {
    if (!contractContent) return
    
    const blob = new Blob([contractContent], { type: 'text/plain; charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `contrato_${contractId}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const openContractView = () => {
    // Abrir el modal de vista completa del contrato
    window.open(`/contracts/${contractId}`, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {contractGenerated && contractExists ? 'Ver Contrato' : 'Iniciar Negociación'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Cliente: {clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!contractGenerated ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¿Iniciar proceso de negociación?
              </h3>
              <p className="text-gray-600 mb-6">
                Se iniciará el proceso de negociación donde ambas partes pueden proponer cambios a los términos antes de generar el contrato final.
              </p>
              <Button
                onClick={generateContract}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Iniciar Negociación
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {contractExists ? 'Proceso de Negociación' : 'Proceso Iniciado'}
                  </h3>
                  <div className="flex space-x-3">
                    <Button
                      onClick={downloadContract}
                      variant="outline"
                      size="sm"
                      disabled={!contractContent}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                    <Button
                      onClick={openContractView}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver y Negociar
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {contractContent}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Eye className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      {contractExists ? 'Proceso de Negociación en Curso' : 'Proceso de Negociación Iniciado'}
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        {contractExists 
                          ? 'Ya existe un proceso de negociación para esta solicitud. Puede ver los términos actuales y proponer cambios.'
                          : 'El proceso de negociación se ha iniciado exitosamente. Ambas partes pueden ahora proponer cambios a los términos antes de generar el contrato final.'
                        }
                      </p>
                      <p className="mt-1">
                        Use el botón "Ver y Negociar" para acceder a todas las funcionalidades de negociación.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
