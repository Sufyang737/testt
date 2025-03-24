import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Crear una instancia única de PocketBase
const pb = new PocketBase(process.env.POCKETBASE_URL);

// Autenticar con el token de admin
pb.authStore.save(process.env.POCKETBASE_ADMIN_TOKEN || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validar que todos los campos requeridos estén presentes
    const data = {
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      email: body.email || '',
      user_id: body.user_id || '',
      username: body.username || '',
      platform: body.platform || '',
      store_id: body.store_id || ''
    };

    // Crear el registro en PocketBase
    const record = await pb.collection('clients').create(data);

    return NextResponse.json(
      { 
        message: 'Cliente creado exitosamente', 
        data: record 
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { 
        message: 'Error al crear el cliente', 
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
}

// Endpoint para obtener clientes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'Se requiere user_id' },
        { status: 400 }
      );
    }

    try {
      const client = await pb.collection('clients').getFirstListItem(`user_id = "${user_id}"`);
      return NextResponse.json({
        data: client
      });
    } catch (error) {
      console.error('Cliente no encontrado:', error);
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return NextResponse.json(
      { error: 'Error al obtener el cliente' },
      { status: 500 }
    );
  }
}

// Endpoint para actualizar un cliente
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { user_id, store_id } = body;

    if (!user_id || !store_id) {
      return NextResponse.json(
        { message: 'user_id y store_id son requeridos' }, 
        { status: 400 }
      );
    }

    try {
      // Buscar el cliente por user_id
      const record = await pb.collection('clients').getFirstListItem(`user_id = "${user_id}"`, {
        $autoCancel: false
      });

      // Actualizar el store_id del cliente
      const updated = await pb.collection('clients').update(record.id, {
        store_id: store_id
      }, {
        $autoCancel: false
      });

      return NextResponse.json(
        { message: 'Cliente actualizado exitosamente', data: updated }, 
        { status: 200 }
      );
    } catch (error: any) {
      if (error.status === 404) {
        return NextResponse.json(
          { message: 'Cliente no encontrado' }, 
          { status: 404 }
        );
      }
      throw error;
    }

  } catch (error: any) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { 
        message: 'Error al actualizar el cliente', 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
} 