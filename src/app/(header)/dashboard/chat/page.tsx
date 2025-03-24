"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  DocumentTextIcon,
  BoltIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import PocketBase from 'pocketbase';

interface WAHAChat {
  id: string;
  name: string;
  lastMessage?: {
    body: string;
    timestamp: number;
  };
  picture?: string;
}

interface WAHAMessage {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string;
  unread: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  timestamp: Date;
}

interface WAHAWebhookMessage {
  event: string;
  session: string;
  payload: {
    id: string;
    timestamp: number;
    from: string;
    fromMe: boolean;
    body: string;
    // ... otros campos que puedas necesitar
  };
}

interface ConversationRecord {
  id: string;
  client_id: string;
  use_bot: boolean;
  name: string;
  number_client: number;
  category: string;
  finished_chat: boolean;
  chat_id: string;
}

interface ProfileLeadRecord {
  id: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  name_client: string;
  name_company?: string;
  description_company?: string;
  conversation: string;
  client_id: string;
}

interface DetailsConversationRecord {
  id: string;
  conversation_id: string;
  client_id: string;
  lead_id: string;
  priority: 'low' | 'medium' | 'high';
  customer_source: string;
  conversation_status: 'open' | 'closed';
  request_type: string;
}

interface Template {
  id: string;
  name_template: string;
  template: string;
  tags: string;
}

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL || '';
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

