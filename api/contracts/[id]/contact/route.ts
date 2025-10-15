
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

    const { subject, message } = await request.json();
    const contractId = params.id;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Asunto y mensaje son requeridos' }, { status: 400 });
    }

    // Buscar el usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Buscar el contrato
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

    // Determinar destinatario
    const recipientId = clientOffer.clientId === currentUser.id ? 
      clientOffer.offer?.providerId : clientOffer.clientId;

    if (!recipientId) {
      return NextResponse.json({ error: 'No se pudo determinar el destinatario' }, { status: 400 });
    }

    // Crear el mensaje
    await prisma.message.create({
      data: {
        senderId: currentUser.id,
        recipientId: recipientId,
        clientOfferId: contractId,
        subject: subject,
        content: message,
        messageType: 'NEGOTIATION'
      }
    });

    return NextResponse.json({ 
      message: 'Mensaje enviado exitosamente'
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
