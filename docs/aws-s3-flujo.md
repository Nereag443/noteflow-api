# Flujo de subida de imágenes a AWS S3

## Diagrama de flujo 

```mermaid
flowchart TD
    A[Usuario pulsa 'Subir foto'] --> B[expo-image-picker abre la galería]
    B --> C{Usuario selecciona imagen?}
    C -- No --> D[Cancelar]
    C -- Sí --> E[App obtiene URI local de la imagen]
    E --> F[App pide Presigned URL al backend\nPOST /api/upload]
    F --> G{Token Firebase válido?}
    G -- No --> H[401 Unauthorized]
    G -- Sí --> I[Backend genera URL firmada de S3\nválida durante 60 segundos]
    I --> J[Backend devuelve signedUrl y publicUrl]
    J --> K[App convierte URI local a Blob]
    K --> L[App sube imagen directamente a S3\nPUT signedUrl con el Blob]
    L --> M[S3 almacena la imagen]
    M --> N[App guarda publicUrl en Firestore\nupdateDoc users/userId]
    N --> O[App actualiza el store de Zustand\nsetStoreAvatarUrl publicUrl]
    O --> P[Componente Image renderiza\nla imagen desde la URL de AWS]
    P --> Q[Imagen visible en perfil y header]
```

## Descripción de cada paso

**1. Selección de imagen**  
El usuario pulsa el avatar en la pantalla de perfil. `expo-image-picker` solicita permisos de galería al sistema operativo y muestra el selector de imágenes nativo.
 
**2. Obtención de Presigned URL**  
La app envía una petición `POST /api/upload` al backend con el nombre del archivo y el tipo de contenido. El backend verifica el token de Firebase y g
enera una URL firmada criptográficamente por AWS, válida durante 60 segundos. Esta URL permite subir un archivo directamente a S3 sin exponer las credenciales de AWS.
 
**3. Subida directa a S3**  
La app convierte la URI local de la imagen a un Blob y lo sube directamente a S3 usando la URL firmada con el método `PUT`. El archivo nunca pasa por el backend — va directo del dispositivo a S3. Esto reduce la carga del servidor y mejora el rendimiento.
 
**4. Persistencia de la URL**  
Una vez subida la imagen, S3 genera una URL pública permanente. La app guarda esta URL en Firestore en el documento del usuario (`users/{userId}.avatarUrl`).
 
**5. Actualización del estado**  
La app actualiza el store de Zustand con la nueva URL, lo que provoca que todos los componentes que leen `avatarUrl` (perfil y header) se rerenderizen automáticamente mostrando la nueva imagen.
 
**6. Renderizado**  
El componente `Image` de React Native carga la imagen desde la URL de AWS S3:
 
```tsx
<Image 
    source={{ uri: avatarUrl }} 
    style={{ width: 96, height: 96, borderRadius: 999 }} 
/>
```

## Por qué Presigned URLs y no subida directa desde el backend
 
Subir la imagen al backend y luego al S3 tendría dos problemas:
- **Rendimiento** — la imagen viaja dos veces por la red (móvil → backend → S3)
- **Límites de Vercel** — las funciones serverless tienen un límite de tamaño de payload
Con Presigned URLs la imagen va directamente del dispositivo a S3, y el backend solo genera la URL firmada (operación ligera).