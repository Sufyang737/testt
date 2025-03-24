import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.POCKETBASE_URL;
const POCKETBASE_ADMIN_TOKEN = process.env.POCKETBASE_ADMIN_TOKEN;

if (!POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL is not defined');
}

if (!POCKETBASE_ADMIN_TOKEN) {
  throw new Error('POCKETBASE_ADMIN_TOKEN is not defined');
}

function formatScheduleToOpeningHours(schedule: any): string {
  const days = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  return Object.entries(schedule)
    .map(([day, data]: [string, any]) => {
      if (!data.isOpen) return `${days[day as keyof typeof days]}: Cerrado`;
      return `${days[day as keyof typeof days]}: ${data.openTime} - ${data.closeTime}`;
    })
    .join(' | ');
}

export async function POST(req: Request) {
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Autenticar con token de administrador
    console.log('Autenticando con token de administrador...');
    pb.authStore.save(POCKETBASE_ADMIN_TOKEN!, null);
    console.log('Autenticación con PocketBase exitosa');

    const body = await req.json();
    const { 
      client_id: clerkUserId,
      name_company,
      description,
      instagram,
      facebook,
      website,
      x,
      schedule 
    } = body;

    console.log('Datos recibidos:', body);

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Se requiere client_id' },
        { status: 400 }
      );
    }

    // Convertir el schedule a formato de texto para opening_hours
    const opening_hours = formatScheduleToOpeningHours(schedule);

    try {
      console.log('Buscando cliente con clerk_id:', clerkUserId);
      const clientsResult = await pb.collection('clients').getFirstListItem(`clerk_id = '${clerkUserId}'`);

      console.log('Cliente encontrado:', clientsResult);

      try {
        console.log('Buscando perfil existente para cliente:', clientsResult.id);
        const existingProfiles = await pb.collection('client_profile').getFullList({
          filter: `client_id = '${clientsResult.id}'`,
          sort: '-created'
        });

        const profileData = {
          client_id: clientsResult.id,
          name_company,
          description,
          instagram,
          facebook,
          website,
          x,
          opening_hours // Usar el campo correcto según la API
        };

        if (existingProfiles.length > 0) {
          const existingProfile = existingProfiles[0];
          console.log('Actualizando perfil existente:', existingProfile.id);
          const record = await pb.collection('client_profile').update(existingProfile.id, profileData);
          
          console.log('Perfil actualizado:', record);
          return NextResponse.json({
            success: true,
            data: record,
            redirectUrl: '/'
          });
        }

        console.log('Creando nuevo perfil para cliente:', clientsResult.id);
        const record = await pb.collection('client_profile').create(profileData);

        console.log('Nuevo perfil creado:', record);
        return NextResponse.json({
          success: true,
          data: record,
          redirectUrl: '/'
        });

      } catch (error: any) {
        console.error('Error al manejar el perfil:', error);
        return NextResponse.json(
          { 
            error: 'Error al crear/actualizar el perfil',
            details: error.response?.data || error.message
          },
          { status: 500 }
        );
      }

    } catch (error: any) {
      console.error('Error al buscar el cliente:', error);
      return NextResponse.json(
        { 
          error: 'Error al buscar el cliente',
          details: error.response?.data || error.message,
          url: error.url
        },
        { status: 404 }
      );
    }

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud',
        details: error.response?.data || error.message
      },
      { status: 500 }
    );
  }
} 