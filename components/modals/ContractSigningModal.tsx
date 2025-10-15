
'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Upload, Download, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import ContractPreview from '../ContractPreview'

interface ContractData {
  id: string
  clientName: string
  providerName: string
  date: string
  energyPrice: number
  powerPrice: number
  term: number
  volume: number
  status: string
  terms: string
  startDate: string
  endDate: string
  signatures?: {
    clientSigned: boolean
    providerSigned: boolean
    clientSignedAt?: string
    providerSignedAt?: string
    isCurrentUserClient: boolean
    isCurrentUserProvider: boolean
    canDownloadClientSignedDoc: boolean
    canDownloadProviderSignedDoc: boolean
    bothPartiesSigned: boolean
  }
}

interface ContractSigningModalProps {
  isOpen: boolean
  onClose: () => void
  contractId: string
  clientName: string
  providerName: string
  userType: 'CLIENT' | 'PROVIDER'
  contractType?: 'offer' | 'quote' // Tipo de contrato: oferta o cotización
}

export default function ContractSigningModal({ 
  isOpen, 
  onClose, 
  contractId, 
  clientName, 
  providerName, 
  userType,
  contractType = 'offer' // Por defecto, contrato de oferta
}: ContractSigningModalProps) {
  const [step, setStep] = useState<'preview' | 'upload'>('preview')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [contractData, setContractData] = useState<ContractData | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMessage, setUploadMessage] = useState('')

  // Cargar datos de la vista previa cuando se abre el modal
  useEffect(() => {
    if (isOpen && step === 'preview') {
      loadContractPreview()
    }
  }, [isOpen, contractId])

  const loadContractPreview = async () => {
    setIsLoadingPreview(true)
    try {
      const endpoint = contractType === 'quote' 
        ? `/api/quote-contracts/${contractId}/preview`
        : `/api/contracts/${contractId}/preview`
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setContractData(data)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al cargar la vista previa del contrato')
      }
    } catch (error) {
      console.error('Error loading contract preview:', error)
      alert('Error al cargar la vista previa del contrato')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const generateAndDownloadPDF = async () => {
    setIsGenerating(true)
    try {
      const endpoint = contractType === 'quote'
        ? `/api/quote-contracts/${contractId}/generate-pdf`
        : `/api/contracts/${contractId}/generate-pdf`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        // El endpoint devuelve el PDF directamente, no JSON
        const blob = await response.blob()
        
        // Crear URL temporal para el PDF
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contrato-${contractId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        // Mostrar mensaje de éxito
        alert('PDF generado y descargado exitosamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al generar el contrato')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el contrato')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadSignedDocument = async (party: 'client' | 'provider') => {
    try {
      const endpoint = contractType === 'quote'
        ? `/api/quote-contracts/${contractId}/download-signed?party=${party}`
        : `/api/contracts/${contractId}/download-signed?party=${party}`
      const a = document.createElement('a')
      a.href = endpoint
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading signed document:', error)
      alert('Error al descargar el documento firmado')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecciona un archivo PDF')
        return
      }
      setSelectedFile(file)
    }
  }

  const uploadSignedContract = async () => {
    if (!selectedFile) {
      alert('Por favor, selecciona un archivo')
      return
    }

    setIsUploading(true)
    try {
      // Primero subir el archivo a S3
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('contractId', contractId)
      formData.append('userType', userType)

      const uploadResponse = await fetch('/api/upload/signed-contract', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json()
        throw new Error(uploadError.error || 'Error al subir el archivo')
      }

      const uploadData = await uploadResponse.json()

      // Luego procesar la firma del contrato
      const signEndpoint = contractType === 'quote'
        ? `/api/quote-contracts/${contractId}/sign`
        : `/api/contracts/${contractId}/sign`
      const response = await fetch(signEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          signedDocumentPath: uploadData.cloudStoragePath 
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUploadMessage(data.message)
        
        if (data.bothPartiesSigned) {
          // Ambas partes han firmado - contrato completado
          setTimeout(() => {
            onClose()
            window.location.reload() // Refrescar para mostrar el cambio de estado
          }, 2000)
        } else {
          // Solo una parte ha firmado - esperando la otra
          setTimeout(() => {
            onClose()
            window.location.reload()
          }, 2000)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Error al procesar el documento')
      }
    } catch (error) {
      console.error('Error uploading signed contract:', error)
      alert('Error al subir el documento firmado: ' + (error as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'preview' ? 'Vista Previa del Contrato' : 'Firma Digital de Contrato'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {userType === 'CLIENT' ? `Cliente: ${clientName}` : `Proveedor: ${providerName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {step === 'preview' && (
            <div className="space-y-6">
              {isLoadingPreview ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Cargando vista previa del contrato...</p>
                </div>
              ) : contractData ? (
                <>
                  {/* Vista Previa del Contrato */}
                  <ContractPreview contractData={contractData} />

                  {/* Estado de Firmas */}
                  {contractData.signatures && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                        Estado de Firmas
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className={`flex items-center space-x-2 p-3 rounded ${
                          contractData.signatures.clientSigned 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-100 border border-gray-300'
                        }`}>
                          {contractData.signatures.clientSigned ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-sm">Cliente</p>
                            <p className="text-xs text-gray-600">
                              {contractData.signatures.clientSigned 
                                ? `Firmado el ${contractData.signatures.clientSignedAt}` 
                                : 'Pendiente de firma'}
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-2 p-3 rounded ${
                          contractData.signatures.providerSigned 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-100 border border-gray-300'
                        }`}>
                          {contractData.signatures.providerSigned ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-sm">Proveedor</p>
                            <p className="text-xs text-gray-600">
                              {contractData.signatures.providerSigned 
                                ? `Firmado el ${contractData.signatures.providerSignedAt}` 
                                : 'Pendiente de firma'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mostrar mensaje especial si la otra parte ya firmó */}
                      {contractData.signatures.canDownloadClientSignedDoc && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                          <p className="text-sm text-yellow-800">
                            <strong>¡Importante!</strong> El cliente ya firmó el contrato. Descarga el documento firmado por el cliente, 
                            agrégale tu firma y súbelo.
                          </p>
                        </div>
                      )}
                      {contractData.signatures.canDownloadProviderSignedDoc && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                          <p className="text-sm text-yellow-800">
                            <strong>¡Importante!</strong> El proveedor ya firmó el contrato. Descarga el documento firmado por el proveedor 
                            para tu registro.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botones de Acción */}
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 -mx-6 px-6 -mb-6 pb-6">
                    <div className="flex flex-col gap-3">
                      {/* Botón para descargar el contrato firmado por la otra parte */}
                      {contractData.signatures?.canDownloadClientSignedDoc && (
                        <Button
                          onClick={() => downloadSignedDocument('client')}
                          className="bg-orange-600 hover:bg-orange-700 w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar Contrato Firmado por el Cliente
                        </Button>
                      )}
                      {contractData.signatures?.canDownloadProviderSignedDoc && (
                        <Button
                          onClick={() => downloadSignedDocument('provider')}
                          className="bg-orange-600 hover:bg-orange-700 w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar Contrato Firmado por el Proveedor
                        </Button>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={generateAndDownloadPDF}
                          disabled={isGenerating}
                          className="bg-blue-600 hover:bg-blue-700 flex-1"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generando PDF...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Descargar PDF Original
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => setStep('upload')}
                          className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Subir Contrato Firmado
                        </Button>

                        <Button
                          onClick={onClose}
                          variant="outline"
                        >
                          Cerrar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <p className="text-xs text-blue-800">
                        <strong>Nota:</strong> {contractData.signatures?.canDownloadClientSignedDoc 
                          ? 'Descarga el contrato firmado por el cliente, agrégale tu firma y súbelo.' 
                          : contractData.signatures?.canDownloadProviderSignedDoc
                          ? 'Descarga el contrato firmado por el proveedor para tu registro.'
                          : 'Descarga el PDF original, fírmalo digitalmente o imprímelo para firmarlo físicamente, escanéalo y súbelo usando el botón "Subir Contrato Firmado".'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <p className="text-gray-600">No se pudo cargar la vista previa del contrato</p>
                  <Button
                    onClick={loadContractPreview}
                    className="mt-4"
                  >
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <Upload className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Subir Contrato Firmado
                </h3>
                <p className="text-gray-600 mb-4">
                  Sube el documento PDF firmado para completar tu parte del proceso
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="mb-4"
                />
                {selectedFile && (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Proceso de Firma Digital</p>
                    <p>Una vez que subas tu documento firmado, la otra parte será notificada para que haga lo mismo. El contrato se considerará completamente firmado cuando ambas partes hayan subido sus documentos.</p>
                  </div>
                </div>
              </div>

              {uploadMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-green-700">{uploadMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={uploadSignedContract}
                  disabled={!selectedFile || isUploading}
                  className="bg-purple-600 hover:bg-purple-700 flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Documento Firmado
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setStep('preview')}
                  variant="outline"
                  disabled={isUploading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Contrato
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
