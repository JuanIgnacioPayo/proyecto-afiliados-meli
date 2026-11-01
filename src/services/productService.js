import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  increment, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";

const STORAGE_KEY = "meli_hub_productos_local";

// Productos iniciales de demostración para cuando Firebase aún no esté conectado
export const DEMO_PRODUCTS = [
  {
    id: "demo-1",
    codigoNumerico: 101,
    titulo: "Auriculares Inalámbricos Bluetooth Con Cancelación De Ruido",
    imagenUrl: "https://http2.mlstatic.com/D_NQ_NP_2X_841444-MLA74805740455_022024-F.webp",
    precioOriginal: 89999,
    precioOferta: 54999,
    descuentoPorcentaje: 38,
    categoria: "Tecnología",
    linkAfiliado: "https://meli.la/2abc101",
    mlItemId: "MLA14567891",
    destacado: true,
    envioGratis: true,
    clicsContador: 142,
    fechaCreacion: new Date(Date.now() - 86400000 * 2).toISOString(),
    publicadoTelegram: true,
    activo: true
  },
  {
    id: "demo-2",
    codigoNumerico: 102,
    titulo: "Cafetera Expreso Automática En Acero Inoxidable 15 Bares",
    imagenUrl: "https://http2.mlstatic.com/D_NQ_NP_2X_784964-MLA72242445100_102023-F.webp",
    precioOriginal: 185000,
    precioOferta: 129500,
    descuentoPorcentaje: 30,
    categoria: "Hogar",
    linkAfiliado: "https://meli.la/2abc102",
    mlItemId: "MLA14567892",
    destacado: true,
    envioGratis: true,
    clicsContador: 98,
    fechaCreacion: new Date(Date.now() - 86400000).toISOString(),
    publicadoTelegram: true,
    activo: true
  },
  {
    id: "demo-3",
    codigoNumerico: 103,
    titulo: "Zapatillas Deportivas Running Livianas Amortiguación Pro",
    imagenUrl: "https://http2.mlstatic.com/D_NQ_NP_2X_759795-MLA51772651093_092022-F.webp",
    precioOriginal: 75000,
    precioOferta: 48750,
    descuentoPorcentaje: 35,
    categoria: "Moda y Calzado",
    linkAfiliado: "https://meli.la/2abc103",
    mlItemId: "MLA14567893",
    destacado: false,
    envioGratis: true,
    clicsContador: 64,
    fechaCreacion: new Date().toISOString(),
    publicadoTelegram: false,
    activo: true
  }
];

function getLocalProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_PRODUCTS));
      return DEMO_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return DEMO_PRODUCTS;
  }
}

function saveLocalProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error("Error guardando localmente:", err);
  }
}

/**
 * Obtener todos los productos
 */
export async function getProducts() {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "productos"), orderBy("codigoNumerico", "desc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
      }
    } catch (error) {
      console.warn("Firestore aún no tiene datos o falló la consulta, usando respaldo local:", error);
    }
  }
  return getLocalProducts();
}

/**
 * Calcular el siguiente código numérico disponible (ej: 101, 102, 103...)
 */
export function getNextNumericCode(products = []) {
  if (!products || products.length === 0) return 101;
  const max = products.reduce((acc, p) => {
    const num = parseInt(p.codigoNumerico, 10);
    return !isNaN(num) && num > acc ? num : acc;
  }, 100);
  return max + 1;
}

/**
 * Guardar o crear un nuevo producto
 */
export async function createProduct(productData) {
  const newProduct = {
    ...productData,
    codigoNumerico: Number(productData.codigoNumerico) || 101,
    precioOriginal: Number(productData.precioOriginal) || 0,
    precioOferta: Number(productData.precioOferta) || 0,
    descuentoPorcentaje: Number(productData.descuentoPorcentaje) || 0,
    clicsContador: 0,
    destacado: Boolean(productData.destacado),
    envioGratis: Boolean(productData.envioGratis),
    activo: productData.activo !== false,
    publicadoTelegram: Boolean(productData.publicadoTelegram),
    fechaCreacion: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "productos"), {
        ...newProduct,
        fechaCreacionFirestore: serverTimestamp()
      });
      return { id: docRef.id, ...newProduct };
    } catch (err) {
      console.error("Error guardando en Firestore, guardando en local:", err);
    }
  }

  // Respaldo local
  const current = getLocalProducts();
  const created = { id: `local-${Date.now()}`, ...newProduct };
  const updated = [created, ...current];
  saveLocalProducts(updated);
  return created;
}

/**
 * Actualizar producto existente
 */
export async function updateProduct(id, updates) {
  if (isFirebaseConfigured && db && !id.startsWith("demo-") && !id.startsWith("local-")) {
    try {
      const docRef = doc(db, "productos", id);
      await updateDoc(docRef, updates);
      return true;
    } catch (err) {
      console.error("Error actualizando en Firestore:", err);
    }
  }

  // Actualización local
  const current = getLocalProducts();
  const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);
  saveLocalProducts(updated);
  return true;
}

/**
 * Eliminar producto
 */
export async function deleteProduct(id) {
  if (isFirebaseConfigured && db && !id.startsWith("demo-") && !id.startsWith("local-")) {
    try {
      await deleteDoc(doc(db, "productos", id));
      return true;
    } catch (err) {
      console.error("Error eliminando en Firestore:", err);
    }
  }

  const current = getLocalProducts();
  const updated = current.filter(p => p.id !== id);
  saveLocalProducts(updated);
  return true;
}

/**
 * Incrementar contador de clics de conversión
 */
export async function trackProductClick(id) {
  if (isFirebaseConfigured && db && !id.startsWith("demo-") && !id.startsWith("local-")) {
    try {
      const docRef = doc(db, "productos", id);
      await updateDoc(docRef, {
        clicsContador: increment(1)
      });
      return true;
    } catch (err) {
      console.error("Error incrementando clics en Firestore:", err);
    }
  }

  // Local increment
  const current = getLocalProducts();
  const updated = current.map(p => {
    if (p.id === id) {
      return { ...p, clicsContador: (p.clicsContador || 0) + 1 };
    }
    return p;
  });
  saveLocalProducts(updated);
  return true;
}
