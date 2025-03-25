# Iowi Dashboard

## Descripción
Sistema de gestión de planes y suscripciones para el dashboard de Iowi, que permite a los usuarios seleccionar y gestionar sus planes de servicio.

## Estructura del Sistema

### 1. Componentes Principales

#### API Endpoints
- `GET /api/plans`: Obtiene la lista de planes disponibles
- `GET /api/clients/plans`: Obtiene los planes asignados a un cliente
- `POST /api/clients/plans`: Asigna un nuevo plan a un cliente

#### Interfaces
     ```typescript
interface Plan {
  id: string;
  title: string;
  description: string;
  price: number;
  total_tokens: string;
}

interface ClientPlan {
  id: string;
  client_id: string;
  plants_id: string;
  paid: boolean;
  free_trial: boolean;
}
```

### 2. Flujo de Uso

#### Selección de Plan
1. El usuario accede a `/select-plan`
2. Se muestran los planes disponibles con:
   - Título
   - Descripción
   - Precio
   - Tokens incluidos
   - Estado del plan (prueba gratuita/pagado)
3. Al seleccionar un plan:
   - Se marca visualmente el plan seleccionado
   - Se habilita el botón de confirmación
4. Al confirmar:
   - Se crea la relación cliente-plan
   - Se activa el período de prueba gratuita
   - Se redirige al dashboard

#### Estados de Plan
- **Prueba Gratuita**
  - Se activa automáticamente al seleccionar un plan
  - Duración: 15 días
  - Indicador visual en la interfaz
- **Plan Pagado**
  - Se actualiza cuando se confirma el pago
  - Acceso completo a las características

### 3. Base de Datos (PocketBase)

#### Colección: plans
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "total_tokens": "string",
  "price": "number",
  "created": "date",
  "updated": "date"
}
```

#### Colección: clients_plants
```json
{
  "id": "string",
  "client_id": "string (relation)",
  "plants_id": "string (relation)",
  "paid": "boolean",
  "free_trial": "boolean",
  "created": "date",
  "updated": "date"
}
```

### 4. Configuración del Proyecto

#### Variables de Entorno Requeridas
```env
POCKETBASE_URL=your_pocketbase_url
POCKETBASE_ADMIN_TOKEN=your_admin_token
```

#### Instalación
```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev
```

### 5. Guía de Uso

#### Para Usuarios
1. **Registro/Login**
   - Crear una cuenta o iniciar sesión
   - Se redirige automáticamente a selección de plan

2. **Selección de Plan**
   - Revisar opciones disponibles
   - Seleccionar plan deseado
   - Confirmar selección

3. **Gestión del Plan**
   - Acceder al dashboard
   - Monitorear uso de tokens
   - Ver estado del plan

#### Para Desarrolladores
1. **Implementación de Nuevos Planes**
   ```typescript
   // Crear nuevo plan en PocketBase
   const newPlan = {
     title: "Plan Nombre",
     description: "Descripción del plan",
     total_tokens: "1000",
     price: 99.99
   };
   ```

2. **Modificación de Planes Existentes**
   - Actualizar a través del panel de administración
   - Los cambios se reflejan inmediatamente
   - No afecta a planes ya asignados

### 6. Manejo de Errores

#### Validaciones
- Verificación de cliente existente
- Validación de plan seleccionado
- Prevención de asignaciones duplicadas

#### Respuestas de Error
   ```typescript
// Ejemplo de respuesta de error
{
  error: string;
  status: number;
}
```

### 7. Seguridad

- Autenticación requerida para todas las operaciones
- Validación de permisos por rol
- Token de administrador para operaciones sensibles

### 8. Mejores Prácticas

1. **Gestión de Planes**
   - Mantener planes actualizados
   - Documentar cambios en planes
   - Monitorear uso de tokens

2. **Mantenimiento**
   - Revisar periódicamente planes activos
   - Actualizar documentación
   - Monitorear errores y excepciones

### 9. Soporte y Contacto

Para soporte técnico o consultas:
- Email: soporte@iowi.tech
- Documentación: docs.iowi.tech
- GitHub: github.com/iowi

# Portal Empresa Iowi

## Integración con WhatsApp

### Configuración del Entorno

Para que la integración con WhatsApp funcione correctamente, necesitas configurar las siguientes variables de entorno en tu archivo `.env.local`:

  ```env
# URL de la API de WAHA (WhatsApp HTTP API)
WAHA_API_URL=http://localhost:8080
# o
EXT_PUBLIC_WAHA_API_URL=http://tu-servidor-waha.com

