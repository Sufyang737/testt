import { NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

// Configurar el token de admin
const adminToken = process.env.POCKETBASE_ADMIN_TOKEN

if (!adminToken) {
  console.error('POCKETBASE_TOKEN_ADMIN no está configurado')
}

// Establecer el token de admin
pb.authStore.save(adminToken!, null)

// GET endpoint to check bot status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const sessionId = searchParams.get('clientId')

    if (!chatId || !sessionId) {
      return NextResponse.json(
        { error: 'Chat ID and Client ID are required' },
        { status: 400 }
      )
    }

    // Primero verificar que el cliente exista con ese session_id
    const clients = await pb.collection('clients').getList(1, 1, {
      filter: `session_id = "${sessionId}"`,
      requestKey: null
    })

    if (clients.items.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const clientId = clients.items[0].id

    // Buscar la conversación para este cliente específico
    const conversations = await pb.collection('conversation').getList(1, 1, {
      filter: `chat_id = "${chatId}" && client_id = "${clientId}"`,
      requestKey: null
    })

    // Si no existe la conversación para este cliente, devolver error
    if (conversations.items.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró una conversación para este chat y cliente' },
        { status: 404 }
      )
    }

    // Si existe, devolver los valores guardados
    const conversation = conversations.items[0]
    return NextResponse.json({
      success: true,
      record: {
        useBot: conversation.use_bot,
        category: conversation.category
      }
    })
  } catch (error: any) {
    console.error('Error checking chat existence:', error)
    
    if (error.status === 403) {
      return NextResponse.json(
        {
          error: 'Error de permisos',
          details: 'Token de admin inválido o expirado'
        },
        { status: 403 }
      )
    }

    if (error.isAbort) {
      return NextResponse.json(
        {
          error: 'La solicitud fue cancelada',
          details: 'Por favor, intenta de nuevo'
        },
        { status: 408 }
      )
    }

    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
        details: error.message
      },
      { status: error.status || 500 }
    )
  }
}

// POST endpoint to update bot status
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { chatId, useBot, category } = body
    const sessionId = body.clientId

    if (!chatId || !sessionId) {
      return NextResponse.json(
        { error: 'Chat ID and Client ID are required' },
        { status: 400 }
      )
    }

    // Primero buscar el cliente para obtener su ID
    const clients = await pb.collection('clients').getList(1, 1, {
      filter: `session_id = "${sessionId}"`,
      requestKey: null
    })

    if (clients.items.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const clientId = clients.items[0].id

    // Buscar si ya existe una conversación para este chat y cliente
    const result = await pb.collection('conversation').getList(1, 1, {
      filter: `chat_id = "${chatId}" && client_id = "${clientId}"`,
      requestKey: null
    })

    let conversation
    if (result.items.length === 0) {
      // Crear nueva conversación
      conversation = await pb.collection('conversation').create({
        chat_id: chatId,
        client_id: clientId,
        use_bot: useBot ?? false,
        category: category || 'general',
        finished_chat: false
      })
    } else {
      // Actualizar conversación existente
      conversation = await pb.collection('conversation').update(result.items[0].id, {
        use_bot: useBot ?? result.items[0].use_bot,
        category: category || result.items[0].category
      })
    }

    return NextResponse.json({
      success: true,
      record: {
        chatId,
        useBot: conversation.use_bot,
        category: conversation.category
      }
    })
  } catch (error: any) {
    console.error('Error updating bot status:', error)
    
    if (error.status === 403) {
      return NextResponse.json(
        {
          error: 'Error de permisos',
          details: 'Token de admin inválido o expirado'
        },
        { status: 403 }
      )
    }

    if (error.isAbort) {
      return NextResponse.json(
        {
          error: 'La solicitud fue cancelada',
          details: 'Por favor, intenta de nuevo'
        },
        { status: 408 }
      )
    }

    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
        details: error.message
      },
      { status: error.status || 500 }
    )
  }
}

// PATCH endpoint to toggle bot status
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const sessionId = searchParams.get('clientId')

    if (!chatId || !sessionId) {
      return NextResponse.json(
        { error: 'Chat ID and Client ID are required' },
        { status: 400 }
      )
    }

    // Buscar la conversación que coincida con el chat_id y el cliente con ese session_id
    const result = await pb.collection('conversation').getList(1, 1, {
      filter: `chat_id = "${chatId}" && client_id.session_id = "${sessionId}"`,
      expand: 'client_id',
      requestKey: null
    })

    if (result.items.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Toggle bot status
    const conversation = await pb.collection('conversation').update(result.items[0].id, {
      use_bot: !result.items[0].use_bot
    })

    return NextResponse.json({
      success: true,
      record: {
        chatId,
        useBot: conversation.use_bot,
        category: conversation.category
      }
    })
  } catch (error: any) {
    console.error('Error toggling bot status:', error)
    
    if (error.status === 403) {
      return NextResponse.json(
        {
          error: 'Error de permisos',
          details: 'Token de admin inválido o expirado'
        },
        { status: 403 }
      )
    }

    if (error.isAbort) {
      return NextResponse.json(
        {
          error: 'La solicitud fue cancelada',
          details: 'Por favor, intenta de nuevo'
        },
        { status: 408 }
      )
    }

    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
        details: error.message
      },
      { status: error.status || 500 }
    )
  }
} 