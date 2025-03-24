import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const WAHA_API_URL = process.env.WAHA_API_URL || process.env.EXT_PUBLIC_WAHA_API_URL;
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const POCKETBASE_URL = process.env.POCKETBASE_URL;
const POCKETBASE_ADMIN_TOKEN = process.env.POCKETBASE_ADMIN_TOKEN;

if (!WAHA_API_URL) {
  throw new Error('WAHA_API_URL is not defined');
}

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

if (!POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL is not defined');
}

if (!POCKETBASE_ADMIN_TOKEN) {
  throw new Error('POCKETBASE_ADMIN_TOKEN is not defined');
}

export async function POST(req: Request) {
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Autenticar con token de administrador
    console.log('Autenticando con token de administrador...');
    pb.authStore.save(POCKETBASE_ADMIN_TOKEN!, null);
    console.log('Autenticación con PocketBase exitosa');

    const body = await req.json();
    const { userId, userEmail } = body;

    console.log('Request body:', { userId, userEmail });
    console.log('WAHA API URL:', WAHA_API_URL);
    console.log('API URL:', API_URL);

    if (!userId || !userEmail) {
      console.log('Missing required fields:', { userId, userEmail });
      return NextResponse.json(
        { error: 'Se requiere userId y userEmail' },
        { status: 400 }
      );
    }

    // Buscar el cliente en PocketBase usando el Clerk ID
    console.log('Buscando cliente con clerk_id:', userId);
    try {
      // Primero vamos a listar todos los clientes para debug
      const allClients = await pb.collection('clients').getList(1, 50);
      console.log('Todos los clientes:', allClients.items);

      // Simplificamos la consulta usando filter
      const clientRecords = await pb.collection('clients').getList(1, 1, {
        filter: `clerk_id = "${userId}"`,
      });

      if (clientRecords.items.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      const clientRecord = clientRecords.items[0];
      console.log('Cliente encontrado:', clientRecord);

      const webhookUrl = `${API_URL}/api/webhook/whatsapp`;
      console.log('Webhook URL:', webhookUrl);

      const wahaPayload = {
        name: userId,
        start: true,
        config: {
          metadata: {
            "user.id": userId,
            "user.email": userEmail,
            "client.id": clientRecord.id
          },
          noweb: {
            store: {
              enabled: true,
              fullSync: false
            }
          },
          webhooks: [
            {
              url: webhookUrl,
              events: [
                "session.status",
                "message",
                "message.waiting",
                "poll.vote"
              ],
            }
          ]
        }
      };

      console.log('WAHA request payload:', wahaPayload);

      // Crear sesión en WAHA
      const response = await fetch(`${WAHA_API_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wahaPayload)
      });

      const responseData = await response.json();
      console.log('WAHA response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });

      if (!response.ok) {
        return NextResponse.json(
          { 
            error: 'Error al crear la sesión en WAHA',
            details: responseData,
            status: response.status,
            statusText: response.statusText
          },
          { status: response.status }
        );
      }

      // Actualizar el cliente con el ID de sesión de WhatsApp
      try {
        console.log('Actualizando cliente con session_id:', userId);
        console.log('ID del cliente a actualizar:', clientRecord.id);
        
        // Extraer el número de teléfono si está disponible en la respuesta
        let phoneNumber = null;
        if (responseData.me && responseData.me.id) {
          // Extraer el número antes del @c.us
          phoneNumber = responseData.me.id.split('@')[0];
          // Convertir a número
          phoneNumber = parseInt(phoneNumber);
        }
        
        const updateData = {
          session_id: userId,
          ...(phoneNumber && { phone_client: phoneNumber })
        };
        console.log('Datos de actualización:', updateData);

        const updatedRecord = await pb.collection('clients').update(clientRecord.id, updateData);
        console.log('Cliente actualizado:', updatedRecord);
      } catch (updateError: any) {
        console.error('Error al actualizar el cliente:', {
          message: updateError.message,
          data: updateError.data,
          status: updateError.status
        });
      }

      return NextResponse.json(responseData);

    } catch (clientError: any) {
      console.error('Error al buscar el cliente:', {
        message: clientError.message,
        data: clientError.data,
        status: clientError.status
      });
      return NextResponse.json(
        { error: 'Cliente no encontrado o error al buscar' },
        { status: 404 }
      );
    }

  } catch (error: any) {
    console.error('Error detallado:', {
      message: error.message,
      data: error.data,
      status: error.status,
      url: error.url,
      response: error.response
    });
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message,
        status: error.status,
        data: error.data
      },
      { status: 500 }
    );
  }
} 