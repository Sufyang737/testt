# Documentación del Endpoint de Clasificación de Chat

## Descripción
Este endpoint permite asignar o actualizar una clasificación de prioridad a una conversación de WhatsApp existente. La clasificación puede ser "low", "medium" o "high".

## Detalles del Endpoint

- **URL**: `https://fe09-190-210-38-133.ngrok-free.app/api/chat/clasification`
- **Método**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer 1` (o tu token de autorización)

## Parámetros del Body (JSON)

| Parámetro | Tipo | Descripción | Obligatorio |
|-----------|------|-------------|-------------|
| chatId | string | Identificador del chat de WhatsApp (ej: "5492966356455@c.us") | Sí |
| sessionId | string | Identificador de la sesión del cliente (ej: "mati") | Sí |
| clasification | string | Nivel de prioridad: "low", "medium" o "high" | Sí |

## Ejemplo de Request

```bash
curl -X POST "https://fe09-190-210-38-133.ngrok-free.app/api/chat/clasification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 1" \
  -d '{
    "chatId": "5492966356455@c.us",
    "sessionId": "mati",
    "clasification": "high"
  }'
```

## Respuestas

### Respuesta Exitosa (200 OK)

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

### Errores Comunes

#### Campos Faltantes (400 Bad Request)

```json
{
  "error": "Chat ID, Session ID y clasificación son obligatorios"
}
```

#### Clasificación Inválida (400 Bad Request)

```json
{
  "error": "La clasificación debe ser low, medium o high"
}
```

#### Cliente No Encontrado (404 Not Found)

```json
{
  "error": "Cliente no encontrado",
  "searchedSessionId": "session_inexistente"
}
```

#### Conversación No Encontrada (404 Not Found)

```json
{
  "error": "Conversación no encontrada",
  "searchedChatId": "chat_inexistente"
}
```

## Comportamiento

1. Si no existe una clasificación previa para la conversación, se creará una nueva
2. Si ya existe una clasificación, se actualizará con el nuevo valor
3. El endpoint valida que el cliente y la conversación existan antes de crear la clasificación
4. La clasificación queda vinculada tanto a la conversación como al cliente

## Notas de Integración

- Asegúrate de enviar el chatId en el formato correcto (típicamente número+@c.us)
- El sessionId debe corresponder a una sesión existente en PocketBase
- La clasificación debe ser exactamente "low", "medium" o "high" (sensible a mayúsculas/minúsculas)

## Ejemplo de Integración en Python

```python
import requests
import json

url = "https://fe09-190-210-38-133.ngrok-free.app/api/chat/clasification"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer 1"
}
data = {
    "chatId": "5492966356455@c.us",
    "sessionId": "mati",
    "clasification": "high"
}

response = requests.post(url, headers=headers, data=json.dumps(data))
print(response.status_code)
print(response.json())
```

## Ejemplo de Integración en JavaScript

```javascript
const axios = require('axios');

const url = "https://fe09-190-210-38-133.ngrok-free.app/api/chat/clasification";
const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer 1"
};
const data = {
    chatId: "5492966356455@c.us",
    sessionId: "mati",
    clasification: "high"
};

axios.post(url, data, { headers })
    .then(response => {
        console.log(response.status);
        console.log(response.data);
    })
    .catch(error => {
        console.error(error);
    });
```

## Diagrama de Flujo

1. Cliente envía POST con chatId, sessionId y clasification
2. Servidor valida que todos los campos estén presentes
3. Servidor valida que la clasificación sea válida
4. Servidor busca el cliente por sessionId
5. Servidor busca la conversación por chatId y clientId
6. Servidor verifica si ya existe una clasificación para esta conversación
7. Si existe, actualiza la clasificación; si no, crea una nueva
8. Servidor devuelve la respuesta con los detalles de la clasificación

## Consideraciones de Seguridad

- Todas las llamadas al endpoint deben incluir el token de autorización
- El endpoint solo permite los valores específicos para clasification
- Se realizan validaciones para evitar la creación de registros innecesarios
- Los IDs de cliente y conversación se obtienen del servidor, no se confía en los enviados por el cliente 