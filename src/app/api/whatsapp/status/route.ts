import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const WAHA_API_URL = process.env.WAHA_API_URL || process.env.EXT_PUBLIC_WAHA_API_URL;
const POCKETBASE_URL = process.env.POCKETBASE_URL;
const POCKETBASE_ADMIN_TOKEN = process.env.POCKETBASE_ADMIN_TOKEN;

if (!WAHA_API_URL) {
  throw new Error('WAHA_API_URL is not defined');
}

if (!POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL is not defined');
}

if (!POCKETBASE_ADMIN_TOKEN) {
  throw new Error('POCKETBASE_ADMIN_TOKEN is not defined');
}

export async function GET(req: Request) {
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Autenticar con token de administrador
    pb.authStore.save(POCKETBASE_ADMIN_TOKEN!, null);

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Se requiere sessionId' },
        { status: 400 }
      );
    }

    console.log('Verificando estado de sesión:', sessionId);

    const response = await fetch(`${WAHA_API_URL}/api/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    const sessionStatus = {
      sessionId,
      status: response.status,
      data
    };
    
    console.log('Estado de la sesión:', sessionStatus);

    // Si la sesión está WORKING y tiene número de teléfono, actualizamos el cliente
    if (data.status === 'WORKING' && data.me?.id) {
      try {
        // Buscar el cliente por session_id
        const clientRecords = await pb.collection('clients').getList(1, 1, {
          filter: `session_id = "${sessionId}"`
        });

        if (clientRecords.items.length > 0) {
          const clientRecord = clientRecords.items[0];
          
          // Extraer y procesar el número de teléfono
          const phoneStr = data.me.id.split('@')[0];
          // Asegurarnos de que sea un número válido
          const phoneNumber = Number(phoneStr);

          console.log('Procesando número de teléfono:', {
            phoneStr,
            phoneNumber,
            isValidNumber: !isNaN(phoneNumber),
            type: typeof phoneNumber
          });

          // Solo actualizar si es un número válido y diferente al actual
          if (!isNaN(phoneNumber) && clientRecord.phone_client !== phoneNumber) {
            console.log('Intentando actualizar con datos:', {
              id: clientRecord.id,
              updateData: {
                phone_client: phoneNumber
              }
            });

            try {
              const updatedRecord = await pb.collection('clients').update(
                clientRecord.id, 
                { phone_client: phoneNumber }
              );
              console.log('Cliente actualizado exitosamente:', updatedRecord);
            } catch (updateError: any) {
              console.error('Error específico al actualizar:', {
                message: updateError.message,
                data: updateError.data,
                status: updateError.status,
                requestData: { phone_client: phoneNumber }
              });
            }
          } else {
            console.log('No se actualiza el teléfono:', {
              reason: isNaN(phoneNumber) ? 'Número inválido' : 'Mismo número',
              currentPhone: clientRecord.phone_client,
              newPhone: phoneNumber
            });
          }
        }
      } catch (error: any) {
        console.error('Error al actualizar el teléfono del cliente:', {
          message: error.message,
          data: error.data,
          status: error.status
        });
      }
    }

    return NextResponse.json(sessionStatus);
  } catch (error: any) {
    console.error('Error al verificar estado:', error);
    return NextResponse.json(
      { 
        error: 'Error al verificar estado',
        details: error.message
      },
      { status: 500 }
    );
  }
} 