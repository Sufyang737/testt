import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Función auxiliar para obtener el rango del ciclo de facturación actual
function getBillingCycleRange(startDate: string) {
  const now = new Date();
  
  // Establecer el inicio del ciclo al primer día del mes actual
  const currentCycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Establecer el fin del ciclo al último día del mes actual
  const currentCycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { currentCycleStart, currentCycleEnd };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    console.log('Requesting tokens for clientId:', clientId);

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const pb = new PocketBase('https://pocketbase.srv.clostech.tech');
    
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (!adminToken) {
      throw new Error('Admin token not configured');
    }
    
    pb.authStore.save(adminToken);

    try {
      // Obtener el cliente
      const client = await pb.collection('clients').getFirstListItem(`user_id = "${clientId}"`);
      console.log('Found client:', client);
      
      // Obtener el rango del ciclo actual (ahora usando el mes actual)
      const { currentCycleStart, currentCycleEnd } = getBillingCycleRange(client.created);
      
      // Construir el filtro con las nuevas fechas
      const filter = `client_id = "${client.id}" && created >= "${currentCycleStart.toISOString()}" && created <= "${currentCycleEnd.toISOString()}"`;
      console.log('Using filter:', filter);

      const records = await pb.collection('api_request').getList(1, 50, {
        filter,
        sort: '-created',
      });

      console.log('Found records:', records.items.length);

      return NextResponse.json({
        success: true,
        data: records.items,
        cycle: {
          start: currentCycleStart,
          end: currentCycleEnd
        }
      });
    } catch (error) {
      console.error('Error in PocketBase operations:', error);
      return NextResponse.json(
        { 
          error: 'No se encontraron datos para este usuario',
          details: error instanceof Error ? error.message : 'Unknown error',
          clientId: clientId
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in token usage API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const pb = new PocketBase('https://pocketbase.srv.clostech.tech');
    
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    if (!adminToken) {
      throw new Error('Admin token not configured');
    }
    
    pb.authStore.save(adminToken);

    const body = await req.json();
    const { client_id, tokens_used, total_tokens, exceeded } = body;

    if (!client_id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const data = {
      tokens_used: tokens_used || 0,
      total_tokens: total_tokens || 0,
      client_id: client_id,
      exceeded: exceeded || 0
    };

    const record = await pb.collection('api_request').create(data);

    return NextResponse.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('Error creating monthly record:', error);
    return NextResponse.json(
      { 
        error: 'Error creating monthly record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 