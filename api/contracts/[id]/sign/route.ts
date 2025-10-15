
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { signedDocumentPath } = await request.json();
    const contractId = params.id;

    // Buscar el usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Buscar el contract/clientOffer
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
        offer: { include: { provider: true } }
      }
    });

    if (!clientOffer) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Guardar el documento firmado con referencia al contrato
    const documentType = clientOffer.clientId === currentUser.id ? 'CLIENT_SIGNED_CONTRACT' : 'PROVIDER_SIGNED_CONTRACT';
    
    // Primero eliminar cualquier documento firmado anterior de este usuario para este contrato
    await prisma.document.deleteMany({
      where: {
        userId: currentUser.id,
        name: { contains: documentType },
        cloudStoragePath: { contains: contractId }
      }
    });

    // Crear el nuevo documento firmado
    await prisma.document.create({
      data: {
        userId: currentUser.id,
        name: `Contrato firmado - ${documentType} - ${contractId}`,
        documentType: 'CONTRACT',
        cloudStoragePath: signedDocumentPath,
        status: 'APPROVED'
      }
    });

    // Verificar si ambas partes han firmado (buscar por separado)
    const clientSignedDoc = await prisma.document.findFirst({
      where: {
        AND: [
          { userId: clientOffer.clientId },
          { name: { contains: 'CLIENT_SIGNED_CONTRACT' } },
          { name: { contains: contractId } },
          { documentType: 'CONTRACT' },
          { status: 'APPROVED' }
        ]
      }
    });

    const providerSignedDoc = await prisma.document.findFirst({
      where: {
        AND: [
          { userId: clientOffer.offer?.providerId || '' },
          { name: { contains: 'PROVIDER_SIGNED_CONTRACT' } },
          { name: { contains: contractId } },
          { documentType: 'CONTRACT' },
          { status: 'APPROVED' }
        ]
      }
    });

    // Si ambas partes han firmado, actualizar el estado del contrato
    if (clientSignedDoc && providerSignedDoc) {
      await prisma.clientOffer.update({
        where: { id: contractId },
        data: { status: 'COMPLETED' }
      });

      // También actualizar o crear el contrato oficial
      const contract = await prisma.contract.findFirst({
        where: { clientOfferId: contractId }
      });

      if (contract) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: { 
            status: 'SIGNED',
            signedAt: new Date()
          }
        });
      }

      return NextResponse.json({ 
        message: 'Contrato completamente firmado por ambas partes',
        status: 'COMPLETED',
        bothPartiesSigned: true
      });
    }

    return NextResponse.json({ 
      message: 'Documento firmado subido exitosamente. Esperando firma de la otra parte.',
      status: 'PENDING_SIGNATURE',
      bothPartiesSigned: false
    });

  } catch (error) {
    console.error('Error al procesar firma del contrato:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
