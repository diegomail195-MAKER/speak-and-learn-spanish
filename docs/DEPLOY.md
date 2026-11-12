# Publicar en internet (Supabase + Vercel)

La plataforma usa **Supabase** para la base de datos y los archivos (imágenes, videos, audio) y
**Vercel** para el servidor web. Las dos tienen plan gratuito.

## 1. Supabase

1. En <https://supabase.com/dashboard> crea un proyecto (**New project**). Región: la más cercana
   (por ejemplo *East US*). Guarda la contraseña de la base de datos.
2. Botón **Connect** (arriba) → pestaña **ORMs** o **Connection string**:
   - **Transaction pooler** (puerto **6543**) → será `DATABASE_URL`. Agrégale al final
     `?pgbouncer=true&connection_limit=1`.
   - **Session pooler** (puerto **5432**) → será `DIRECT_URL`.
   - Reemplaza `[YOUR-PASSWORD]` por la contraseña del paso 1.
3. **Project Settings → API** (o **API Keys**):
   - **Project URL** → `SUPABASE_URL`
   - **service_role** (secreta) → `SUPABASE_SERVICE_ROLE_KEY`. Nunca la compartas ni la pegues
     en el chat: solo va en Vercel.
4. No hace falta crear el bucket: la plataforma crea uno privado llamado `media` la primera vez.
5. El plan gratuito acepta archivos de hasta **50 MB**. Para videos más grandes hace falta el plan
   Pro y subir el límite en **Storage → Settings**.

## 2. Vercel

1. En <https://vercel.com> entra con tu cuenta de GitHub.
2. **Add New → Project** → importa `speak-and-learn-spanish`.
3. En **Environment Variables** agrega:

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | Transaction pooler + `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Session pooler |
| `STORAGE_DRIVER` | `supabase` |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role |
| `VIDEO_MAX_MB` | `50` (plan gratuito de Supabase) |

4. **Deploy**. La compilación crea las tablas (`prisma migrate deploy`) y carga las plantillas de
   juegos. Al terminar, Vercel muestra la dirección (`https://….vercel.app`).
5. Abre esa dirección → **Sign up** para crear la cuenta de docente.

Voces naturales y reconocimiento en el servidor son opcionales: agrega después las variables
`TTS_PROVIDER`, `STT_PROVIDER` y la clave de Azure o Google (ver `.env.example`). Sin ellas, la
plataforma usa la voz y el reconocimiento de Chrome.

## Correo para "¿Olvidaste tu contraseña?"

1. Crea una cuenta gratis en <https://resend.com> y en **Domains** agrega `speakandlearnspanish.com`.
   Resend te muestra unos registros DNS: agrégalos en **Vercel → Domains → speakandlearnspanish.com → DNS Records**.
2. En Resend, **API Keys → Create** (permiso *Sending access*).
3. En Vercel agrega `RESEND_API_KEY` (la clave) y
   `EMAIL_FROM` = `Speak & Learn Spanish <no-reply@speakandlearnspanish.com>`, y vuelve a desplegar.

Sin estas variables, la página dice que el restablecimiento por correo todavía no está activado.

## Solo el administrador sube videos

En Vercel agrega `ADMIN_EMAILS` = tu correo de inicio de sesión (si son varios, sepáralos con comas)
y vuelve a desplegar. Solo esas cuentas pueden subir, editar, publicar o borrar videos; los demás
docentes pueden verlos, asignarlos y armar colecciones.

## Buscar imágenes en internet (con filtro infantil)

Puedes usar uno de los dos buscadores o los dos (recomendado): la lupa busca primero en Brave
(imágenes de toda la web, con SafeSearch estricto) y, si Brave no está configurado, falla o no
encuentra nada, busca en Pixabay.

- **Brave Search (resultados de toda la web):** crea una cuenta en
  <https://api-dashboard.search.brave.com>, suscríbete a un plan de **Search** y crea una clave.
  En Vercel agrégala como `BRAVE_SEARCH_API_KEY`. Las imágenes de la web pueden tener derechos de
  autor: úsalas solo en clase.
- **Pixabay (gratis, libres de derechos):** sigue los pasos de abajo.

1. Crea una cuenta gratis en <https://pixabay.com> y abre <https://pixabay.com/api/docs/>: tu clave
   aparece en la sección **Parameters → key** (estando conectado).
2. En Vercel agrega `PIXABAY_API_KEY` con esa clave y vuelve a desplegar.
3. Opcional, filtro extra: una clave de Google Cloud con **Cloud Vision API** activada en
   `GOOGLE_VISION_API_KEY`. Cada imagen se revisa (contenido sexual, violento o subido de tono) y,
   si la revisión falla, la imagen se bloquea.

Siempre activo: palabras prohibidas (español e inglés) en la búsqueda y en las etiquetas, y SafeSearch
estricto de Brave / SafeSearch de Pixabay. La imagen elegida se copia a tu almacenamiento: los estudiantes nunca cargan nada externo.

## Límites conocidos en Vercel

- Las imágenes se suben hasta 4 MB; los videos van directo del navegador a Supabase Storage.
- Los límites de intentos se guardan en la base de datos (tabla `RateLimit`), así que valen para
  todos los servidores de Vercel.
