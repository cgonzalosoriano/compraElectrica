
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { clientOfferId } = await request.json()

    if (!clientOfferId) {
      return NextResponse.json({ error: 'ID de oferta de cliente requerido' }, { status: 400 })
    }

    // Obtener la oferta del cliente con todos los datos relacionados
    const clientOffer = await prisma.clientOffer.findUnique({
      where: { id: clientOfferId },
      include: {
        client: true,
        offer: {
          include: {
            provider: true
          }
        }
      }
    })

    if (!clientOffer) {
      return NextResponse.json({ error: 'Oferta de cliente no encontrada' }, { status: 404 })
    }

    if (clientOffer.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Solo se pueden generar contratos para ofertas aceptadas' }, { status: 400 })
    }

    if (!clientOffer.offer) {
      return NextResponse.json({ 
        error: 'No se puede generar contrato: la oferta original fue eliminada' 
      }, { status: 400 })
    }

    // Verificar que el usuario actual sea el proveedor de la oferta
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser || currentUser.id !== clientOffer.offer.providerId) {
      return NextResponse.json({ error: 'No autorizado para generar contrato en esta oferta' }, { status: 403 })
    }

    // Verificar si ya existe un contrato para esta oferta del cliente
    const existingContract = await prisma.contract.findUnique({
      where: { clientOfferId: clientOfferId }
    })

    if (existingContract) {
      return NextResponse.json({ error: 'Ya existe un contrato para esta solicitud' }, { status: 400 })
    }

    // Crear el contrato
    const contract = await prisma.contract.create({
      data: {
        clientOfferId: clientOfferId,
        clientId: clientOffer.clientId,
        providerId: clientOffer.offer.providerId,
        offerId: clientOffer.offerId,
        status: 'NEGOTIATING',
        terms: generateContractTerms(clientOffer)
      }
    })

    return NextResponse.json({ 
      success: true, 
      contractId: contract.id,
      message: 'Contrato generado exitosamente' 
    })

  } catch (error) {
    console.error('Error generating contract:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

function generateContractTerms(clientOffer: any): string {
  const currentDate = new Date().toLocaleDateString('es-AR')
  
  return `CONTRATO DE SUMINISTRO DE ENERGÍA ELÉCTRICA

FECHA: ${currentDate}

PARTES:
PROVEEDOR: ${clientOffer.offer?.provider?.companyName || 'N/A'}
EMAIL: ${clientOffer.offer?.provider?.email}
TELÉFONO: ${clientOffer.offer?.provider?.phone || 'N/A'}

CLIENTE: ${clientOffer.client?.companyName || 'N/A'}
EMAIL: ${clientOffer.client?.email}
TELÉFONO: ${clientOffer.client?.phone || 'N/A'}

TÉRMINOS DEL CONTRATO:

1. OFERTA ACEPTADA:
   - ID de Oferta: ${clientOffer.offer?.id}
   - Precio de Energía: $${clientOffer.offer?.energyPrice} por MWh
   - Precio de Potencia: $${clientOffer.offer?.powerPrice} por kW-mes
   - Volumen Disponible: ${clientOffer.offer?.availableVolume} MWh
   - Nodo de Entrega: ${clientOffer.offer?.deliveryNode}
   - Fuente de Generación: ${clientOffer.offer?.generationSource}
   - Plazo: ${clientOffer.offer?.term} meses

2. DETALLES DE LA SOLICITUD:
   - Volumen Solicitado: ${clientOffer.requestedVolume || 'N/A'} MWh
   - Número de Usuario: ${clientOffer.userNumber || 'N/A'}
   - Distribuidora: ${clientOffer.distributorName || 'N/A'}
   - Región: ${clientOffer.region || 'N/A'}
   - Dirección: ${clientOffer.address || 'N/A'}
   - Tipo de Tarifa: ${clientOffer.tariffType || 'N/A'}

3. TÉRMINOS DE PAGO:
   - Forma de Pago: ${clientOffer.offer?.paymentTerms}
   - Garantías: ${clientOffer.offer?.guarantees}

4. OTRAS CONDICIONES:
   ${clientOffer.offer?.otherConditions || 'Ninguna condición adicional especificada'}

5. TÉRMINOS Y CONDICIONES GENERALES:
   - El suministro se realizará según las especificaciones acordadas
   - El pago se realizará según los términos establecidos
   - La comisión de la plataforma (2%) será aplicada según corresponda
   - Cualquier modificación deberá ser acordada por ambas partes
   - Este contrato está sujeto a las leyes de la República Argentina

FIRMAS:

_________________________        _________________________
Proveedor                        Cliente
${clientOffer.offer?.provider?.companyName}  ${clientOffer.client?.companyName}

Fecha: ${currentDate}

NOTA: Este contrato ha sido generado automáticamente por la plataforma de energía.
Para validación legal, consulte con un abogado especializado en contratos energéticos.`
}
