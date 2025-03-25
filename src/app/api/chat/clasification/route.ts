import { NextResponse } from "next/server";
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

// Interfaz para los errores con código de estado
interface ErrorWithStatus {
  status?: number;
  message?: string;
}

// POST endpoint para crear una clasificación de chat
export async function POST(request: Request) {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const body = await request.json();
    const { chatId, sessionId, clasification } = body;

    // Validar que se proporcionaron los campos requeridos
    if (!chatId || !sessionId || !clasification) {
      return NextResponse.json(
        { error: 'Chat ID, Session ID y clasificación son obligatorios' },
        { status: 400 }
      );
    }

    // Validar que la clasificación es válida
    const validClasifications = ['low', 'medium', 'high'];
    if (!validClasifications.includes(clasification)) {
      return NextResponse.json(
        { error: 'La clasificación debe ser low, medium o high' },
        { status: 400 }
      );
    }

    try {
      // 1. Buscar el cliente por session_id
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

      // 2. Buscar la conversación con el chat_id
      const conversations = await pb.collection('conversation').getList(1, 1, {
        filter: `chat_id = "${chatId}" && client_id = "${clientId}"`,
        requestKey: null
      });

      if (conversations.items.length === 0) {
        return NextResponse.json(
          { error: 'Conversación no encontrada', searchedChatId: chatId },
          { status: 404 }
        );
      }

      const conversationId = conversations.items[0].id;

      // 3. Verificar si ya existe una clasificación para esta conversación
      const existingClassifications = await pb.collection('chat_clasification').getList(1, 1, {
        filter: `conversation_id = "${conversationId}" && client_id = "${clientId}"`,
        requestKey: null
      });

      let record;
      if (existingClassifications.items.length > 0) {
        // Actualizar clasificación existente
        record = await pb.collection('chat_clasification').update(existingClassifications.items[0].id, {
          clasification: clasification
        });
      } else {
        // Crear nueva clasificación
        record = await pb.collection('chat_clasification').create({
          conversation_id: conversationId,
          client_id: clientId,
          clasification: clasification
        });
      }

      return NextResponse.json({
        success: true,
        record: {
          id: record.id,
          chatId: chatId,
          clientId: clientId,
          conversationId: conversationId,
          clasification: record.clasification,
          created: record.created,
          updated: record.updated
        }
      });

    } catch (error) {
      console.error('Error al crear la clasificación:', error);
      const err = error as ErrorWithStatus;
      
      if (err.status === 403) {
        return NextResponse.json(
          {
            error: 'Error de permisos',
            details: 'Token de admin inválido o expirado'
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Error al procesar la solicitud', details: err.message },
        { status: err.status || 500 }
      );
    }
  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: (error as Error).message },
      { status: 500 }
    );
  }
} 