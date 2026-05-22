# noteflow-api
API REST para la aplicación NoteFlow, construida con Next.js y PostgreSQL (Neon).

## Arquitectura
El proyecto sigue el patrón cliente-servidor: la app móvil (cliente) se comunica con esta API (servidor), que es la única con acceso directo a la base de datos PostgreSQL. Cada petición pasa por validación con Zod antes de llegar a la base de datos.
```
App móvil (Expo) → API REST (Next.js) → PostgreSQL (Neon)
```

## Descripción de carpetas
```
noteflow-api/
├── app/
│   └── api/                         # Endpoints de la API
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
│       └── tags/
│           └── [tagId]/
│               └── route.ts          # DELETE de un tag
├── docs/
│   ├── backend-teoria.md
│   └── seguridad-api.md
├── lib/
│   └── db.ts                         # Módulo de conexión a PostgreSQL
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
 
3. Crea el archivo `.env.local` con tu connection string de Neon:
```bash
DATABASE_URL=postgresql://usuario:contraseña@host/noteflow-db
```
 
4. Ejecuta el schema en la consola SQL de Neon:
```bash
# Copia el contenido de sql/schema.sql y ejecútalo en Neon
```
 
5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Endpoints principales
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
 
Copia `.env.example` a `.env.local` y rellena los valores.

## Testing con Postman
Se ha utilizado Postman para comprobar todos los endpoints de la API durante el desarrollo.

Se han probado los endpoints con:
- Crear una nota con todos los campos correctos → `201 Created`
- Crear una nota con título de menos de 3 caracteres → `400 Bad Request`
- Crear una checklist con prioridad → `201 Created`
- Crear una idea con tags → `201 Created`
- Obtener todas las notas → `200 OK`
- Obtener una nota por ID → `200 OK`
- Obtener una nota con ID inexistente → `404 Not Found`
- Editar una nota existente → `200 OK`
- Editar una nota que no existe → `404 Not Found`
- Archivar una nota → `200 OK`
- Eliminar una nota existente → `204 No Content`
- Añadir un item a una checklist → `201 Created`
- Marcar un item como completado → `200 OK`
- Eliminar un item de checklist → `204 No Content`
- Añadir un tag a una idea → `201 Created`
- Eliminar un tag → `204 No Content`

## Documentación
La documentación detallada del backend se puede encontrar en la carpeta [`/docs`](/docs/).

## Notas
- El schema usa `ON DELETE CASCADE` — al eliminar una nota se eliminan automáticamente sus items y tags
- Las fechas se devuelven en formato ISO 8601 (`created_at`, `updated_at`)
- Los campos opcionales en PATCH usan `COALESCE` para no sobreescribir valores existentes