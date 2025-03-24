import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
pb.autoCancellation(false); // Desactivar auto-cancelación global

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Autenticar con el token de admin
    pb.authStore.save(process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN || '');

    try {
      // Buscar el cliente por user_id de Clerk
      const result = await pb.collection('clients').getList(1, 1, {
        filter: pb.filter('user_id = {:userId}', { userId: params.id }),
        fields: 'id,user_id,first_name,last_name,email,platform,store_id,created',
        $cancelKey: `profile-${params.id}`
      });

      if (result.items.length === 0) {
        return NextResponse.json(
          { 
            error: 'Usuario no registrado en el sistema. Por favor, contacte al soporte.',
            code: 'USER_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      const client = result.items[0];

      return NextResponse.json({
        id: client.id,
        user_id: client.user_id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        platform: client.platform,
        store_id: client.store_id,
        created: client.created
      });
    } catch (dbError: any) {
      console.error('Error de base de datos:', dbError);
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error al obtener perfil:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al obtener el perfil',
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: error.status || 500 }
    );
  }
} 