import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";

const ROADMAP_STORAGE_KEY = "meli_hub_roadmap_progreso";

export const INITIAL_ROADMAP_PHASES = [
  {
    id: "fase-1",
    titulo: "Fase 1: Cimientos y Configuración Base",
    descripcion: "Estructura limpia, variables de entorno y conexión con Google Firebase",
    icon: "Layers",
    color: "from-blue-500 to-indigo-600",
    tareas: [
      {
        id: "1-1",
        titulo: "Limpieza del template anterior y setup base",
        detalle: "Se eliminaron dependencias y código residual del proyecto duplicado, dejando una base moderna con React 19, Tailwind y Vite.",
        completada: true,
        requiereAccionManual: false
      },
      {
        id: "1-2",
        titulo: "Crear proyecto en Consola de Firebase",
        detalle: "Crear un proyecto nuevo en console.firebase.google.com y agregar una aplicación Web para obtener tus credenciales.",
        completada: true,
        requiereAccionManual: true,
        ayuda: "Andá a Firebase Console -> 'Agregar proyecto' -> Nombralo 'meli-afiliados' -> Crear aplicación Web (ícono </>).",
        enlaces: [
          { texto: "Consola de Firebase", url: "https://console.firebase.google.com/" }
        ]
      },
      {
        id: "1-3",
        titulo: "Cargar credenciales en archivo .env",
        detalle: "Copiar las claves generadas por Firebase en el archivo .env de la raíz del proyecto.",
        completada: true,
        requiereAccionManual: true,
        ayuda: "Abrí el archivo .env y pegá VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.",
        enlaces: [
          { texto: "Ver Configuración de Tus Apps", url: "https://console.firebase.google.com/project/meli-afiliados/settings/general" }
        ]
      },
      {
        id: "1-4",
        titulo: "Test de conexión en vivo con Firestore",
        detalle: "Crear la base de datos Firestore Database en la consola de Firebase y luego validar la conexión acá.",
        completada: true,
        requiereAccionManual: true,
        accionTest: "testFirestore",
        enlaces: [
          { texto: "Abrir Base Firestore", url: "https://console.firebase.google.com/project/meli-afiliados/firestore" }
        ]
      }
    ]
  },
  {
    id: "fase-2",
    titulo: "Fase 2: Seguridad y Autenticación",
    descripcion: "Protección del panel de administración y reglas de lectura/escritura",
    icon: "ShieldCheck",
    color: "from-emerald-500 to-teal-600",
    tareas: [
      {
        id: "2-1",
        titulo: "Habilitar Firebase Authentication",
        detalle: "Activar el proveedor de Google o Correo/Contraseña en la consola de Firebase.",
        completada: true,
        requiereAccionManual: true,
        ayuda: "En Firebase Console -> Compilación -> Authentication -> Método de inicio de sesión -> Habilitar Google y/o Email/Password.",
        enlaces: [
          { texto: "Configurar Métodos de Login", url: "https://console.firebase.google.com/project/meli-afiliados/authentication/providers" }
        ]
      },
      {
        id: "2-2",
        titulo: "Configurar Email de Administrador",
        detalle: "Establecer la variable VITE_ADMIN_EMAIL en el archivo .env para restringir el acceso exclusivo a /admin.",
        completada: true,
        requiereAccionManual: true
      },
      {
        id: "2-3",
        titulo: "Publicar Reglas de Seguridad en Firestore",
        detalle: "Desplegar o pegar el archivo firestore.rules para permitir lectura pública y restringir edición solo al admin.",
        completada: true,
        requiereAccionManual: true,
        ayuda: "Copiá las reglas y pegalas en la pestaña Reglas de Firestore, luego hacé clic en 'Publicar'.",
        enlaces: [
          { texto: "Pestaña de Reglas Firestore", url: "https://console.firebase.google.com/project/meli-afiliados/firestore/rules" }
        ]
      },
      {
        id: "2-4",
        titulo: "Prueba de Login de Administrador",
        detalle: "Verificar inicio de sesión exitoso con Google y bloqueo a usuarios no autorizados.",
        completada: false,
        requiereAccionManual: true,
        accionTest: "testAuth",
        enlaces: [
          { texto: "Probar Login en /admin", url: "/admin" }
        ]
      }
    ]
  },
  {
    id: "fase-3",
    titulo: "Fase 3: Catálogo y Conversión",
    descripcion: "Carga de ofertas con códigos de Reels y conteo de clics de afiliados",
    icon: "ShoppingBag",
    color: "from-amber-500 to-orange-600",
    tareas: [
      {
        id: "3-1",
        titulo: "Cargar el primer producto (#101)",
        detalle: "Completar el formulario de carga con link de afiliado meli.la y verificar asignación de código.",
        completada: false,
        requiereAccionManual: true,
        ayuda: "Usá el formulario 'Cargar Nueva Oferta' en la pestaña Catálogo.",
        enlaces: [
          { texto: "Portal Afiliados Mercado Libre", url: "https://afiliados.mercadolibre.com.ar/" },
          { texto: "Ir a Cargar Oferta", tab: "nuevo" }
        ]
      },
      {
        id: "3-2",
        titulo: "Verificar renderizado en Vidriera Pública (/)",
        detalle: "Comprobar que el producto aparece con badge de código #, % OFF, precios y botón llamativo.",
        completada: false,
        requiereAccionManual: true,
        enlaces: [
          { texto: "Abrir Vidriera de Ofertas (/)", url: "/" }
        ]
      },
      {
        id: "3-3",
        titulo: "Validar métrica de Clics (+1)",
        detalle: "Hacer clic en 'Ver en Mercado Libre' y constatar que el contador sube en el panel de métricas.",
        completada: false,
        requiereAccionManual: true,
        enlaces: [
          { texto: "Ver Tabla y Ranking de Clics", tab: "catalogo" }
        ]
      }
    ]
  },
  {
    id: "fase-4",
    titulo: "Fase 4: Automatización y Telegram",
    descripcion: "Extractor de datos de Mercado Libre y publicación automática en Telegram",
    icon: "Send",
    color: "from-sky-500 to-blue-600",
    tareas: [
      {
        id: "4-1",
        titulo: "Crear Bot en @BotFather y Canal en Telegram",
        detalle: "Crear tu bot de difusión, obtener el HTTP API Token y agregarlo como administrador de tu canal.",
        completada: false,
        requiereAccionManual: true,
        ayuda: "En Telegram buscá @BotFather, ejecutá /newbot y copiá el Token. Luego creá tu canal público o privado y agregá el bot con permisos de publicar mensajes.",
        enlaces: [
          { texto: "Abrir @BotFather en Telegram", url: "https://t.me/BotFather" },
          { texto: "Abrir Telegram Web", url: "https://web.telegram.org/" }
        ]
      },
      {
        id: "4-2",
        titulo: "Configurar VITE_TELEGRAM en .env",
        detalle: "Cargar VITE_TELEGRAM_BOT_TOKEN y VITE_TELEGRAM_CHAT_ID (ej: @mi_canal o id numérico -100...).",
        completada: false,
        requiereAccionManual: true,
        enlaces: [
          { texto: "Obtener Chat ID con @username_to_id_bot", url: "https://t.me/username_to_id_bot" }
        ]
      },
      {
        id: "4-3",
        titulo: "Enviar Mensaje de Prueba a Telegram",
        detalle: "Disparar una prueba directa desde el asistente para verificar que el bot publica en el canal.",
        completada: false,
        requiereAccionManual: true,
        accionTest: "testTelegram"
      },
      {
        id: "4-4",
        titulo: "Testear Extractor Automático de ML",
        detalle: "Pegar un link de Mercado Libre en el cargador y presionar 'Autocompletar Datos'.",
        completada: false,
        requiereAccionManual: true,
        enlaces: [
          { texto: "Ver Ofertas de Mercado Libre", url: "https://www.mercadolibre.com.ar/ofertas" },
          { texto: "Ir a Probar Extractor", tab: "nuevo" }
        ]
      }
    ]
  },
  {
    id: "fase-5",
    titulo: "Fase 5: Despliegue y Conversión Social",
    descripcion: "Publicación en Firebase Hosting y conexión con Instagram, TikTok y Bio",
    icon: "Rocket",
    color: "from-purple-500 to-pink-600",
    tareas: [
      {
        id: "5-1",
        titulo: "Validar compilación de producción (Build)",
        detalle: "Ejecutar 'npm run build' en tu terminal para asegurar que el bundle de Vite genera la carpeta dist sin errores.",
        completada: false,
        requiereAccionManual: true
      },
      {
        id: "5-2",
        titulo: "Deploy en Firebase Hosting",
        detalle: "Ejecutar 'npx firebase deploy --only hosting' para tener la web activa con SSL gratis y dominio .web.app.",
        completada: false,
        requiereAccionManual: true,
        ayuda: "Ejecutá 'npm run build' y luego 'npx firebase deploy --only hosting'.",
        enlaces: [
          { texto: "Consola de Firebase Hosting", url: "https://console.firebase.google.com/project/meli-afiliados/hosting" }
        ]
      },
      {
        id: "5-3",
        titulo: "Vincular URL en Biografías y Crear Plantilla de Reel",
        detalle: "Colocar el enlace en tu Link in Bio con el llamado a la acción: 'Buscá el número del Reel en la web para el descuento directo'.",
        completada: false,
        requiereAccionManual: true,
        enlaces: [
          { texto: "Instagram", url: "https://www.instagram.com/" },
          { texto: "TikTok", url: "https://www.tiktok.com/" }
        ]
      }
    ]
  }
];

