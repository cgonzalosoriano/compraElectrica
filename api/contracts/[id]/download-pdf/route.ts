
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
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

    // Buscar el contrato
    const contract = await prisma.contract.findFirst({
      where: {
        clientOfferId: contractId,
        OR: [
          { clientId: currentUser.id },
          { providerId: currentUser.id }
        ]
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Configurar headers para descarga
    const headers = new Headers({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="contrato_${contractId}.html"`,
      'Cache-Control': 'no-cache'
    });

    return new NextResponse(contract.terms, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error al descargar PDF del contrato:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
