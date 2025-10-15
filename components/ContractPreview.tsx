
'use client'

import { FileText, Building2, Calendar, DollarSign, Zap, Clock, FileCheck } from 'lucide-react'

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
}

interface ContractPreviewProps {
  contractData: ContractData
}

export default function ContractPreview({ contractData }: ContractPreviewProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
        <div className="flex items-center space-x-3 mb-2">
          <FileText className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Contrato de Suministro Eléctrico</h1>
        </div>
        <p className="text-blue-100 text-sm">Mercado Energético Argentino</p>
      </div>

      {/* Contract Content */}
      <div className="p-6 space-y-6">
        {/* Parties Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Cliente</h3>
            </div>
            <p className="text-gray-700 font-medium">{contractData.clientName}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Proveedor</h3>
            </div>
            <p className="text-gray-700 font-medium">{contractData.providerName}</p>
          </div>
        </div>

        {/* Contract Details */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <FileCheck className="h-5 w-5 mr-2 text-blue-600" />
            Detalles del Contrato
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Fecha de Emisión</p>
                <p className="font-medium text-gray-900">{contractData.date}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">ID del Contrato</p>
                <p className="font-medium text-gray-900 text-xs">{contractData.id}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Fecha de Inicio</p>
                <p className="font-medium text-gray-900">{contractData.startDate}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Fecha de Fin</p>
                <p className="font-medium text-gray-900">{contractData.endDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Condiciones Económicas
          </h3>
          
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-gray-600">Precio de Energía</p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  ${contractData.energyPrice.toLocaleString('es-AR')}
                  <span className="text-sm font-normal text-gray-600"> /MWh</span>
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-gray-600">Precio de Potencia</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  ${contractData.powerPrice.toLocaleString('es-AR')}
                  <span className="text-sm font-normal text-gray-600"> /kW-mes</span>
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <p className="text-sm text-gray-600">Volumen</p>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {contractData.volume.toLocaleString('es-AR')}
                  <span className="text-sm font-normal text-gray-600"> MWh</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start space-x-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Plazo del Contrato</p>
              <p className="font-medium text-gray-900">{contractData.term} meses</p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Términos y Condiciones</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {contractData.terms}
            </p>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>Aviso Legal:</strong> Este contrato está sujeto a las regulaciones del mercado eléctrico argentino 
            y las normativas vigentes de CAMMESA. Ambas partes se comprometen a cumplir con todas las disposiciones 
            legales aplicables. La firma digital de este documento tiene la misma validez legal que una firma manuscrita 
            según la Ley de Firma Digital N° 25.506.
          </p>
        </div>

        {/* Signature Section */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Firmas</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-t-2 border-gray-300 pt-4">
              <p className="text-sm text-gray-600 mb-1">Firma del Cliente</p>
              <p className="font-medium text-gray-900">{contractData.clientName}</p>
              <p className="text-xs text-gray-500 mt-2">Fecha: ___________________</p>
            </div>
            <div className="border-t-2 border-gray-300 pt-4">
              <p className="text-sm text-gray-600 mb-1">Firma del Proveedor</p>
              <p className="font-medium text-gray-900">{contractData.providerName}</p>
              <p className="text-xs text-gray-500 mt-2">Fecha: ___________________</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-lg">
        <p className="text-xs text-center text-gray-500">
          Documento generado electrónicamente por el Mercado de Energía | {contractData.date}
        </p>
      </div>
    </div>
  )
}
