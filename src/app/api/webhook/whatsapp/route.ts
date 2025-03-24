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

export async function POST(req: Request) {
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Autenticar con token de administrador
    pb.authStore.save(POCKETBASE_ADMIN_TOKEN!, null);
    
    const body = await req.json();
    console.log('Webhook recibido:', body);

    // Si es un evento de estado de sesión y el estado es WORKING
    if (body.event === 'session.status' && body.data.status === 'WORKING' && body.data.me?.id) {
      const sessionId = body.data.name; // Este es el clerk_id que usamos como nombre de sesión
      
      try {
        // Buscar el cliente por session_id
        const clientRecords = await pb.collection('clients').getList(1, 1, {
          filter: `session_id = "${sessionId}"`
        });

        if (clientRecords.items.length > 0) {
          const clientRecord = clientRecords.items[0];
          
          // Extraer y procesar el número de teléfono
          const phoneStr = body.data.me.id.split('@')[0];
          const phoneNumber = parseInt(phoneStr);

          console.log('Actualizando teléfono del cliente:', {
            clientId: clientRecord.id,
            phoneNumber
          });

          // Actualizar el cliente con el número de teléfono
          const updatedRecord = await pb.collection('clients').update(clientRecord.id, {
            phone_client: phoneNumber
          });

          console.log('Cliente actualizado con teléfono:', updatedRecord);
        }
      } catch (error: any) {
        console.error('Error al actualizar el teléfono del cliente:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en webhook:', error);
    return NextResponse.json(
      { 
        error: 'Error procesando webhook',
        details: error.message
      },
      { status: 500 }
    );
  }
} 