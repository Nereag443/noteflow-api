# noteflow-api
API REST para la aplicación NoteFlow, construida con Next.js y PostgreSQL (Neon).

## Tecnologías utilizadas

 - [Next.js](https://nextjs.org)
 - [TypeScript](https://www.typescriptlang.org/)
 - [Firebase Admin SDK](https://firebase.google.com)
 - [Neon PostgreSQL](https://neon.com)
 - [AWS S3](https://aws.amazon.com/es/s3/)
 - [Zod](https://zod.dev/)

## Arquitectura
El proyecto sigue el patrón cliente-servidor: la app móvil (cliente) se comunica con esta API (servidor), que es la única con acceso directo a la base de datos PostgreSQL. Cada petición pasa por validación con Zod antes de llegar a la base de datos. Todos los endpoints(excepto `/api/auth`).

```
App móvil (Expo) → API REST (Next.js) → PostgreSQL (Neon)
                        ↕
                   Firebase Auth
                        ↕
                     AWS S3
```

## Estructura del proyecto
```
noteflow-api/
├── app/
│   └── api/                          # Endpoints de la API
│       ├── avatar/
│       │   └── route.ts              # DELETE avatar de S3
│       ├── checklist-items/
│       │   └── [itemId]/
│       │       └── route.ts          # PATCH y DELETE de items
│       ├── checklists/
│       │   ├── [id]/
│       │   │   ├── checklist-items/
│       │   │   │   └── route.ts      # GET y POST items de una checklist
│       │   │   └── route.ts          # GET, PATCH y DELETE de una checklist
│       │   └── route.ts              # GET y POST checklists
│       ├── ideas/
│       │   ├── [id]/
│       │   │   ├── tags/
│       │   │   │   └── route.ts      # GET y POST tags de una idea
│       │   │   └── route.ts          # GET, PATCH y DELETE de una idea
│       │   └── route.ts              # GET y POST ideas
│       ├── notes/
│       │   ├── [id]/
│       │   │   └── route.ts          # GET, PATCH y DELETE de una nota
│       │   └── route.ts              # GET y POST notas
│       ├── tags/
│       │    └── [tagId]/
│       │        └── route.ts          # DELETE de un tag
│       └── upload/
│           └── route.ts               # POST para generar presigned URL de S3
├── docs/
│   ├── aws-s3-flujo-md
│   ├── backend-teoria.md
│   └── seguridad-api.md
├── lib/
│   ├── auth.ts                        # Verificación de tokens Firebase
│   ├── db.ts                          # Módulo de conexión a PostgreSQL
│   └── firebase-admin.ts              # Inicialización de Firebase Admin SDK
└── sql/
    ├── schema.sql
    └── queries.sql
```

## Instalación
1. Clona el repositorio:
```bash
git clone https://github.com/Nereag443/noteflow-api.git
```
 
2. Instala las dependencias:
```bash
npm install
```
 
3. Crea el archivo `.env.local` con tus variables de entorno:
```bash
DATABASE_URL=postgresql://usuario:contraseña@host/noteflow-db
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_CLIENT_EMAIL=tu_client_email
FIREBASE_PRIVATE_KEY=tu_private_key
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_REGION=eu-west-1
AWS_BUCKET_NAME=noteflow-avatars
```
 
4. Ejecuta el schema en la consola SQL de Neon:
```bash
# Copia el contenido de sql/schema.sql y ejecútalo en Neon
```
 
5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Autenticación
Todos los endpoints excepto `/api/auth/register` y `/api/auth/login` requieren un token de Firebase en el header de cada petición:

```
Authorization: Bearer <firebase_token>
```

El token se obtiene en la app móvil con Firebase Auth y se verifica en el backend con Firebase Admin SDK. Sin token o con token inválido, la API devuelve `401 Unauthorized`:

```json
{ "error": "No autorizado" }
```

## Endpoints principales

### Autenticación
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |

### Avatar
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/upload` | Generar presigned URL para subir imagen a S3 |
| DELETE | `/api/avatar` | Eliminar imagen de S3 |

### Notas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notes` | Obtener todas las notas |
| POST | `/api/notes` | Crear una nota |
| GET | `/api/notes/[id]` | Obtener una nota por ID |
| PATCH | `/api/notes/[id]` | Actualizar una nota |
| DELETE | `/api/notes/[id]` | Eliminar una nota |
 
### Checklists
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/checklists` | Obtener todas las checklists |
| POST | `/api/checklists` | Crear una checklist |
| GET | `/api/checklists/[id]` | Obtener una checklist por ID |
| PATCH | `/api/checklists/[id]` | Actualizar una checklist |
| DELETE | `/api/checklists/[id]` | Eliminar una checklist |
| GET | `/api/checklists/[id]/checklist-items` | Obtener items de una checklist |
| POST | `/api/checklists/[id]/checklist-items` | Añadir un item |
 
### Ideas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ideas` | Obtener todas las ideas |
| POST | `/api/ideas` | Crear una idea |
| GET | `/api/ideas/[id]` | Obtener una idea por ID |
| PATCH | `/api/ideas/[id]` | Actualizar una idea |
| DELETE | `/api/ideas/[id]` | Eliminar una idea |
| GET | `/api/ideas/[id]/tags` | Obtener tags de una idea |
| POST | `/api/ideas/[id]/tags` | Añadir un tag |
 
### Items y tags
| Método | Ruta | Descripción |
|--------|------|-------------|
| PATCH | `/api/checklist-items/[itemId]` | Actualizar un item |
| DELETE | `/api/checklist-items/[itemId]` | Eliminar un item |
| DELETE | `/api/tags/[tagId]` | Eliminar un tag |

## Manejo de errores
La API devuelve errores normalizados en formato JSON con el código HTTP correspondiente.

🔴 **400 - Bad Request** → Error de validación o datos incorrectos  
Ejemplo: Crear una nota con un título de menos de 3 caracteres  
Respuesta:
```json
{
    "errors": [{ "message": "String must contain at least 3 character(s)" }]
}
```
🔴 **401 - Unauthorized** → Token ausente o inválido  
Ejemplo: Llamar a cualquier endpoint sin el header Authorization  
Respuesta:
```json
{
    "error": "No autorizado"
}
```

🔴 **404 - Not Found** → Recurso inexistente  
Ejemplo: Editar o eliminar una nota que no existe  
Respuesta:
```json
{
    "error": "Nota no encontrada"
}
```

🔴 **500 - Internal Server Error** → Error inesperado del servidor  
Ejemplo: Error de conexión con la base de datos  
Respuesta:
```json
{
    "error": "Error interno"
}
```

## Variables de entorno
| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de PostgreSQL (Neon) |
| `FIREBASE_PROJECT_ID` | ID del proyecto de Firebase |
| `FIREBASE_CLIENT_EMAIL` | Email del service account de Firebase |
| `FIREBASE_PRIVATE_KEY` | Clave privada del service account de Firebase |
| `AWS_ACCESS_KEY_ID` | Access key del usuario IAM de AWS |
| `AWS_SECRET_ACCESS_KEY` | Secret access key del usuario IAM de AWS |
| `AWS_REGION` | Región del bucket S3 (ej. `eu-west-1`) |
| `AWS_BUCKET_NAME` | Nombre del bucket S3 |
 
Copia `.env.example` a `.env.local` y rellena los valores.

## Testing con Postman
Se ha utilizado Postman para comprobar todos los endpoints de la API durante el desarrollo.

Se han probado los endpoints con:
- Registrar un usuario nuevo → `201 Created`
- Iniciar sesión con credenciales incorrectas → `401 Unauthorized`
- Crear una nota con todos los campos correctos → `201 Created`
- Crear una checklist con prioridad → `201 Created`
- Crear una idea con tags → `201 Created`
- Obtener una nota con ID inexistente → `404 Not Found`
- Editar una nota existente → `200 OK`
- Archivar una nota → `200 OK`
- Eliminar una nota existente → `204 No Content`
- Añadir un item a una checklist → `201 Created`
- Añadir un tag a una idea → `201 Created`
- Eliminar un tag → `204 No Content`

## Documentación
La documentación detallada del backend se puede encontrar en la carpeta [`/docs`](/docs/).

- [`aws-s3-flujo.md`](/docs/aws-s3-flujo.md) — diagrama de flujo de subida de imágenes a AWS S3
- [`backend-teoria.md`](/docs/backend-teoria.md) — arquitectura, REST, SQL, JOINs y diagrama ER
- [`seguridad-api.md`](/docs/seguridad-api.md) — SQL injection, consultas parametrizadas y variables de entorno

## Notas
- El schema usa `ON DELETE CASCADE` — al eliminar una nota se eliminan automáticamente sus items y tags
- Las fechas se devuelven en formato ISO 8601 (`created_at`, `updated_at`)
- Los campos opcionales en PATCH usan `COALESCE` para no sobreescribir valores existentes
- La autenticación usa Firebase Admin SDK para verificar tokens en el servidor
- Las imágenes se suben directamente a S3 desde el móvil usando presigned URLs