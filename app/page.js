"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const BUCKET = "fotos-familia";

// Categorías del supermercado, en el orden en que solemos recorrer los pasillos
const CATEGORIAS = [
  "Frutería y verdura",
  "Carne y pescado",
  "Lácteos y huevos",
  "Panadería",
  "Despensa",
  "Congelados",
  "Bebidas",
  "Limpieza",
  "Higiene",
  "Otros",
];

export default function App() {
  const [session, setSession] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [nombre, setNombre] = useState(null);
  const [autorizado, setAutorizado] = useState(null); // null = comprobando
  const [vista, setVista] = useState("lista");

  // Comprobar la sesión al arrancar y escuchar los cambios
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargandoSesion(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Cuando hay sesión, comprobar que el correo pertenece a la familia
  useEffect(() => {
    if (!session) {
      setAutorizado(null);
      setNombre(null);
      return;
    }
    const email = (session.user.email || "").toLowerCase();
    supabase
      .from("family_members")
      .select("name")
      .eq("email", email)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNombre(data.name);
          setAutorizado(true);
        } else {
          setAutorizado(false);
        }
      });
  }, [session]);

  if (cargandoSesion) {
    return <Pantalla>Un momento...</Pantalla>;
  }

  if (!session) {
    return <Login />;
  }

  if (autorizado === false) {
    return (
      <Pantalla>
        <div className="max-w-sm text-center">
          <h1 className="font-display text-2xl text-tinta mb-3">
            Este rincón es solo de la familia
          </h1>
          <p className="text-suave mb-6">
            Has entrado con <b>{session.user.email}</b>, pero ese correo todavía
            no está en la lista de la familia. Pídele a Alberto que lo añada.
          </p>
          <BotonSalir />
        </div>
      </Pantalla>
    );
  }

  if (autorizado === null) {
    return <Pantalla>Comprobando que eres de la familia...</Pantalla>;
  }

  return (
    <div className="min-h-screen">
      <Cabecera nombre={nombre} vista={vista} setVista={setVista} />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        {vista === "lista" && <Lista nombre={nombre} />}
        {vista === "historial" && <Historial />}
        {vista === "fotos" && <Fotos nombre={nombre} />}
      </main>
    </div>
  );
}

/* ------------------------- Pantallas auxiliares ------------------------- */

function Pantalla({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-suave font-cuerpo">
      {children}
    </div>
  );
}

function BotonSalir({ className = "" }) {
  return (
    <button
      onClick={() => supabase.auth.signOut()}
      className={`text-sm text-suave underline underline-offset-4 hover:text-coral ${className}`}
    >
      Salir
    </button>
  );
}

/* ------------------------------ Login ------------------------------ */

function Login() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    if (!email.trim()) return;
    setEnviando(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setEnviando(false);
    if (error) {
      setError("No hemos podido enviar el enlace. Inténtalo otra vez.");
    } else {
      setEnviado(true);
    }
  }

  return (
    <Pantalla>
      <div className="w-full max-w-sm">
        <p className="font-nota text-3xl text-coral text-center mb-1">en casa</p>
        <h1 className="font-display text-3xl text-tinta text-center mb-2">
          La compra de casa
        </h1>
        <p className="text-center text-suave mb-8">
          La lista de la compra de la familia, siempre a mano.
        </p>

        {enviado ? (
          <div className="bg-papel rounded-2xl shadow-nota p-6 text-center">
            <h2 className="font-display text-xl text-tinta mb-2">
              Te hemos enviado un enlace
            </h2>
            <p className="text-suave">
              Abre el correo que acabamos de mandar a <b>{email}</b> y pulsa el
              enlace para entrar. No hace falta contraseña.
            </p>
          </div>
        ) : (
          <div className="bg-papel rounded-2xl shadow-nota p-6">
            <label className="block text-sm font-semibold text-tinta mb-2">
              Tu correo
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
              placeholder="nombre@correo.com"
              className="w-full rounded-xl border border-cuerda bg-crema px-4 py-3 text-tinta placeholder:text-suave/60 mb-4"
            />
            <button
              onClick={entrar}
              disabled={enviando}
              className="w-full rounded-xl bg-coral py-3 font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Entrar con mi correo"}
            </button>
            {error && <p className="mt-3 text-sm text-coral">{error}</p>}
            <p className="mt-4 text-xs text-suave text-center">
              Recibirás un enlace de un solo uso. Solo pueden entrar los correos
              de la familia.
            </p>
          </div>
        )}
      </div>
    </Pantalla>
  );
}

/* ------------------------------ Cabecera ------------------------------ */

