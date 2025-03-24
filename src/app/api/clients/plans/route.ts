import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Set the admin token
pb.authStore.save(process.env.POCKETBASE_ADMIN_TOKEN || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, planId } = body;

    if (!clientId || !planId) {
      return NextResponse.json(
        { error: 'Se requiere clientId y planId' },
        { status: 400 }
      );
    }

    // Primero, obtener el cliente de PocketBase usando el clerk_id
    let pocketbaseClient;
    try {
      pocketbaseClient = await pb.collection('clients').getFirstListItem(`clerk_id = "${clientId}"`);
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el cliente ya tiene este plan
    try {
      const existingPlan = await pb.collection('clients_plants').getFirstListItem(
        `client_id = "${pocketbaseClient.id}" && plants_id = "${planId}"`
      );
      
      if (existingPlan) {
        return NextResponse.json(
          { error: 'El cliente ya tiene este plan asignado' },
          { status: 400 }
        );
      }
    } catch (error) {
      // Si no encuentra el plan, continuamos con la creación
    }

    // Crear el registro de asignación de plan usando el ID de PocketBase
    const data = {
      client_id: pocketbaseClient.id, // Usar el ID de PocketBase
      plants_id: planId,
      paid: false,
      free_trial: true
    };

    const record = await pb.collection('clients_plants').create(data);
    return NextResponse.json(record);

  } catch (error: any) {
    console.error('Error al asignar plan:', error);
    return NextResponse.json(
      { error: 'Error al asignar el plan al cliente' },
      { status: error.status || 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Se requiere clientId' },
        { status: 400 }
      );
    }

    // Primero obtener el ID del cliente en PocketBase
    let pocketbaseClient;
    try {
      pocketbaseClient = await pb.collection('clients').getFirstListItem(`clerk_id = "${clientId}"`);
    } catch (error) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Obtener los planes del cliente usando el ID de PocketBase
    const records = await pb.collection('clients_plants').getFullList({
      filter: `client_id = "${pocketbaseClient.id}"`,
      expand: 'plants_id'
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error al obtener planes del cliente:', error);
    return NextResponse.json(
      { error: 'Error al obtener los planes del cliente' },
      { status: error.status || 500 }
    );
  }
} 