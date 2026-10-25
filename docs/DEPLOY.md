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

## Límites conocidos en Vercel

- Las imágenes se suben hasta 4 MB; los videos van directo del navegador a Supabase Storage.
- El límite de intentos de inicio de sesión se guarda en memoria de cada servidor; en Vercel es
  menos estricto que en un solo servidor.
