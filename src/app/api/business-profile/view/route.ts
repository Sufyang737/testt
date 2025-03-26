import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Validar que se proporciona el sessionId
    if (!sessionId) {
      return NextResponse.json(
        { error: 'El ID de sesión es requerido' },
        { status: 400 }
      );
    }

    try {
      // 1. Primero, buscar el cliente por session_id
      const clients = await pb.collection('clients').getList(1, 1, {
        filter: `session_id = "${sessionId}"`,
        requestKey: null
      });

      if (clients.items.length === 0) {
        return NextResponse.json(
          { error: 'Cliente no encontrado', searchedSessionId: sessionId },
          { status: 404 }
        );
      }

      const clientId = clients.items[0].id;

      // 2. Ahora, buscar el perfil de negocio usando el client_id
      try {
        // Intenta obtener el perfil de negocio
        const businessProfiles = await pb.collection('client_profile').getList(1, 1, {
          filter: `client_id = "${clientId}"`,
          requestKey: null
        });

        if (businessProfiles.items.length === 0) {
          // Si no existe un perfil, devuelve un mensaje informativo
          return NextResponse.json(
            { 
              success: true, 
              message: 'Perfil de negocio no encontrado para este cliente',
              clientId: clientId,
              sessionId: sessionId
            },
            { status: 200 }
          );
        }

        // Si existe un perfil, devuélvelo
        const profile = businessProfiles.items[0];
        
        return NextResponse.json({
          success: true,
          profile: {
            id: profile.id,
            clientId: profile.client_id,
            nameCompany: profile.name_company || '',
            description: profile.description || '',
            instagram: profile.instagram || '',
            facebook: profile.facebook || '',
            website: profile.website || '',
            x: profile.x || '',
            openingHours: profile.opening_hours || '',
            created: profile.created,
            updated: profile.updated
          }
        });

      } catch (profileError) {
        console.error('Error al buscar el perfil de negocio:', profileError);
        return NextResponse.json(
          { error: 'Error al buscar el perfil de negocio', details: (profileError as Error).message },
          { status: 500 }
        );
      }

    } catch (clientError) {
      console.error('Error al buscar el cliente:', clientError);
      return NextResponse.json(
        { error: 'Error al buscar el cliente', details: (clientError as Error).message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error general:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        {
          error: 'Error de permisos',
          details: 'Token de admin inválido o expirado'
        },
        { status: 403 }
      );
    }

    if (error.isAbort) {
      return NextResponse.json(
        {
          error: 'La solicitud fue cancelada',
          details: 'Por favor, intenta de nuevo'
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
        details: error.message
      },
      { status: error.status || 500 }
    );
  }
} 