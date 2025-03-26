# Documentación del Endpoint de Visualización de Perfil de Negocio

## Descripción
Este endpoint permite obtener el perfil de negocio (business profile) de un cliente a partir de su ID de sesión. El endpoint busca primero el cliente por su sessionId y luego obtiene su perfil de negocio asociado.

## Detalles del Endpoint

- **URL**: `https://fe09-190-210-38-133.ngrok-free.app/api/business-profile/view`
- **Método**: GET
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer 1` (o tu token de autorización)

## Parámetros de Query

| Parámetro | Tipo | Descripción | Obligatorio |
|-----------|------|-------------|-------------|
| sessionId | string | Identificador de la sesión del cliente (ej: "mati") | Sí |

## Ejemplo de Request

```bash
curl -X GET "https://fe09-190-210-38-133.ngrok-free.app/api/business-profile/view?sessionId=mati" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 1"
```

## Respuestas

### Respuesta Exitosa - Perfil Encontrado (200 OK)

```json
{
  "success": true,
  "profile": {
    "id": "abcd1234",
    "clientId": "kceb5s77523h1rb",
    "nameCompany": "Mi Empresa",
    "description": "Una descripción de mi empresa",
    "instagram": "https://instagram.com/miempresa",
    "facebook": "https://facebook.com/miempresa",
    "website": "https://miempresa.com",
    "x": "https://x.com/miempresa",
    "openingHours": "Lun-Vie: 9-18",
    "created": "2025-03-25 22:02:21.286Z",
    "updated": "2025-03-25 22:02:21.286Z"
  }
}
```

### Respuesta Exitosa - Perfil No Encontrado (200 OK)

Si el cliente existe pero no tiene un perfil de negocio:

```json
{
  "success": true,
  "message": "Perfil de negocio no encontrado para este cliente",
  "clientId": "kceb5s77523h1rb",
  "sessionId": "mati"
}
```

### Errores Comunes

#### SessionId no proporcionado (400 Bad Request)

```json
{
  "error": "El ID de sesión es requerido"
}
```

#### Cliente No Encontrado (404 Not Found)

```json
{
  "error": "Cliente no encontrado",
  "searchedSessionId": "session_inexistente"
}
```

## Comportamiento

1. El endpoint recibe el sessionId como parámetro de query
2. Busca el cliente en la tabla clients usando el session_id
3. Si encuentra el cliente, obtiene su ID
4. Busca en la tabla client_profile usando el client_id
5. Si encuentra el perfil, lo devuelve con toda su información
6. Si no encuentra el perfil, devuelve un mensaje indicando que no existe perfil

## Notas de Integración

- El sessionId debe corresponder exactamente al campo session_id en la tabla clients
- Las propiedades del perfil se devuelven en formato camelCase (nameCompany, openingHours, etc.)
- Los campos vacíos se devuelven como cadenas vacías en lugar de null
- No es necesario enviar el client_id, ya que se obtiene automáticamente a partir del sessionId

## Ejemplo de Integración en Python

```python
import requests

url = "https://fe09-190-210-38-133.ngrok-free.app/api/business-profile/view"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer 1"
}
params = {
    "sessionId": "mati"
}

response = requests.get(url, headers=headers, params=params)
print(response.status_code)
print(response.json())
```

## Ejemplo de Integración en JavaScript

```javascript
const axios = require('axios');

const url = "https://fe09-190-210-38-133.ngrok-free.app/api/business-profile/view";
const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer 1"
};
const params = {
    sessionId: "mati"
};

axios.get(url, { headers, params })
    .then(response => {
        console.log(response.status);
        console.log(response.data);
    })
    .catch(error => {
        console.error(error);
    });
```

## Consideraciones de Seguridad

- Todas las llamadas al endpoint deben incluir el token de autorización
- El endpoint solo devuelve información del perfil del cliente asociado al sessionId proporcionado
- No se devuelven datos sensibles ni credenciales
- Se utilizan códigos de estado HTTP apropiados para cada situación
- Todos los campos son validados antes de procesar la solicitud

## Casos de Uso

- Obtener información del perfil de negocio para mostrarla en el chatbot
- Verificar si un cliente ya tiene un perfil de negocio configurado
- Mostrar datos de contacto y redes sociales del cliente
- Personalizar respuestas del bot basándose en la información del perfil 