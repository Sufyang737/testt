import { NextResponse } from 'next/server';

const WAHA_API_URL = process.env.WAHA_API_URL || process.env.EXT_PUBLIC_WAHA_API_URL;

if (!WAHA_API_URL) {
  throw new Error('WAHA_API_URL is not defined');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Se requiere sessionId' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${WAHA_API_URL}/api/${sessionId}/auth/qr?format=image`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener el código QR' },
        { status: response.status }
      );
    }

    // Obtener el blob de la imagen y devolverlo
    const imageBlob = await response.blob();
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': 'image/png',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 