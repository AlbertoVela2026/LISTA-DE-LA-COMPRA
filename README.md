# La compra de casa

La lista de la compra de la familia: compartida entre todos, con sincronización
al instante, historial de compras hechas y fotos de familia. Montada sobre
**Supabase** (base de datos, acceso y fotos), **GitHub** (el código) y
**Vercel** (la web, siempre disponible).

Esta guía está pensada para seguirla de principio a fin sin prisa. Cada bloque
es un paso. Hay tres cosas que solo puedes hacer tú porque van con tus cuentas:
crear el proyecto de Supabase, el repositorio de GitHub y el despliegue en
Vercel. El resto ya está hecho.

---

## Qué vas a montar

```
   Móviles y Mac de la familia
              │
        (la web en Vercel)
              │
         Supabase
   ┌──────────┼───────────┐
  Acceso   Base de datos  Fotos
 (correo)   (la lista)   (privadas)
```

---

## Paso 1 · Crear el proyecto en Supabase

1. Entra en https://supabase.com y crea una cuenta (o inicia sesión).
2. Pulsa **New project**. Ponle un nombre (por ejemplo, `compra-casa`),
   elige una contraseña para la base de datos y la región más cercana
   (Frankfurt o París van bien desde Menorca). Crea el proyecto.
3. Espera un par de minutos a que termine de prepararse.

## Paso 2 · Crear las tablas y la seguridad

1. En Supabase, menú lateral → **SQL Editor** → **New query**.
2. Abre el archivo `supabase/schema.sql` de este proyecto, **edita los correos
   de la familia** del final (pon los reales, en minúsculas) y copia **todo** el
   contenido en el editor.
3. Pulsa **Run**. Si todo va bien, verás "Success".

Esto crea la lista, el historial, las fotos, el control de acceso (solo entran
los correos de la familia) y la sincronización en tiempo real.

## Paso 3 · Apuntar las dos claves de Supabase

1. Menú lateral → **Project Settings** → **API**.
2. Copia y guarda dos datos, los necesitarás en Vercel:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public** key (una clave larga; la "anon", no la "service_role")

> La clave `service_role` **nunca** se usa aquí ni se sube a ningún sitio.

## Paso 4 · Configurar el acceso por correo

1. Menú lateral → **Authentication** → **Sign In / Providers** → comprueba que
   **Email** está activado.
2. Menú lateral → **Authentication** → **URL Configuration**:
   - En **Site URL** pondrás la dirección de Vercel cuando la tengas
     (Paso 7). De momento puedes dejar `http://localhost:3000`.
   - En **Redirect URLs** añade también esa misma dirección.
   - Volverás aquí en el Paso 7 para poner la dirección definitiva.

---

## Paso 5 · Subir el código a GitHub

1. Crea una cuenta en https://github.com si no la tienes.
2. Crea un repositorio nuevo (botón **New**), por ejemplo `compra-casa`.
   Déjalo **privado**.
3. Sube esta carpeta. La forma más cómoda desde el Mac, en la Terminal,
   dentro de la carpeta del proyecto:

   ```bash
   git init
   git add .
   git commit -m "Primera versión de la compra de casa"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/compra-casa.git
   git push -u origin main
   ```

   (Sustituye `TU-USUARIO` por tu usuario de GitHub.)

> El archivo `.gitignore` ya evita que se suban tus claves y `node_modules`.

---

## Paso 6 · Desplegar en Vercel

1. Entra en https://vercel.com y crea la cuenta **con tu GitHub** (botón
   "Continue with GitHub").
2. **Add New → Project** y elige el repositorio `compra-casa`.
3. Antes de desplegar, abre **Environment Variables** y añade estas dos
   (las del Paso 3):

   | Nombre                            | Valor                                  |
   |-----------------------------------|----------------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`        | tu Project URL de Supabase             |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | tu clave anon public de Supabase       |

4. Pulsa **Deploy**. En un minuto tendrás una dirección tipo
   `https://compra-casa.vercel.app`.

## Paso 7 · Cerrar el círculo del acceso

1. Copia la dirección que te ha dado Vercel.
2. Vuelve a Supabase → **Authentication** → **URL Configuration** y pon esa
   dirección en **Site URL** y en **Redirect URLs**. Guarda.

Esto hace que el enlace que llega por correo lleve de vuelta a la app correcta.

---

## Ya está · Cómo se usa

1. Cada miembro de la familia entra en la dirección de Vercel.
2. Escribe su correo (el que apuntaste en `family_members`) y pulsa entrar.
3. Le llega un correo con un enlace; al pulsarlo, queda dentro. No hay
   contraseñas y la sesión se queda guardada en ese dispositivo.

**La lista** se actualiza al instante en todos los móviles a la vez. Marca lo
que vas echando al carro y, al terminar, pulsa **Cerrar la compra**: lo
comprado se guarda en **Ya comprado** y la lista queda limpia para la próxima.
En **Fotos** podéis ir colgando recuerdos de la familia.

## Añadir o quitar a alguien de la familia

Supabase → **Table Editor** → `family_members` → **Insert row** con el correo
(en minúsculas) y el nombre. Para quitar a alguien, borra su fila.

---

## Probarlo antes en el Mac (opcional)

Si quieres verlo en local antes de desplegar:

```bash
npm install
cp .env.local.example .env.local   # y rellena las dos claves
npm run dev
```

Y abre http://localhost:3000

---

## Notas

- Las fotos son **privadas**: se guardan en un almacén cerrado y la app las
  muestra con enlaces temporales. Nadie de fuera puede verlas.
- Todo el acceso está limitado a los correos de `family_members`. Aunque
  alguien diera con la dirección, sin estar en esa lista no ve ni cambia nada.
- Para cambiar textos, colores o categorías: las categorías están al principio
  de `app/page.js`; los colores, en `tailwind.config.js`.
```
