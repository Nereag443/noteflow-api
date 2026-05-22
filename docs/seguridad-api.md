# ¿Qué es SQL injection?
La inyección SQL ocurre cuando la entrada del usuario se concatena directamente en una consulta SQL. Un atacante puede manipular la consulta para acceder a datos que no debería ver, modificar datos, o incluso destruir tablas enteras.

## Ejemplo vulnerable
```typescript
const title = req.body.title;
// Si el usuario envía: "'; DROP TABLE notes;--"
// La query resultante destruye la tabla entera
const query = "SELECT * FROM notes WHERE title = '" + title + "'";
```
```sql
-- Si el usuario envía '; DROP TABLE notes;-- como título, la query resultante sería:
SELECT * FROM notes WHERE title = ''; DROP TABLE notes;--'
-- Esto ejecuta dos sentencias: primero el SELECT, luego destruye la tabla notes.
```

### Otro ejemplo
```sql
-- si el usuario envía ' OR '1'='1, la query devuelve todas las filas de la tabla:
SELECT * FROM notes WHERE title = '' OR '1'='1'
-- Solución: consultas parametrizadas
```
Las consultas parametrizadas envían la estructura de la consulta y los valores por separado. La base de datos precompila el SQL y trata los parámetros estrictamente como datos, nunca como código SQL ejecutable.
```typescript
const query = "SELECT * FROM notes WHERE title = $1";
await db.query(query, [req.body.title]);
```
En NoteFlow todas las consultas usan parámetros `($1, $2, etc.)` a través de la función query de `lib/db.ts`:
```typescript
// Ejemplo de NoteFlow — crear una nota
const [note] = await query(
    'INSERT INTO notes (title, type, content, color) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, type, content, color]
);
```
Los valores se pasan como array separado — nunca concatenados en el string SQL.

## Variables de entorno
Las variables de entorno son valores de configuración que se almacenan fuera del código fuente. Se usan para separar la configuración del entorno (desarrollo, producción) del código de la aplicación.
Por qué el connection string nunca debe aparecer en el código
El connection string de PostgreSQL contiene las credenciales de acceso a la base de datos:
```txt
postgresql://usuario:contraseña@host/base_de_datos
```
Si este valor estuviese en el código:

Cualquiera con acceso al repositorio tendría acceso completo a la base de datos
Git guarda el historial — aunque lo elimines del código, seguiría en los commits anteriores
Los binarios compilados pueden descompilarse y exponer las credenciales

Cómo se usan en NoteFlow
El connection string se guarda en .env.local, que está en .gitignore y nunca se sube al repositorio:
```bash
bash# .env.local (nunca se sube a git)
DATABASE_URL=postgresql://usuario:contraseña@host/noteflow-db
```
Se accede en el código a través de process.env:
```typescript
// lib/db.ts
const sql = neon(process.env.DATABASE_URL!);
```
En producción (Vercel), las variables de entorno se configuran en el panel de control de la plataforma, nunca en el código.
El repositorio incluye un .env.example con las claves vacías para que otros desarrolladores sepan qué variables necesitan configurar:
```bash
bash# .env.example (sí se sube a git)
DATABASE_URL=
```

## Validación con Zod
Además de las consultas parametrizadas, NoteFlow valida todos los datos de entrada con Zod antes de ejecutar cualquier query. Esto garantiza que los datos tienen el formato correcto y previene errores inesperados:
```typescript
const noteSchema = z.object({
    title: z.string().min(3),
    type: z.enum(['note', 'checklist', 'idea']),
    content: z.string().optional(),
});

const result = noteSchema.safeParse(body);
if (!result.success) {
    return NextResponse.json({ errors: result.error.issues }, { status: 400 });
}
```
Si los datos no son válidos, la API devuelve un 400 antes de llegar a la base de datos.