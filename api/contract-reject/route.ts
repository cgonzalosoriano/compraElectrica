
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

    const { reason, subject, contractId } = await request.json();

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

    // Actualizar estado a CANCELLED (estado válido en el schema)
    const newStatus = 'CANCELLED';  
    
    await prisma.clientOffer.update({
      where: { id: contractId },
      data: { status: newStatus }
    });

    // Crear un mensaje sobre la cancelación/rechazo
    if (reason) {
      await prisma.message.create({
        data: {
          senderId: currentUser.id,
          recipientId: clientOffer.clientId === currentUser.id ? 
            clientOffer.offer?.providerId || '' : clientOffer.clientId,
          clientOfferId: contractId,
          subject: subject || `Contrato cancelado`,
          content: reason,
          messageType: 'SYSTEM'
        }
      });
    }

    return NextResponse.json({ 
      message: `Contrato cancelado exitosamente`,
      status: newStatus
    });

  } catch (error) {
    console.error('Error al rechazar/cancelar contrato:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