# URL pública de tu API para webhooks
NEXT_PUBLIC_API_URL=http://localhost:3000

# Configuración de PocketBase
POCKETBASE_URL=https://tu-pocketbase-url.com
POCKETBASE_ADMIN_TOKEN=tu-token-de-admin
```

### Estructura de la Base de Datos

La tabla `clients` en PocketBase debe tener los siguientes campos:

- `clerk_id` (texto): ID único del usuario de Clerk
- `session_id` (texto): ID de la sesión de WhatsApp
- `first_name` (texto): Nombre del cliente
- `last_name` (texto): Apellido del cliente
- `username` (texto): Nombre de usuario
- `phone_client` (número): Número de teléfono

### Flujo de Integración

1. **Selección de Plan**
   - Después de que un usuario selecciona un plan, es redirigido a `/whatsapp`
   - Esta página muestra la interfaz de conexión de WhatsApp

2. **Conexión de WhatsApp**
   - El usuario hace clic en "Conectar"
   - El sistema crea una sesión en WAHA usando el ID de Clerk como identificador
   - Se muestra un código QR para escanear con WhatsApp

3. **Estados de la Sesión**
   - `STARTING`: Sesión iniciando
   - `SCAN_QR_CODE`: Esperando escaneo del código QR
   - `WORKING`: Conexión exitosa
   - Otros estados posibles: `FAILED`, `STOPPED`

### Endpoints de la API

#### POST `/api/whatsapp/session`
Crea una nueva sesión de WhatsApp.

Request:
  ```json
  {
  "userId": "clerk_user_id",
  "userEmail": "user@example.com"
}
```

Response (éxito):
  ```json
  {
  "name": "session_id",
  "status": "STARTING",
  "config": {
    "metadata": {
      "user.id": "clerk_user_id",
      "user.email": "user@example.com",
      "client.id": "pocketbase_client_id"
    }
  }
}
```

#### GET `/api/whatsapp/qr`
Obtiene el código QR para una sesión.

Query params:
- `sessionId`: ID de la sesión de WhatsApp

#### GET `/api/whatsapp/status`
Verifica el estado de una sesión.

Query params:
- `sessionId`: ID de la sesión de WhatsApp

### Webhooks

La integración soporta los siguientes eventos de webhook:

- `session.status`: Cambios en el estado de la sesión
- `message`: Mensajes recibidos
- `message.waiting`: Mensajes en espera
- `poll.vote`: Votos en encuestas

Los webhooks son enviados a: `{NEXT_PUBLIC_API_URL}/api/webhook/whatsapp`

### Seguridad

- Todas las llamadas a PocketBase se realizan usando autenticación de administrador
- Las credenciales sensibles se manejan a través de variables de entorno
- Los IDs de sesión están vinculados a usuarios específicos
- La API interna maneja todas las comunicaciones con WAHA, evitando exposición directa

### Manejo de Errores

- Validación de campos requeridos
- Verificación de existencia del cliente
- Manejo de errores de conexión
- Logs detallados para debugging

### Notas Importantes

1. Asegúrate de que WAHA esté corriendo y accesible
2. El token de administrador de PocketBase debe tener permisos suficientes
3. Los webhooks requieren que tu API sea accesible desde Internet
4. La sesión de WhatsApp se guarda automáticamente en PocketBase

### Desarrollo Local

1. Instala y ejecuta WAHA
2. Configura las variables de entorno
3. Ejecuta el proyecto:
   ```bash
   npm run dev
   ```

4. Accede a http://localhost:3000 para probar la integración

## Gestión de Plantillas y Contactos

### 1. Sistema de Templates

#### Descripción
Sistema de gestión de plantillas de mensajes que permite a los usuarios crear, editar y utilizar templates predefinidos y personalizados para la comunicación con clientes.

#### Estructura de Datos

   ```typescript