export default function ChatPage() {
  const { user } = useUser();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [pb] = useState(() => new PocketBase(POCKETBASE_URL));
  const [selectedChatDetails, setSelectedChatDetails] = useState<{
    conversation?: ConversationRecord;
    profile?: ProfileLeadRecord;
    details?: DetailsConversationRecord;
  } | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState<Partial<ProfileLeadRecord>>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;

      try {
        // 1. Obtener el session_id del cliente desde PocketBase
        const pb = new PocketBase(POCKETBASE_URL);
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `clerk_id = "${user.id}"`
        );

        if (!clientRecord.session_id) {
          setError('No hay sesión de WhatsApp activa');
          setIsLoading(false);
          return;
        }

        setSessionId(clientRecord.session_id);

        // 2. Obtener los chats desde WAHA API
        const response = await fetch(`${WAHA_API_URL}/api/${clientRecord.session_id}/chats/overview`);
        if (!response.ok) {
          throw new Error('Error al obtener los chats');
        }

        const wahaChats: WAHAChat[] = await response.json();

        // 3. Transformar los datos al formato que necesitamos
        const formattedChats: Chat[] = wahaChats.map(chat => ({
          id: chat.id,
          name: chat.name || 'Sin nombre',
          lastMessage: chat.lastMessage?.body || 'No hay mensajes',
          time: chat.lastMessage 
            ? new Date(chat.lastMessage.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          avatar: chat.picture || '/images/default-avatar.png',
          unread: 0,
        }));

        setChats(formattedChats);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los chats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  // Efecto para cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat || !sessionId) return;

      setIsLoadingMessages(true);
      try {
        const response = await fetch(
          `${WAHA_API_URL}/api/${sessionId}/chats/${selectedChat}/messages?limit=100`
        );

        if (!response.ok) {
          throw new Error('Error al cargar los mensajes');
        }

        const wahaMessages: WAHAMessage[] = await response.json();
        
        // Transformar los mensajes al formato que necesitamos y ordenarlos del más viejo al más nuevo
        const formattedMessages: Message[] = wahaMessages
          .map(msg => ({
            id: msg.id,
            text: msg.body,
            sender: msg.fromMe ? 'user' as const : 'contact' as const,
            timestamp: new Date(msg.timestamp * 1000),
          }))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Ordenar por timestamp

        setMessages(formattedMessages);
      } catch (err) {
        console.error('Error al cargar mensajes:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedChat, sessionId]);

  // Función para procesar mensajes entrantes
  const handleIncomingMessage = useCallback((wahaMessage: WAHAWebhookMessage) => {
    if (!selectedChat) return;
    
    // Solo procesamos mensajes del chat seleccionado
    if (wahaMessage.payload.from !== selectedChat) return;

    const newMessage: Message = {
      id: wahaMessage.payload.id,
      text: wahaMessage.payload.body,
      sender: wahaMessage.payload.fromMe ? 'user' : 'contact',
      timestamp: new Date(wahaMessage.payload.timestamp * 1000),
    };

    setMessages(prev => [...prev, newMessage]);
  }, [selectedChat]);

  // Efecto para establecer la conexión WebSocket
  useEffect(() => {
    if (!sessionId) return;

    // Crear conexión WebSocket
    const ws = new WebSocket(`${WAHA_API_URL.replace('http', 'ws')}/api/${sessionId}/events`);
    
    ws.onopen = () => {
      console.log('WebSocket conectado');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data: WAHAWebhookMessage = JSON.parse(event.data);
        if (data.event === 'message') {
          handleIncomingMessage(data);
        }
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Error en WebSocket:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket desconectado');
      setSocket(null);
    };

    // Limpieza al desmontar
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sessionId, handleIncomingMessage]);

  // Efecto para recargar los chats periódicamente
  useEffect(() => {
    if (!sessionId) return;

    const fetchNewChats = async () => {
      try {
        const response = await fetch(`${WAHA_API_URL}/api/${sessionId}/chats/overview`);
        if (!response.ok) return;

        const wahaChats: WAHAChat[] = await response.json();
        const formattedChats: Chat[] = wahaChats.map(chat => ({
          id: chat.id,
          name: chat.name || 'Sin nombre',
          lastMessage: chat.lastMessage?.body || 'No hay mensajes',
          time: chat.lastMessage 
            ? new Date(chat.lastMessage.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          avatar: chat.picture || '/images/default-avatar.png',
          unread: 0,
        }));

        setChats(formattedChats);
      } catch (err) {
        console.error('Error al actualizar chats:', err);
      }
    };

    // Actualizar chats cada 3 segundos
    const interval = setInterval(fetchNewChats, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Efecto para recargar mensajes del chat activo periódicamente
  useEffect(() => {
    if (!selectedChat || !sessionId) return;

    const fetchNewMessages = async () => {
      try {
        const response = await fetch(
          `${WAHA_API_URL}/api/${sessionId}/chats/${selectedChat}/messages?limit=100`
        );

        if (!response.ok) return;

        const wahaMessages: WAHAMessage[] = await response.json();
        
        const formattedMessages: Message[] = wahaMessages
          .map(msg => ({
            id: msg.id,
            text: msg.body,
            sender: msg.fromMe ? 'user' as const : 'contact' as const,
            timestamp: new Date(msg.timestamp * 1000),
          }))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Solo actualizar si hay mensajes nuevos
        setMessages(prevMessages => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const newMessages = formattedMessages.filter(msg => 
            !prevMessages.some(prevMsg => prevMsg.id === msg.id)
          );

          if (newMessages.length > 0) {
            return [...prevMessages, ...newMessages];
          }
          return prevMessages;
        });
      } catch (err) {
        console.error('Error al actualizar mensajes:', err);
      }
    };

    // Actualizar mensajes cada 2 segundos
    const interval = setInterval(fetchNewMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedChat, sessionId]);

  // Función para crear los registros en PocketBase
  const createConversationRecords = async (chatData: Chat) => {
    try {
      if (!user) return;

      // Primero obtener el ID del cliente en PocketBase
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `clerk_id = "${user.id}"`
      );

      if (!clientRecord) {
        console.error('No se encontró el registro del cliente en PocketBase');
        return;
      }

      console.log('Creando registros para el chat:', chatData);
      console.log('Cliente encontrado:', clientRecord);

      // 1. Crear el registro de conversación
      const conversationData = {
        client_id: clientRecord.id,
        use_bot: true,
        name: chatData.name,
        number_client: parseInt(chatData.id.replace('@c.us', '')),
        category: 'whatsapp',
        finished_chat: false,
        chat_id: chatData.id
      };

      console.log('Datos de conversación a crear:', conversationData);
      const conversationRecord = await pb.collection('conversation').create(conversationData);
      console.log('Conversación creada:', conversationRecord);

      // 2. Crear el perfil del lead
      const profileLeadData = {
        instagram: '',
        facebook: '',
        x: '',
        name_client: chatData.name,
        name_company: '',
        description_company: '',
        conversation: conversationRecord.id,
        client_id: clientRecord.id
      };

      console.log('Datos de perfil lead a crear:', profileLeadData);
      const profileLeadRecord = await pb.collection('profile_lead').create(profileLeadData);
      console.log('Perfil lead creado:', profileLeadRecord);

      // 3. Crear los detalles de la conversación
      const detailsData = {
        conversation_id: conversationRecord.id,
        client_id: clientRecord.id,
        lead_id: profileLeadRecord.id, // Aquí usamos el ID del profile_lead recién creado
        priority: 'low',
        customer_source: 'whatsapp',
        conversation_status: 'open',
        request_type: 'general'
      };

      try {
        console.log('Datos de detalles a crear:', detailsData);
        const detailsRecord = await pb.collection('details_conversation').create(detailsData);
        console.log('Detalles creados:', detailsRecord);
      } catch (error) {
        console.error('Error al crear detalles:', error);
        if (error instanceof Error) {
          console.error('Mensaje de error específico:', error.message);
        }
        throw error;
      }

      console.log('Todos los registros creados exitosamente');
    } catch (error) {
      console.error('Error detallado al crear registros:', error);
      if (error instanceof Error) {
        console.error('Mensaje de error:', error.message);
      }
      throw error;
    }
  };

  // Función para cargar los detalles del chat seleccionado
  const loadChatDetails = async (chatId: string, clientId: string) => {
    try {
      // Buscar la conversación existente
      const conversationRecord = await pb.collection('conversation')
        .getFirstListItem(`chat_id = "${chatId}" && client_id = "${clientId}"`);

      if (conversationRecord) {
        const conversation = conversationRecord as unknown as ConversationRecord;
        
        // Buscar el perfil del lead
        const profileRecord = await pb.collection('profile_lead')
          .getFirstListItem(`conversation = "${conversation.id}"`)
          .catch(() => null);
        
        const profile = profileRecord as unknown as ProfileLeadRecord | undefined;

        // Buscar los detalles de la conversación
        const detailsRecord = await pb.collection('details_conversation')
          .getFirstListItem(`conversation_id = "${conversation.id}"`)
          .catch(() => null);
        
        const details = detailsRecord as unknown as DetailsConversationRecord | undefined;

        setSelectedChatDetails({ 
          conversation, 
          profile: profile || undefined,
          details: details || undefined
        });
      }
    } catch (error) {
      console.error('Error al cargar detalles del chat:', error);
      setSelectedChatDetails(null);
    }
  };

  // Modificar handleChatSelection para incluir la carga de detalles
  const handleChatSelection = async (chatId: string) => {
    setSelectedChat(chatId);
    const selectedChatData = chats.find(c => c.id === chatId);
    
    if (selectedChatData && user) {
      try {
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `clerk_id = "${user.id}"`
        );

        if (!clientRecord) {
          console.error('No se encontró el registro del cliente en PocketBase');
          return;
        }

        // Verificar si ya existe una conversación para este chat
        const existingConversation = await pb.collection('conversation')
          .getFirstListItem(
            `chat_id = "${chatId}" && client_id = "${clientRecord.id}"`
          )
          .catch(() => null);

        if (!existingConversation) {
          console.log('No existe conversación, creando registros...');
          await createConversationRecords(selectedChatData);
        }

        // Cargar los detalles después de crear o verificar la conversación
        await loadChatDetails(chatId, clientRecord.id);
      } catch (error) {
        console.error('Error en handleChatSelection:', error);
        if (error instanceof Error) {
          console.error('Mensaje de error específico:', error.message);
        }
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !sessionId) return;

    try {
      // Primero enviamos "seen" al último mensaje si existe
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        await fetch(`${WAHA_API_URL}/api/sendSeen`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session: sessionId,
            chatId: selectedChat,
            messageId: lastMessage.id
          }),
        });
      }

      // Luego enviamos el nuevo mensaje
      const response = await fetch(`${WAHA_API_URL}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionId,
          chatId: selectedChat,
          text: newMessage,
          linkPreview: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar el mensaje');
      }

      const messageResponse = await response.json();

      // Agregamos el mensaje a la lista local
      const userMessage: Message = {
        id: messageResponse.id,
        text: messageResponse.body || newMessage,
        sender: 'user',
        timestamp: new Date(messageResponse.timestamp * 1000),
      };

      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      // Aquí podrías mostrar una notificación de error al usuario usando un toast
      alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    }
  };

  // Añadir función para cargar templates
  const fetchTemplates = async () => {
    if (!user) return;
    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `clerk_id = "${user.id}"`
      );
      const records = await pb.collection('templates_chats').getFullList<Template>({
        filter: `client_id = "${clientRecord.id}"`,
        sort: '-created'
      });
      setTemplates(records);
    } catch (err) {
      console.error('Error al cargar templates:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const handleTemplateSelect = (template: Template) => {
    setNewMessage(template.template);
    setIsTemplateModalOpen(false);
  };

  const toggleBotStatus = async () => {
    if (!selectedChatDetails?.conversation) return;
    
    try {
      const updatedConversation = await pb.collection('conversation').update(
        selectedChatDetails.conversation.id,
        { use_bot: !selectedChatDetails.conversation.use_bot }
      );

      setSelectedChatDetails(prev => prev ? {
        ...prev,
        conversation: {
          ...prev.conversation!,
          use_bot: !prev.conversation!.use_bot
        }
      } : null);

    } catch (error) {
      console.error('Error al actualizar el estado del bot:', error);
      alert('Error al actualizar el estado del bot');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-70px)] w-full bg-bgCoal flex items-center justify-center">
        <div className="text-white">Cargando chats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-70px)] w-full bg-bgCoal flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-gray-400">Asegúrate de tener una sesión de WhatsApp activa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-70px)] w-full bg-bgCoal">
      <div className="h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-full flex bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Lista de chats */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            {/* Header de búsqueda */}
            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar o empezar un nuevo chat"
                  className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-prinFuchsia"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Lista de chats */}
            <div className="flex-1 overflow-y-auto">
              {chats
                .filter(chat => 
                  chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex items-center p-4 hover:bg-gray-700 cursor-pointer transition-colors ${
                      selectedChat === chat.id ? 'bg-gray-700' : ''
                    }`}
                    onClick={() => handleChatSelection(chat.id)}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                      <Image
                        src={chat.avatar}
                        alt={chat.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-white font-medium truncate">{chat.name}</h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {chat.time}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <span className="ml-2 bg-prinFuchsia text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Área de chat */}
          {selectedChat ? (
            <div className="flex-1 flex flex-col">
              {/* Header del chat activo */}
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600">
                      <Image
                        src={chats.find(c => c.id === selectedChat)?.avatar || ''}
                        alt="Contact"
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-white font-medium">
                        {chats.find(c => c.id === selectedChat)?.name}
                      </h2>
                      <div className="flex items-center space-x-2">
                        {selectedChatDetails?.conversation && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={toggleBotStatus}
                              className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none"
                            >
                              <span
                                className={`
                                  inline-block h-8 w-14 rounded-full
                                  ${selectedChatDetails.conversation.use_bot ? 'bg-white' : 'bg-gray-700'}
                                  transition-colors duration-300
                                `}
                              />
                              <span
                                className={`
                                  absolute inline-block h-6 w-6 transform rounded-full
                                  ${selectedChatDetails.conversation.use_bot ? 'translate-x-7 bg-black' : 'translate-x-1 bg-gray-500'}
                                  transition-transform duration-300 ease-in-out
                                `}
                              />
                              <span 
                                className={`
                                  absolute left-0 right-0 text-xs font-medium text-center
                                  ${selectedChatDetails.conversation.use_bot ? 'text-black' : 'text-white'}
                                `}
                              >
                                {selectedChatDetails.conversation.use_bot ? 'ON' : 'OFF'}
                              </span>
                            </button>
                            <span className={`text-sm ${
                              selectedChatDetails.conversation.use_bot ? 'text-white' : 'text-gray-500'
                            }`}>
                              Chat Bot
                            </span>
                          </div>
                        )}
                        {selectedChatDetails?.details && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedChatDetails.details.priority === 'high' 
                              ? 'bg-red-500' 
                              : selectedChatDetails.details.priority === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          } text-white`}>
                            {selectedChatDetails.details.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700"
                      onClick={() => setIsProfileModalOpen(true)}
                    >
                      <span className="text-sm">Perfil</span>
                      {selectedChatDetails?.profile && (
                        (!selectedChatDetails.profile.instagram &&
                         !selectedChatDetails.profile.facebook &&
                         !selectedChatDetails.profile.x ||
                         !selectedChatDetails.profile.name_company ||
                         !selectedChatDetails.profile.description_company) && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                        )
                      )}
                    </button>
                    <button className="text-gray-400 hover:text-white">
                      <EllipsisVerticalIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Área de mensajes */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-900">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">Cargando mensajes...</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.sender === 'user'
                              ? 'bg-prinFuchsia text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p>{message.text}</p>
                          <span className="text-xs text-gray-300 mt-1 block">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input de mensaje */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-800">
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                    disabled={selectedChatDetails?.conversation?.use_bot}
                  >
                    <PaperClipIcon className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                    disabled={selectedChatDetails?.conversation?.use_bot}
                  >
                    <DocumentTextIcon className="w-6 h-6" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedChatDetails?.conversation?.use_bot ? "Bot activo - No puedes enviar mensajes" : "Escribe un mensaje..."}
                    className={`flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                      selectedChatDetails?.conversation?.use_bot ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={selectedChatDetails?.conversation?.use_bot}
                  />
                  <button
                    type="submit"
                    className={`p-2 bg-primary text-white rounded-full transition-colors ${
                      selectedChatDetails?.conversation?.use_bot || !newMessage.trim() 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-primary-hover'
                    }`}
                    disabled={selectedChatDetails?.conversation?.use_bot || !newMessage.trim()}
                  >
                    <PaperAirplaneIcon className="w-6 h-6" />
                  </button>
                </div>
                {selectedChatDetails?.conversation?.use_bot && (
                  <p className="text-yellow-500 text-sm mt-2 text-center">
                    El bot está activo. Los mensajes serán respondidos automáticamente.
                  </p>
                )}
              </form>
            </div>
          ) : (
            // Estado cuando no hay chat seleccionado
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <h3 className="text-white text-xl font-medium mb-2">Bienvenido al Chat</h3>
                <p className="text-gray-400">Selecciona un chat para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Perfil */}
      {isProfileModalOpen && selectedChatDetails?.profile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Perfil del Lead</h3>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await pb.collection('profile_lead').update(selectedChatDetails.profile!.id, profileFormData);
                  await loadChatDetails(selectedChat!, selectedChatDetails.profile!.client_id);
                  setIsProfileModalOpen(false);
                } catch (error) {
                  console.error('Error al actualizar el perfil:', error);
                  alert('Error al actualizar el perfil');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={profileFormData.name_client || selectedChatDetails.profile.name_client}
                    onChange={(e) => setProfileFormData(prev => ({ ...prev, name_client: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    value={profileFormData.name_company || selectedChatDetails.profile.name_company || ''}
                    onChange={(e) => setProfileFormData(prev => ({ ...prev, name_company: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Descripción de la Empresa
                  </label>
                  <textarea
                    value={profileFormData.description_company || selectedChatDetails.profile.description_company || ''}
                    onChange={(e) => setProfileFormData(prev => ({ ...prev, description_company: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={profileFormData.instagram || selectedChatDetails.profile.instagram || ''}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, instagram: e.target.value }))}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="@usuario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Facebook
                    </label>
                    <input
                      type="text"
                      value={profileFormData.facebook || selectedChatDetails.profile.facebook || ''}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, facebook: e.target.value }))}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="@usuario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      X (Twitter)
                    </label>
                    <input
                      type="text"
                      value={profileFormData.x || selectedChatDetails.profile.x || ''}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, x: e.target.value }))}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="@usuario"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Templates */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Templates</h3>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h4 className="text-white font-medium mb-2">{template.name_template}</h4>
                    <p className="text-gray-300 text-sm">{template.template}</p>
                    <div className="flex gap-2 mt-2">
                      {template.tags.split(',').map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                
                {templates.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No hay templates disponibles</p>
                    <button
                      onClick={() => {
                        setIsTemplateModalOpen(false);
                        // Aquí podrías añadir navegación a la página de templates
                      }}
                      className="mt-4 text-primary hover:text-primary-hover transition-colors"
                    >
                      Crear nuevo template
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 