// Función para fusionar datos preservando estado completado pero actualizando descripciones y enlaces
function mergeWithInitial(loadedPhases) {
  if (!Array.isArray(loadedPhases)) return INITIAL_ROADMAP_PHASES;

  const completedMap = {};
  loadedPhases.forEach(f => {
    if (f.tareas) {
      f.tareas.forEach(t => {
        completedMap[t.id] = t.completada;
      });
    }
  });

  return INITIAL_ROADMAP_PHASES.map(fase => ({
    ...fase,
    tareas: fase.tareas.map(tarea => ({
      ...tarea,
      completada: completedMap[tarea.id] !== undefined ? (completedMap[tarea.id] || tarea.completada) : tarea.completada
    }))
  }));
}

export async function getRoadmapState() {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "roadmap_progreso", "estado_actual");
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data()?.fases) {
        return mergeWithInitial(snap.data().fases);
      }
    } catch (err) {
      console.warn("No se pudo leer roadmap de Firestore, usando local:", err);
    }
  }

  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY);
    if (raw) {
      return mergeWithInitial(JSON.parse(raw));
    }
  } catch (err) {
    console.error("Error leyendo roadmap de localStorage:", err);
  }

  localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(INITIAL_ROADMAP_PHASES));
  return INITIAL_ROADMAP_PHASES;
}

export async function saveRoadmapState(fases) {
  try {
    localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(fases));
  } catch (err) {
    console.error("Error guardando en localStorage:", err);
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "roadmap_progreso", "estado_actual");
      await setDoc(docRef, {
        fases,
        ultimaActualizacion: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Error guardando roadmap en Firestore:", err);
    }
  }
}

export function calculateProgress(fases = []) {
  let totalTasks = 0;
  let completedTasks = 0;

  fases.forEach(fase => {
    fase.tareas.forEach(tarea => {
      totalTasks++;
      if (tarea.completada) completedTasks++;
    });
  });

  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}