interface Template {
     id: string;
  client_id: string;
  template: string;
  name_template: string;
  tags: string;
  variables: string;
  created: string;
  updated: string;
  is_prebuilt?: boolean;
}
```

#### Variables Disponibles
##### Variables de Cliente
- `{{user.name}}`: Nombre del cliente
- `{{user.company}}`: Empresa del cliente
- `{{user.phone}}`: Teléfono del cliente
- `{{date}}`: Fecha actual
- `{{time}}`: Hora actual
- `{{company.website}}`: Sitio web de la empresa
- `{{company.address}}`: Dirección de la empresa

##### Variables de Producto
- `{{product.name}}`: Nombre del producto
- `{{product.price}}`: Precio del producto
- `{{product.description}}`: Descripción del producto
- `{{product.url}}`: URL del producto
- `{{payment.total}}`: Monto total del pago
- `{{payment.currency}}`: Moneda del pago
- `{{order.id}}`: Número de orden
- `{{order.status}}`: Estado de la orden

#### Flujo de Uso de Templates

1. **Acceso a Templates**
   - Navegar a la sección de templates en el dashboard
   - Visualizar templates pre-armados y personalizados

2. **Templates Pre-armados**
   - Revisar templates disponibles
   - Usar template directamente
   - El template se copia a la sección personal con marca "Pre-armado"

3. **Creación de Template**
   - Clic en "Nuevo Template"
   - Completar:
     - Nombre del template
     - Mensaje con variables
     - Etiquetas para categorización
   - Las variables se pueden insertar desde el panel lateral

4. **Edición de Template**
   - Seleccionar template existente
   - Modificar campos necesarios
   - Guardar cambios

### 2. Sistema de Contactos

#### Descripción
Sistema de gestión de contactos que permite visualizar y administrar todas las conversaciones con clientes, incluyendo su estado y categorización.

#### Estructura de Datos

   ```typescript
