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
  ChatBubbleLeftRightIcon,
  PlusIcon,
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

// Añadir nueva interfaz para las variables de template
interface TemplateVariables {
  name: string;
  [key: string]: string;
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
  // Nuevas variables de estado para el modal de variables
  const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateVariables, setTemplateVariables] = useState<TemplateVariables>({
    name: '',
  });
  const [processedMessage, setProcessedMessage] = useState('');
  // Referencia para el elemento de audio de notificación
  const notificationSoundRef = React.useRef<HTMLAudioElement | null>(null);
  // Estado para controlar las notificaciones
  const [notifications, setNotifications] = useState<{[chatId: string]: number}>({});
  // Estado para controlar si el usuario tiene la ventana activa
  const [isWindowActive, setIsWindowActive] = useState(true);
  // Objeto para guardar las conversaciones y sus estados de bot
  const [conversationBotStatus, setConversationBotStatus] = useState<{[chatId: string]: boolean}>({});
  // Estado para controlar si el sonido está cargado
  const [soundLoaded, setSoundLoaded] = useState(false);
  // Cliente id para facilitar consultas
  const [clientId, setClientId] = useState<string | null>(null);

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

  // Efecto para crear el elemento de audio
  useEffect(() => {
    // Crear el elemento de audio y configurar eventos
    const audio = new Audio('/sounds/notification.mp3');
    audio.preload = 'auto';
    audio.volume = 0.7; // Ajustar volumen a un nivel adecuado

    audio.addEventListener('canplaythrough', () => {
      console.log('Sonido de notificación cargado correctamente');
      setSoundLoaded(true);
    });
    audio.addEventListener('error', (e) => {
      console.error('Error al cargar el sonido de notificación:', e);
    });
    notificationSoundRef.current = audio;
    
    // Detectar cuando la ventana está activa/inactiva
    const handleVisibilityChange = () => {
      setIsWindowActive(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Solicitar permisos para notificaciones inmediatamente al cargar
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        // Solo mostramos la solicitud si está en estado default (no decidido)
        setTimeout(() => {
          Notification.requestPermission().then(permission => {
            console.log('Permiso de notificación:', permission);
          });
        }, 2000); // Pequeño retraso para mejor experiencia de usuario
      }
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current = null;
      }
    };
  }, []);

  // Efecto para cargar los estados del bot para todas las conversaciones
  useEffect(() => {
    if (!user) return;
    
    const loadAllConversationBotStatus = async () => {
      try {
        // Obtener el ID del cliente
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `clerk_id = "${user.id}"`
        );
        
        if (!clientRecord) return;
        
        setClientId(clientRecord.id);
        
        // Cargar todas las conversaciones para este cliente
        const conversations = await pb.collection('conversation').getFullList({
          filter: `client_id = "${clientRecord.id}"`,
        });
        
        // Crear un objeto con los estados del bot para cada conversación
        const botStatus: {[chatId: string]: boolean} = {};
        conversations.forEach((conv: any) => {
          botStatus[conv.chat_id] = conv.use_bot;
        });
        
        console.log('Estados del bot cargados:', botStatus);
        setConversationBotStatus(botStatus);
      } catch (error) {
        console.error('Error al cargar los estados del bot:', error);
      }
    };
    
    loadAllConversationBotStatus();
  }, [user, pb]);

  // Función para mostrar una notificación
  const showNotification = useCallback((chat: Chat, message: string) => {
    // Verificar si esta conversación usa bot según el estado actual
    const usesBot = conversationBotStatus[chat.id] || false;
    
    console.log('Notificación para chat:', chat.id, 'Bot activo:', usesBot);
    
    // Solo mostrar notificación si la conversación NO usa bot
    if (usesBot) {
      console.log('Ignorando notificación, chat usa bot:', chat.id);
      return;
    }
    
    console.log('Mostrando notificación para chat:', chat.id);
    console.log('Estado ventana activa:', isWindowActive);
    console.log('Chat seleccionado:', selectedChat);
    
    // Reproducir sonido solo si la ventana no está activa o no es el chat seleccionado
    if (!isWindowActive || selectedChat !== chat.id) {
      if (notificationSoundRef.current && soundLoaded) {
        console.log('Intentando reproducir sonido');
        
        // Clonamos el audio para evitar problemas con reproducciones simultáneas
        try {
          const soundClone = notificationSoundRef.current.cloneNode() as HTMLAudioElement;
          soundClone.volume = notificationSoundRef.current.volume;
          soundClone.play()
            .then(() => console.log('Sonido reproducido correctamente'))
            .catch(err => {
              console.error('Error reproduciendo sonido:', err);
              // Si falló el clon, intentamos con el original como respaldo
              notificationSoundRef.current?.play().catch(e => console.error('Error en reproducción de respaldo:', e));
            });
        } catch (error) {
          console.error('Error al clonar audio:', error);
          // Intento de respaldo con el audio original
          notificationSoundRef.current.currentTime = 0;
          notificationSoundRef.current.play()
            .catch(err => console.error('Error en reproducción de respaldo:', err));
        }
      } else {
        console.warn('Elemento de audio no disponible o no cargado');
      }
      
      // Mostrar notificación nativa si está disponible y el usuario lo ha permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification('Nuevo mensaje de ' + chat.name, {
            body: message,
            icon: '/images/logo.png',
            badge: '/favicon.ico',
            tag: `chat-${chat.id}` // Agrupar notificaciones del mismo chat
          });
          
          // Añadir click event para llevar al usuario al chat correspondiente
          notification.onclick = () => {
            window.focus();
            setSelectedChat(chat.id);
          };
        } catch (error) {
          console.error('Error al mostrar notificación:', error);
        }
      }
      
      // Incrementar contador de notificaciones para este chat
      setNotifications(prev => ({
        ...prev,
        [chat.id]: (prev[chat.id] || 0) + 1
      }));
    }
  }, [isWindowActive, selectedChat, conversationBotStatus, soundLoaded, setSelectedChat]);

  // Modificar la función para procesar mensajes entrantes
  const handleIncomingMessage = useCallback((wahaMessage: WAHAWebhookMessage) => {
    // Ignorar mensajes enviados por nosotros
    if (wahaMessage.payload.fromMe) return;
    
    // Si el mensaje no es del chat seleccionado o la ventana no está activa, mostrar notificación
    const chatData = chats.find(c => c.id === wahaMessage.payload.from);
    
    if (chatData) {
      console.log('Mensaje entrante de:', chatData.name, 'ID:', wahaMessage.payload.from);
      
      // Verificar si necesitamos buscar el estado del bot para esta conversación
      const checkAndUpdateBotStatus = async () => {
        // Si no conocemos el estado del bot para esta conversación, intentar obtenerlo
        if (clientId && conversationBotStatus[wahaMessage.payload.from] === undefined) {
          try {
            console.log('Consultando estado del bot para conversación:', wahaMessage.payload.from);
            
            // Buscar la conversación por chat_id
            const conversation = await pb.collection('conversation').getFirstListItem(
              `chat_id = "${wahaMessage.payload.from}" && client_id = "${clientId}"`
            );
            
            if (conversation) {
              console.log('Conversación encontrada, estado bot:', conversation.use_bot);
              
              // Actualizar el estado del bot para esta conversación
              setConversationBotStatus(prev => ({
                ...prev,
                [wahaMessage.payload.from]: conversation.use_bot
              }));
              
              return conversation.use_bot;
            }
          } catch (error) {
            console.log('Conversación no encontrada en la base de datos');
            return false;
          }
        }
        
        return conversationBotStatus[wahaMessage.payload.from] || false;
      };
      
      // Verificar el estado del bot y mostrar notificación si es necesario
      checkAndUpdateBotStatus().then(() => {
        console.log('Mostrando notificación después de verificar estado del bot');
        showNotification(chatData, wahaMessage.payload.body);
      });
    }
    
    // Solo procesamos mensajes del chat seleccionado para mostrarlos en la interfaz
    if (selectedChat && wahaMessage.payload.from === selectedChat) {
    const newMessage: Message = {
      id: wahaMessage.payload.id,
      text: wahaMessage.payload.body,
      sender: wahaMessage.payload.fromMe ? 'user' : 'contact',
      timestamp: new Date(wahaMessage.payload.timestamp * 1000),
    };

    setMessages(prev => [...prev, newMessage]);
    }
  }, [selectedChat, chats, showNotification, conversationBotStatus, clientId, pb]);

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
        
        // Guardar el estado del bot para esta conversación
        setConversationBotStatus(prev => ({
          ...prev,
          [chatId]: conversation.use_bot
        }));
        
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

  // Modificar handleChatSelection para también verificar el estado del bot
  const handleChatSelection = async (chatId: string) => {
    setSelectedChat(chatId);
    
    // Limpiar notificaciones para este chat
    setNotifications(prev => ({
      ...prev,
      [chatId]: 0
    }));
    
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

        setClientId(clientRecord.id);

        // Verificar si ya existe una conversación para este chat
        try {
          // Buscar la conversación existente
          const existingConversation = await pb.collection('conversation').getFirstListItem(
            `chat_id = "${chatId}" && client_id = "${clientRecord.id}"`
          );
          
          if (existingConversation) {
            console.log('Conversación existente encontrada, estado bot:', existingConversation.use_bot);
            
            // Actualizar el estado del bot para esta conversación
            setConversationBotStatus(prev => ({
              ...prev,
              [chatId]: existingConversation.use_bot
            }));
            
            // Cargar los detalles
            await loadChatDetails(chatId, clientRecord.id);
          }
        } catch (error) {
          console.log('Conversación no encontrada, creando registros...');
          await createConversationRecords(selectedChatData);
          
          // Por defecto las nuevas conversaciones tienen el bot activado
          setConversationBotStatus(prev => ({
            ...prev,
            [chatId]: true
          }));
          
          // Cargar los detalles después de crear
        await loadChatDetails(chatId, clientRecord.id);
        }
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
    setSelectedTemplate(template);
    
    // Extraer todas las variables del template (patrones como {{variable}})
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const extractedVars: string[] = [];
    let match;
    
    // Usar exec en lugar de matchAll para mayor compatibilidad
    while ((match = variablePattern.exec(template.template)) !== null) {
      if (match[1] && !extractedVars.includes(match[1])) {
        extractedVars.push(match[1]);
      }
    }
    
    // Crear un objeto con las variables encontradas
    const variables: TemplateVariables = { name: '' };
    extractedVars.forEach(varName => {
      variables[varName] = '';
    });
    
    // Prellenar con datos del contacto si están disponibles
    if (selectedChat) {
      const chatData = chats.find(c => c.id === selectedChat);
      if (chatData) {
        variables.name = chatData.name;
      }
      
      // Si tenemos información del perfil, usar esos datos también
      if (selectedChatDetails?.profile) {
        if (variables.hasOwnProperty('name')) {
          variables.name = selectedChatDetails.profile.name_client || chatData?.name || '';
        }
        if (variables.hasOwnProperty('company')) {
          variables.company = selectedChatDetails.profile.name_company || '';
        }
      }
    }
    
    setTemplateVariables(variables);
    
    // Procesar el mensaje con las variables
    let processed = template.template;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    
    setProcessedMessage(processed);
    
    // Si hay variables sin valor, mostrar el modal para completarlas
    const hasEmptyVars = extractedVars.some(varName => !variables[varName]);
    if (hasEmptyVars) {
      setIsVariablesModalOpen(true);
    } else {
      // Si todas las variables tienen valor, insertar directamente
      setNewMessage(processed);
      setIsTemplateModalOpen(false);
    }
  };
  
  const handleApplyTemplate = () => {
    // Aplicar las variables al template
    let processed = selectedTemplate?.template || '';
    Object.entries(templateVariables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    
    setNewMessage(processed);
    setIsVariablesModalOpen(false);
    setIsTemplateModalOpen(false);
  };

  const toggleBotStatus = async () => {
    if (!selectedChatDetails?.conversation || !selectedChat) return;
    
    try {
      const newBotStatus = !selectedChatDetails.conversation.use_bot;
      
      await pb.collection('conversation').update(
        selectedChatDetails.conversation.id,
        { use_bot: newBotStatus }
      );

      // Actualizar el estado del bot para esta conversación
      setConversationBotStatus(prev => ({
        ...prev,
        [selectedChat]: newBotStatus
      }));

      setSelectedChatDetails(prev => prev ? {
        ...prev,
        conversation: {
          ...prev.conversation!,
          use_bot: newBotStatus
        }
      } : null);

      console.log('Estado del bot actualizado:', selectedChat, newBotStatus);

    } catch (error) {
      console.error('Error al actualizar el estado del bot:', error);
      alert('Error al actualizar el estado del bot');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-70px)] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-700">Cargando tus conversaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-70px)] w-full flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <XCircleIcon className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-red-500 font-medium text-lg mb-2">{error}</p>
          <p className="text-gray-600 mb-6">Asegúrate de tener una sesión de WhatsApp activa</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-70px)] w-full bg-gray-50 overflow-hidden">
      {/* Elemento de audio para notificaciones */}
      {/* Lo creamos dinámicamente en useEffect */}
      
      <div className="h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-full flex bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {/* Lista de chats */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col overflow-hidden">
            {/* Header de búsqueda */}
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar o empezar un nuevo chat"
                  className="w-full bg-gray-100 text-gray-800 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Lista de chats */}
            <div className="flex-1 overflow-y-auto bg-white">
              {chats
                .filter(chat => 
                  chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedChat === chat.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleChatSelection(chat.id)}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <Image
                        src={chat.avatar}
                        alt={chat.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-gray-900 font-medium truncate">{chat.name}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {chat.time}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm truncate">{chat.lastMessage}</p>
                    </div>
                    {(chat.unread > 0 || notifications[chat.id]) && (
                      <span className="ml-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications[chat.id] || chat.unread}
                      </span>
                    )}
                  </div>
                ))}
                
                {chats.filter(chat => 
                  chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 p-4 text-center">
                    <MagnifyingGlassIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No se encontraron conversaciones</p>
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-primary hover:text-primary-hover text-sm"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* Área de chat */}
          {selectedChat ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header del chat activo */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                      <Image
                        src={chats.find(c => c.id === selectedChat)?.avatar || ''}
                        alt="Contact"
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-gray-900 font-medium">
                        {chats.find(c => c.id === selectedChat)?.name}
                      </h2>
                      <div className="flex items-center space-x-2">
                        {selectedChatDetails?.conversation && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={toggleBotStatus}
                              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                            >
                              <span
                                className={`
                                  inline-block h-6 w-11 rounded-full
                                  ${selectedChatDetails.conversation.use_bot ? 'bg-primary' : 'bg-gray-300'}
                                  transition-colors duration-300
                                `}
                              />
                              <span
                                className={`
                                  absolute inline-block h-4 w-4 transform rounded-full bg-white
                                  ${selectedChatDetails.conversation.use_bot ? 'translate-x-6' : 'translate-x-1'}
                                  transition-transform duration-300 ease-in-out
                                `}
                              />
                            </button>
                            <span className={`text-sm ${
                              selectedChatDetails.conversation.use_bot ? 'text-primary font-medium' : 'text-gray-500'
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
                  <div className="flex items-center space-x-2">
                    <button
                      className="relative text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                    <button className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Área de mensajes */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f7f9fc]">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-500 text-sm">Cargando mensajes...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                          <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-gray-700 font-medium">No hay mensajes aún</h3>
                        <p className="text-gray-500 text-sm mt-1">Envía el primer mensaje para comenzar la conversación</p>
                      </div>
                    )}
                    
                    {messages.map((message, index) => {
                      const showDateHeader = index === 0 || 
                        new Date(message.timestamp).toDateString() !== 
                        new Date(messages[index - 1].timestamp).toDateString();
                      
                      return (
                        <React.Fragment key={message.id}>
                          {showDateHeader && (
                            <div className="flex justify-center my-4">
                              <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                                {new Date(message.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                            message.sender === 'user'
                                  ? 'bg-primary text-white rounded-tr-none'
                                  : 'bg-white text-gray-800 rounded-tl-none'
                              }`}
                            >
                              <p className="break-words">{message.text}</p>
                              <span className={`text-xs ${message.sender === 'user' ? 'text-white/80' : 'text-gray-500'} mt-1 block text-right`}>
                                {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input de mensaje */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    className={`p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors ${
                      selectedChatDetails?.conversation?.use_bot ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={selectedChatDetails?.conversation?.use_bot}
                  >
                    <PaperClipIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className={`p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors ${
                      selectedChatDetails?.conversation?.use_bot ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={selectedChatDetails?.conversation?.use_bot}
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedChatDetails?.conversation?.use_bot ? "Bot activo - No puedes enviar mensajes" : "Escribe un mensaje..."}
                      className={`w-full bg-gray-100 text-gray-800 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all ${
                        selectedChatDetails?.conversation?.use_bot ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    disabled={selectedChatDetails?.conversation?.use_bot}
                  />
                  </div>
                  <button
                    type="submit"
                    className={`p-2.5 bg-primary text-white rounded-full transition-all ${
                      selectedChatDetails?.conversation?.use_bot || !newMessage.trim() 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-primary-hover hover:shadow-md active:scale-95'
                    }`}
                    disabled={selectedChatDetails?.conversation?.use_bot || !newMessage.trim()}
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
                {selectedChatDetails?.conversation?.use_bot && (
                  <div className="flex items-center justify-center gap-2 mt-3 bg-yellow-50 text-yellow-700 p-2 rounded-lg">
                    <BoltIcon className="w-5 h-5" />
                    <p className="text-sm">
                    El bot está activo. Los mensajes serán respondidos automáticamente.
                  </p>
                  </div>
                )}
              </form>
            </div>
          ) : (
            // Estado cuando no hay chat seleccionado
            <div className="flex-1 flex items-center justify-center bg-[#f7f9fc]">
              <div className="text-center max-w-sm p-8">
                <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-gray-800 text-xl font-medium mb-3">Centro de Conversaciones</h3>
                <p className="text-gray-600 mb-6">Selecciona un chat para comenzar a interactuar con tus contactos o utiliza el bot para respuestas automáticas.</p>
                <div className="flex justify-center">
                  <a 
                    href="/dashboard/templates" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    <span>Administrar plantillas</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Perfil */}
      {isProfileModalOpen && selectedChatDetails?.profile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Perfil del Lead</h3>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
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
              }} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={profileFormData.name_client || selectedChatDetails.profile.name_client}
                    onChange={(e) => setProfileFormData(prev => ({ ...prev, name_client: e.target.value }))}
                    className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    value={profileFormData.name_company || selectedChatDetails.profile.name_company || ''}
                    onChange={(e) => setProfileFormData(prev => ({ ...prev, name_company: e.target.value }))}
                    className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción de la Empresa
                  </label>
                  <textarea
                    value={profileFormData.description_company || selectedChatDetails.profile.description_company || ''}
                    onChange={(e) => setProfileFormData(prev => ({ ...prev, description_company: e.target.value }))}
                    className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={profileFormData.instagram || selectedChatDetails.profile.instagram || ''}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, instagram: e.target.value }))}
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="@usuario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facebook
                    </label>
                    <input
                      type="text"
                      value={profileFormData.facebook || selectedChatDetails.profile.facebook || ''}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, facebook: e.target.value }))}
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="@usuario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      X (Twitter)
                    </label>
                    <input
                      type="text"
                      value={profileFormData.x || selectedChatDetails.profile.x || ''}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, x: e.target.value }))}
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="@usuario"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Plantillas de Mensajes</h3>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                      className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition-all border border-gray-200 hover:border-gray-300"
                    onClick={() => handleTemplateSelect(template)}
                  >
                      <h4 className="text-gray-800 font-medium mb-2">{template.name_template}</h4>
                      <p className="text-gray-600 text-sm">{template.template}</p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                      {template.tags.split(',').map((tag, i) => (
                          <span key={i} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                
                {templates.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium">No hay plantillas disponibles</p>
                      <p className="text-gray-500 text-sm mt-1 mb-4">Crea nuevas plantillas para agilizar tus respuestas</p>
                      <a
                        href="/dashboard/templates"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        <span>Crear nueva plantilla</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Variables de Template */}
      {isVariablesModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Personalizar variables</h3>
                    <button
                  onClick={() => setIsVariablesModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">Por favor, completa las siguientes variables para personalizar tu mensaje:</p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">Vista previa:</h4>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-gray-700 min-h-16">
                    {processedMessage || (
                      <span className="text-gray-400 italic">Completa las variables para ver la vista previa</span>
                )}
              </div>
            </div>
                
                <div className="space-y-4">
                  {Object.entries(templateVariables).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {key === 'name' ? 'Nombre del cliente' : key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const updatedVars = {
                            ...templateVariables,
                            [key]: e.target.value
                          };
                          setTemplateVariables(updatedVars);
                          
                          // Actualizar la vista previa
                          let processed = selectedTemplate.template;
                          Object.entries(updatedVars).forEach(([k, v]) => {
                            processed = processed.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
                          });
                          setProcessedMessage(processed);
                        }}
                        className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder={`Valor para {{${key}}}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsVariablesModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Aplicar plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 