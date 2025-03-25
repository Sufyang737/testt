import { NextResponse } from "next/server";
import PocketBase from 'pocketbase';

// Crear instancia de PocketBase
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Configurar el token de admin
const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;

if (!adminToken) {
  console.error('POCKETBASE_ADMIN_TOKEN no está configurado');
}

// Establecer el token de admin
pb.authStore.save(adminToken!, null);

// Función auxiliar para obtener el ID del cliente por session_id
async function getClientId(sessionId: string): Promise<string> {
  const clients = await pb.collection('clients').getList(1, 1, {
    filter: `session_id = "${sessionId}"`,
    requestKey: null
  });

  if (clients.items.length === 0) {
    throw { status: 404, message: 'Client not found' };
  }

  return clients.items[0].id;
}

interface ErrorWithStatus {
  status?: number;
  message?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionName = searchParams.get('sessionName');

    if (!sessionName) {
      return NextResponse.json(
        { error: 'Session name is required' },
        { status: 400 }
      );
    }

    try {
      const clientId = await getClientId(sessionName);
      console.log('Client ID:', clientId);

      try {
        const records = await pb.collection('products').getFullList({
          filter: `client_id = "${clientId}"`,
        });

        if (records.length > 0) {
          console.log('Products found:', records.length);
          return NextResponse.json({
            success: true,
            data: records,
            count: records.length
          });
        } else {
          return NextResponse.json(
            { 
              success: true, 
              data: [],
              message: 'No products found for this client',
              count: 0
            },
            { status: 200 } // Cambiado a 200 ya que no es realmente un error, solo no hay productos
          );
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
          { error: 'Error fetching products', details: (error as Error).message },
          { status: 500 }
        );
      }
    } catch (error) {
      const err = error as ErrorWithStatus;
      if (err.status === 404) {
        return NextResponse.json(
          { error: 'Client not found', searchedSessionId: sessionName },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Error getting client ID', details: err.message },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
} 