function Cabecera({ nombre, vista, setVista }) {
  const tabs = [
    { id: "lista", texto: "La lista" },
    { id: "historial", texto: "Ya comprado" },
    { id: "fotos", texto: "Fotos" },
  ];
  return (
    <header className="sticky top-0 z-10 border-b border-cuerda/70 bg-crema/85 backdrop-blur">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-nota text-xl leading-none text-coral">
              Hola, {nombre}
            </p>
            <h1 className="font-display text-2xl text-tinta leading-tight">
              La compra de casa
            </h1>
          </div>
          <BotonSalir className="mb-1" />
        </div>
        <nav className="mt-3 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setVista(t.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                vista === t.id
                  ? "bg-tinta text-crema"
                  : "text-suave hover:bg-cuerda/50"
              }`}
            >
              {t.texto}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------ Lista ------------------------------ */

function Lista({ nombre }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: true });
    setItems(data || []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
    // Sincronización en tiempo real entre todos los dispositivos
    const canal = supabase
      .channel("items-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        () => cargar()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [cargar]);

  async function anadir() {
    const nombreItem = texto.trim();
    if (!nombreItem) return;
    setGuardando(true);
    await supabase.from("items").insert({
      name: nombreItem,
      quantity: cantidad.trim() || null,
      category: categoria,
      done: false,
      added_by: nombre,
    });
    setTexto("");
    setCantidad("");
    setGuardando(false);
  }

  async function alternar(item) {
    await supabase.from("items").update({ done: !item.done }).eq("id", item.id);
  }

  async function borrar(item) {
    await supabase.from("items").delete().eq("id", item.id);
  }

  async function cerrarCompra() {
    const comprados = items.filter((i) => i.done);
    if (comprados.length === 0) return;
    const resumen = comprados.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      category: i.category,
    }));
    await supabase.from("shopping_history").insert({
      items: resumen,
      completed_by: nombre,
    });
    await supabase
      .from("items")
      .delete()
      .in(
        "id",
        comprados.map((i) => i.id)
      );
  }

  const total = items.length;
  const hechos = items.filter((i) => i.done).length;
  const porCategoria = CATEGORIAS.map((cat) => ({
    cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      {/* Añadir producto */}
      <div className="bg-papel rounded-2xl shadow-nota p-4 mb-5">
        <div className="flex gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && anadir()}
            placeholder="¿Qué falta en casa?"
            className="flex-1 rounded-xl border border-cuerda bg-crema px-4 py-2.5 text-tinta placeholder:text-suave/60"
          />
          <input
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && anadir()}
            placeholder="Cant."
            className="w-20 rounded-xl border border-cuerda bg-crema px-3 py-2.5 text-tinta placeholder:text-suave/60"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="flex-1 rounded-xl border border-cuerda bg-crema px-3 py-2.5 text-tinta"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={anadir}
            disabled={guardando || !texto.trim()}
            className="rounded-xl bg-coral px-5 py-2.5 font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
          >
            Añadir
          </button>
        </div>
      </div>

      {/* Estado de la lista */}
      {cargando ? (
        <p className="text-center text-suave py-10">Cargando la lista...</p>
      ) : total === 0 ? (
        <div className="text-center py-12">
          <p className="font-nota text-2xl text-coral mb-1">Todo en orden</p>
          <p className="text-suave">
            La lista está vacía. Añade lo que falte en casa.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm text-suave">
              {hechos} de {total} en el carro
            </p>
            {hechos > 0 && (
              <button
                onClick={cerrarCompra}
                className="rounded-full bg-oliva px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Cerrar la compra ({hechos})
              </button>
            )}
          </div>

          <div className="space-y-5">
            {porCategoria.map((grupo) => (
              <section key={grupo.cat}>
                <h3 className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-suave">
                  {grupo.cat}
                </h3>
                <ul className="overflow-hidden rounded-2xl bg-papel shadow-nota">
                  {grupo.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 border-b border-cuerda/60 px-4 py-3 last:border-0"
                    >
                      <button
                        onClick={() => alternar(item)}
                        aria-label={item.done ? "Desmarcar" : "Marcar como comprado"}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                          item.done
                            ? "border-oliva bg-oliva text-white"
                            : "border-cuerda"
                        }`}
                      >
                        {item.done && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M5 13l4 4L19 7"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`block truncate ${
                            item.done
                              ? "text-suave line-through"
                              : "text-tinta"
                          }`}
                        >
                          {item.name}
                          {item.quantity && (
                            <span className="ml-2 text-sm text-suave">
                              {item.quantity}
                            </span>
                          )}
                        </span>
                        {item.added_by && (
                          <span className="text-xs text-suave/80">
                            lo apuntó {item.added_by}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => borrar(item)}
                        aria-label="Quitar de la lista"
                        className="shrink-0 text-suave/60 transition hover:text-coral"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M6 6l12 12M18 6L6 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ Historial ------------------------------ */

function Historial() {
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase
      .from("shopping_history")
      .select("*")
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        setCompras(data || []);
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return <p className="text-center text-suave py-10">Cargando...</p>;
  }

  if (compras.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-nota text-2xl text-coral mb-1">Aún nada</p>
        <p className="text-suave">
          Cuando cierres una compra, quedará guardada aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {compras.map((compra) => {
        const fecha = new Date(compra.completed_at).toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        const lista = Array.isArray(compra.items) ? compra.items : [];
        return (
          <article
            key={compra.id}
            className="rounded-2xl bg-papel shadow-nota p-4"
          >
            <header className="mb-2 flex items-baseline justify-between">
              <h3 className="font-display text-lg capitalize text-tinta">
                {fecha}
              </h3>
              <span className="text-xs text-suave">
                {lista.length} producto{lista.length === 1 ? "" : "s"}
              </span>
            </header>
            {compra.completed_by && (
              <p className="mb-2 text-sm text-suave">
                Cerró la compra {compra.completed_by}
              </p>
            )}
            <ul className="flex flex-wrap gap-1.5">
              {lista.map((it, i) => (
                <li
                  key={i}
                  className="rounded-full bg-crema px-3 py-1 text-sm text-tinta"
                >
                  {it.name}
                  {it.quantity ? ` (${it.quantity})` : ""}
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

/* ------------------------------ Fotos ------------------------------ */

function Fotos({ nombre }) {
  const [fotos, setFotos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const cargar = useCallback(async () => {
    const { data: filas } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    const rows = filas || [];
    if (rows.length === 0) {
      setFotos([]);
      setCargando(false);
      return;
    }
    // Enlaces firmados temporales (las fotos son privadas, solo para la familia)
    const { data: urls } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        rows.map((r) => r.path),
        3600
      );
    const mapa = {};
    (urls || []).forEach((u) => {
      if (u && u.path) mapa[u.path] = u.signedUrl;
    });
    setFotos(rows.map((r) => ({ ...r, url: mapa[r.path] })));
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function subir(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSubiendo(true);
    setError("");
    const limpio = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${Date.now()}-${limpio}`;
    const { error: errSubida } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });
    if (errSubida) {
      setError("No se pudo subir la foto. Inténtalo de nuevo.");
      setSubiendo(false);
      return;
    }
    await supabase.from("photos").insert({ path, uploaded_by: nombre });
    if (inputRef.current) inputRef.current.value = "";
    setSubiendo(false);
    cargar();
  }

  async function borrar(foto) {
    await supabase.storage.from(BUCKET).remove([foto.path]);
    await supabase.from("photos").delete().eq("id", foto.id);
    cargar();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-suave text-sm">Recuerdos de la familia</p>
        <button
          onClick={() => inputRef.current && inputRef.current.click()}
          disabled={subiendo}
          className="rounded-full bg-mar px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          {subiendo ? "Subiendo..." : "Añadir foto"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={subir}
          className="hidden"
        />
      </div>

      {error && <p className="mb-4 text-sm text-coral">{error}</p>}

      {cargando ? (
        <p className="text-center text-suave py-10">Cargando fotos...</p>
      ) : fotos.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-nota text-2xl text-coral mb-1">El álbum vacío</p>
          <p className="text-suave">
            Sube la primera foto de la familia para decorar la nevera.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {fotos.map((foto, i) => (
            <figure
              key={foto.id}
              className={`group relative rounded-sm bg-papel p-2 pb-6 shadow-polaroid ${
                i % 2 === 0 ? "rotate-1.5" : "rotate-2.5"
              }`}
            >
              {foto.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto.url}
                  alt={foto.caption || "Foto de familia"}
                  className="aspect-square w-full rounded-sm object-cover"
                />
              ) : (
                <div className="aspect-square w-full rounded-sm bg-cuerda" />
              )}
              {foto.uploaded_by && (
                <figcaption className="absolute bottom-1 left-0 right-0 text-center font-nota text-base text-tinta">
                  {foto.uploaded_by}
                </figcaption>
              )}
              <button
                onClick={() => borrar(foto)}
                aria-label="Quitar foto"
                className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-coral opacity-0 shadow transition group-hover:opacity-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
