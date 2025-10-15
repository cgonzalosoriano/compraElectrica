
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json({ error: 'ID de contrato requerido' }, { status: 400 });
    }

    // Buscar el usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Buscar el contrato con todos los datos
    const clientOffer = await prisma.clientOffer.findFirst({
      where: {
        id: contractId,
        OR: [
          { clientId: currentUser.id },
          { offer: { providerId: currentUser.id } }
        ]
      },
      include: {
        client: true,
        offer: {
          include: { provider: true }
        }
      }
    });

    if (!clientOffer) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Buscar negociaciones para obtener términos finales
    const negotiations = await prisma.negotiation.findMany({
      where: { clientOfferId: contractId },
      orderBy: { createdAt: 'desc' },
      include: {
        proposer: true,
        recipient: true
      }
    });

    // Obtener términos finales (usar la última negociación aceptada o términos originales)
    const acceptedNegotiation = negotiations.find(n => n.status === 'ACCEPTED');
    const finalTerms = acceptedNegotiation ? {
      energyPrice: acceptedNegotiation.proposedEnergyPrice || clientOffer.offer?.energyPrice,
      powerPrice: acceptedNegotiation.proposedPowerPrice || clientOffer.offer?.powerPrice,
      term: acceptedNegotiation.proposedTerm || clientOffer.offer?.term,
      volume: acceptedNegotiation.proposedVolume || clientOffer.requestedVolume,
      paymentTerms: acceptedNegotiation.proposedPaymentTerms || clientOffer.offer?.paymentTerms,
      guarantees: acceptedNegotiation.proposedGuarantees || clientOffer.offer?.guarantees,
      otherConditions: acceptedNegotiation.proposedConditions || clientOffer.offer?.otherConditions
    } : {
      energyPrice: clientOffer.offer?.energyPrice,
      powerPrice: clientOffer.offer?.powerPrice,
      term: clientOffer.offer?.term,
      volume: clientOffer.requestedVolume,
      paymentTerms: clientOffer.offer?.paymentTerms,
      guarantees: clientOffer.offer?.guarantees,
      otherConditions: clientOffer.offer?.otherConditions
    };

    // Generar el contenido del PDF como HTML
    const contractHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Contrato de Suministro Eléctrico</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; }
            .section { margin: 20px 0; }
            .terms-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .terms-table th, .terms-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .terms-table th { background-color: #f2f2f2; }
            .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-box { width: 45%; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
            .date { text-align: right; margin-bottom: 40px; }
            .clause { margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CONTRATO DE SUMINISTRO DE ENERGÍA ELÉCTRICA</h1>
            <h2>MERCADO ELÉCTRICO MAYORISTA - ARGENTINA</h2>
        </div>

        <div class="date">
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
            <p><strong>Contrato Nº:</strong> ${contractId}</p>
        </div>

        <div class="section">
            <h3>PARTES CONTRATANTES</h3>
            
            <div class="clause">
                <p><strong>PROVEEDOR:</strong></p>
                <p>Razón Social: ${clientOffer.offer?.provider?.companyName || clientOffer.offer?.provider?.name}</p>
                <p>Email: ${clientOffer.offer?.provider?.email}</p>
            </div>

            <div class="clause">
                <p><strong>CLIENTE:</strong></p>
                <p>Razón Social: ${clientOffer.client?.companyName || clientOffer.client?.name}</p>
                <p>Email: ${clientOffer.client?.email}</p>
                <p>Volumen Contratado: ${finalTerms.volume?.toLocaleString('es-AR')} MWh</p>
            </div>
        </div>

        <div class="section">
            <h3>TÉRMINOS Y CONDICIONES ACORDADOS</h3>
            
            <table class="terms-table">
                <tr>
                    <th>Concepto</th>
                    <th>Valor</th>
                    <th>Unidad</th>
                </tr>
                <tr>
                    <td>Precio de Energía</td>
                    <td>$${finalTerms.energyPrice?.toLocaleString('es-AR')}</td>
                    <td>por MWh</td>
                </tr>
                <tr>
                    <td>Precio de Potencia</td>
                    <td>$${finalTerms.powerPrice?.toLocaleString('es-AR')}</td>
                    <td>por kW-mes</td>
                </tr>
                <tr>
                    <td>Volumen Contratado</td>
                    <td>${finalTerms.volume?.toLocaleString('es-AR')}</td>
                    <td>MWh</td>
                </tr>
                <tr>
                    <td>Plazo del Contrato</td>
                    <td>${finalTerms.term}</td>
                    <td>meses</td>
                </tr>
            </table>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <p><strong>PROVEEDOR</strong></p>
                <br><br><br>
                <p>_________________________________</p>
                <p>${clientOffer.offer?.provider?.name}</p>
                <p>Fecha: _______________</p>
            </div>
            
            <div class="signature-box">
                <p><strong>CLIENTE</strong></p>
                <br><br><br>
                <p>_________________________________</p>
                <p>${clientOffer.client?.name}</p>
                <p>Fecha: _______________</p>
            </div>
        </div>
    </body>
    </html>`;

    // Guardar o actualizar el contrato en la base de datos
    const existingContract = await prisma.contract.findFirst({
      where: { clientOfferId: contractId }
    });

    if (existingContract) {
      await prisma.contract.update({
        where: { id: existingContract.id },
        data: { 
          terms: contractHTML,
          status: 'NEGOTIATING'  
        }
      });
    } else {
      await prisma.contract.create({
        data: {
          clientOfferId: contractId,
          clientId: clientOffer.clientId,
          providerId: clientOffer.offer?.providerId || '',
          offerId: clientOffer.offerId,
          terms: contractHTML,
          status: 'NEGOTIATING' 
        }
      });
    }

    return NextResponse.json({ 
      message: 'PDF del contrato generado exitosamente',
      contractHTML: contractHTML,
      contractId: contractId
    });

  } catch (error) {
    console.error('Error al generar PDF del contrato:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
