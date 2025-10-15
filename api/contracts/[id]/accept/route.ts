

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

    // Actualizar estado a ACCEPTED
    await prisma.clientOffer.update({
      where: { id: contractId },
      data: { status: 'ACCEPTED' }
    });

    // Crear un mensaje de notificación sobre la aceptación
    await prisma.message.create({
      data: {
        senderId: currentUser.id,
        recipientId: clientOffer.clientId === currentUser.id ? 
          clientOffer.offer?.providerId || '' : clientOffer.clientId,
        clientOfferId: contractId,
        subject: 'Contrato aceptado',
        content: `El contrato ha sido aceptado por ${currentUser.name || currentUser.email}. Proceder con la firma del contrato.`,
        messageType: 'SYSTEM'
      }
    });

    return NextResponse.json({ 
      message: 'Contrato aceptado exitosamente',
      status: 'ACCEPTED'
    });

  } catch (error) {
    console.error('Error al aceptar contrato:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

