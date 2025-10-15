
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();

// Configuración de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';
const FOLDER_PREFIX = process.env.AWS_FOLDER_PREFIX || '';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener los datos del form
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contractId = formData.get('contractId') as string;
    const userType = formData.get('userType') as string;

    if (!file || !contractId || !userType) {
      return NextResponse.json({ 
        error: 'Archivo, contractId y userType son requeridos' 
      }, { status: 400 });
    }

    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'Solo se permiten archivos PDF' 
      }, { status: 400 });
    }

    // Buscar el usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario tenga acceso al contrato
    const clientOffer = await prisma.clientOffer.findFirst({
      where: {
        id: contractId,
        OR: [
          { clientId: currentUser.id },
          { offer: { providerId: currentUser.id } }
        ]
      }
    });

    if (!clientOffer) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Convertir archivo a Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `signed_contract_${contractId}_${userType.toLowerCase()}_${timestamp}.pdf`;
    const s3Key = `${FOLDER_PREFIX}contracts/signed/${fileName}`;

    // Subir archivo a S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    });

    await s3Client.send(uploadCommand);

    // Guardar referencia en la base de datos
    await prisma.document.create({
      data: {
        userId: currentUser.id,
        name: `Contrato firmado - ${userType}`,
        documentType: 'CONTRACT',
        cloudStoragePath: s3Key,
        status: 'APPROVED'
      }
    });

    return NextResponse.json({ 
      message: 'Archivo subido exitosamente',
      cloudStoragePath: s3Key
    });

  } catch (error) {
    console.error('Error subiendo archivo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
