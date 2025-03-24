import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching user with PocketBase ID:', params.id);
    
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    
    if (!adminToken) {
      console.error('Admin token is not configured');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    // Autenticar como admin
    pb.authStore.save(adminToken);
    console.log('Admin authentication completed');
    
    // Verificar el token de autorización del usuario
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No authorization token provided');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('Attempting to fetch user from PocketBase');
    // Obtener el usuario directamente por su ID de PocketBase
    const record = await pb.collection('clients').getOne(params.id);
    console.log('User record found:', record);

    return NextResponse.json({
      id: record.id,
      first_name: record.first_name,
      last_name: record.last_name,
      email: record.email,
      username: record.username,
      store_id: record.store_id,
      platform: record.platform
    });
  } catch (error: any) {
    console.error('Detailed error:', {
      error,
      status: error.status,
      message: error.message,
      url: error.url,
      response: error.response
    });

    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error al obtener datos del usuario', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Autenticar como admin
    pb.authStore.save(adminToken);
    
    // Verificar el token de autorización del usuario
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // Validar que los campos a actualizar sean permitidos
    const allowedFields = ['first_name', 'last_name', 'email', 'username', 'store_id', 'platform'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: `Campos no permitidos: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Actualizar el usuario directamente usando su ID de PocketBase
    const record = await pb.collection('clients').update(params.id, updates);

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        first_name: record.first_name,
        last_name: record.last_name,
        email: record.email,
        username: record.username,
        store_id: record.store_id,
        platform: record.platform
      }
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Error al actualizar datos del usuario', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const adminToken = process.env.POCKETBASE_ADMIN_TOKEN;
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Autenticar como admin
    pb.authStore.save(adminToken);
    
    // Verificar el token de autorización del usuario
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Eliminar el usuario directamente usando su ID de PocketBase
    await pb.collection('clients').delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el usuario', details: error.message },
      { status: 500 }
    );
  }
} 