interface Contact {
       id: string;
  client_id: string;
       name: string;
  number_client: number;
       category: string;
  finished_chat: boolean;
  chat_id: string;
  created: string;
  updated: string;
}
```

#### Funcionalidades Principales

1. **Listado de Contactos**
   - Vista general de todos los contactos
   - Filtrado por nombre, categoría o número
   - Indicadores visuales de estado de chat

2. **Gestión de Contactos**
   - Edición de información de contacto
   - Actualización de estado de chat
   - Categorización de contactos

#### Flujo de Uso de Contactos

1. **Visualización de Contactos**
   - Acceder a la sección de contactos
   - Ver lista completa con estados
   - Usar barra de búsqueda para filtrar

2. **Edición de Contacto**
   - Clic en botón de edición
   - Modificar:
     - Nombre
     - Categoría
     - Número
     - Estado del chat
   - Guardar cambios

3. **Estados de Chat**
   - Verde: Chat finalizado
   - Amarillo: Chat en proceso
   - Seguimiento visual del progreso

### 3. Integración de Sistemas

#### Relación Templates-Contactos
- Los templates se pueden usar en conversaciones con contactos
- Las variables se completan automáticamente con datos del contacto
- El historial de uso se mantiene vinculado

#### Seguridad y Permisos
- Acceso restringido por cliente
- Cada cliente ve solo sus propios contactos y templates
- Los templates pre-armados son compartidos pero se copian al usarlos

### 4. Mejores Prácticas

1. **Uso de Templates**
   - Mantener templates actualizados
   - Usar etiquetas descriptivas
   - Revisar variables antes de usar

2. **Gestión de Contactos**
   - Actualizar estados regularmente
   - Mantener categorías consistentes
   - Verificar información de contacto

3. **Organización**
   - Usar etiquetas para categorizar
   - Mantener nombres descriptivos
   - Actualizar estados oportunamente

### 5. Desarrollo y Mantenimiento

#### Requisitos Técnicos
```bash
# Variables de entorno necesarias
POCKETBASE_URL=your_pocketbase_url
NEXT_PUBLIC_POCKETBASE_URL=your_public_pocketbase_url
```

#### Colecciones de PocketBase
- `templates_chats`: Almacena templates
- `conversation`: Almacena contactos
- `clients`: Información de clientes

#### Endpoints Principales
- `/dashboard/templates`: Gestión de templates
- `/dashboard/contacts`: Gestión de contactos

## Sistema de Chat y Bot

### Características Principales

#### 1. Chat en Tiempo Real
- Conexión WebSocket para mensajes en tiempo real
- Visualización de estado de mensajes (enviado/recibido)
- Soporte para múltiples conversaciones
- Interfaz intuitiva con lista de chats y área de mensajes

#### 2. Bot Automático
- Toggle para activar/desactivar el bot por conversación
- Cuando está activo:
  - Respuestas automáticas a mensajes
  - Interfaz bloqueada para mensajes manuales
  - Indicador visual del estado del bot
- Gestión automática de respuestas basada en templates

#### 3. Gestión de Perfiles de Lead
- Formulario completo de información del lead:
  - Nombre del cliente
  - Nombre de la empresa
  - Descripción de la empresa
  - Redes sociales (Instagram, Facebook, X/Twitter)
- Indicador visual de información faltante
- Actualización en tiempo real de la información

### Estructura de Datos

#### Colección: conversation
```json
{
  "id": "string",
  "client_id": "string",
  "use_bot": "boolean",
  "name": "string",
  "number_client": "number",
  "category": "string",
  "finished_chat": "boolean",
  "chat_id": "string"
}
```

#### Colección: profile_lead
```json
{
  "id": "string",
  "instagram": "string?",
  "facebook": "string?",
  "x": "string?",
  "name_client": "string",
  "name_company": "string?",
  "description_company": "string?",
  "conversation": "string",
  "client_id": "string"
}
```

#### Colección: details_conversation
```json
{
  "id": "string",
  "conversation_id": "string",
  "client_id": "string",
  "lead_id": "string",
  "priority": "enum(low, medium, high)",
  "customer_source": "string",
  "conversation_status": "enum(open, closed)",
  "request_type": "string"
}
```

#### Colección: chat_clasification
```json
{
  "id": "string",
  "conversation_id": "string",
  "client_id": "string",
  "clasification": "enum(low, medium, high)",
  "created": "date",
  "updated": "date"
}
```

### Flujo de Trabajo

1. **Inicio de Conversación**
   - Al recibir un nuevo mensaje, se crea automáticamente:
     - Registro de conversación
     - Perfil del lead
     - Detalles de la conversación

2. **Gestión del Bot**
   - Toggle en la interfaz para activar/desactivar
   - Cuando está activo:
     - Se bloquea la interfaz de mensajes
     - Las respuestas son automáticas
     - Se muestra mensaje informativo

3. **Gestión de Perfiles**
   - Acceso rápido desde el chat
   - Formulario modal para edición
   - Validación de campos requeridos
   - Indicador visual de información faltante

4. **Clasificación de Chats**
   - Asignación de prioridad a las conversaciones
   - Niveles: bajo (low), medio (medium), alto (high)
   - Actualización en tiempo real
   - Filtrado por nivel de prioridad

### Endpoints de la API

#### GET `/api/chat/bot-usage`
Verifica si una conversación tiene el bot activado.

Query params:
- `chatId`: ID del chat de WhatsApp
- `clientId`: ID de sesión del cliente

Respuesta:
```json
{
  "success": true,
  "record": {
    "useBot": true,
    "category": "general"
  }
}
```

#### POST `/api/chat/bot-usage`
Actualiza el estado del bot para una conversación.

Body:
```json
{
  "chatId": "5492966356455@c.us",
  "clientId": "mati",
  "useBot": true,
  "category": "general"
}
```

#### PATCH `/api/chat/bot-usage`
Alterna el estado del bot (activo/inactivo).

Query params:
- `chatId`: ID del chat de WhatsApp
- `clientId`: ID de sesión del cliente

#### POST `/api/chat/clasification`
Asigna o actualiza la clasificación de prioridad de una conversación.

Body:
```json
{
  "chatId": "5492966356455@c.us",
  "sessionId": "mati",
  "clasification": "high"
}
```

Respuesta:
```json
{
  "success": true,
  "record": {
    "id": "2eo387k9debnvj8",
    "chatId": "5492966356455@c.us",
    "clientId": "kceb5s77523h1rb",
    "conversationId": "3xz34qfh6w6knr3",
    "clasification": "high",
    "created": "2025-03-25 22:02:21.286Z",
    "updated": "2025-03-25 22:02:21.286Z"
  }
}
```

### Integración con Templates

- Sistema de templates para respuestas predefinidas
- Categorización por tags
- Inserción rápida en el chat
- Gestión de templates personalizada

### Mejores Prácticas

1. **Uso del Bot**
   - Activar en horarios no laborables
   - Configurar respuestas automáticas relevantes
   - Monitorear efectividad de respuestas

2. **Gestión de Leads**
   - Mantener información actualizada
   - Completar todos los campos posibles
   - Seguimiento de interacciones

3. **Manejo de Conversaciones**
   - Priorizar según urgencia
   - Mantener registro de interacciones
   - Usar templates apropiadamente

4. **Clasificación de Chats**
   - Usar "high" para conversaciones urgentes
   - Usar "medium" para conversaciones en progreso
   - Usar "low" para conversaciones informativas
   - Actualizar la clasificación según evolucione la conversación

### Configuración Técnica

#### Variables de Entorno Adicionales
```env
NEXT_PUBLIC_WAHA_API_URL=your_waha_url
NEXT_PUBLIC_POCKETBASE_URL=your_pocketbase_url
```

#### Comandos de Desarrollo
```bash
# Iniciar desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

### Soporte y Contacto

Para soporte técnico o consultas sobre el sistema de chat:
- Email: soporte@iowi.tech
- Documentación: docs.iowi.tech/chat
- GitHub: github.com/iowi/chat-system

