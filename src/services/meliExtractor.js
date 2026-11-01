/**
 * Servicio inteligente de extracción y autocompletado de Mercado Libre
 * Diseñado a prueba de fallos contra bloqueos de CloudFront / PolicyAgent (403)
 * Utiliza parsing semántico de URLs, slugs y extracción de metadatos.
 */

export function extractMeliItemId(url) {
  if (!url) return null;
  const clean = String(url).trim();
  
  // Si directamente pasó el código MLA12345678 o MLA-12345678
  const directMatch = clean.match(/^MLA[-_]?(\d+)$/i);
  if (directMatch) {
    return `MLA${directMatch[1]}`;
  }

  // Buscar MLA en cualquier parte de la URL
  const matchMla = clean.match(/MLA[-_]?(\d+)/i);
  if (matchMla) {
    return `MLA${matchMla[1]}`;
  }

  return null;
}

/**
 * Parsea inteligentemente el título y categoría desde la estructura del enlace de ML
 * Funciona al 100% sin importar bloqueos de red o anti-bots.
 */
export function parseMeliUrlSemantic(url) {
  if (!url) return null;
  const clean = String(url).trim();

  // 1. Extraer ID de publicación
  const mlItemId = extractMeliItemId(clean) || "";

  // 2. Extraer slug del título
  let rawSlug = "";

  // Formato A: articulo.mercadolibre.com.ar/MLA-123456-titulo-del-producto-_JM
  const matchA = clean.match(/MLA[-_]?\d+[-_]([a-zA-Z0-9\-_]+)/i);
  if (matchA) {
    rawSlug = matchA[1].replace(/_JM.*$/i, "").replace(/-_.*$/i, "");
  }

  // Formato B: mercadolibre.com.ar/titulo-del-producto/p/MLA...
  if (!rawSlug) {
    const matchB = clean.match(/mercadolibre\.com\.ar\/([a-zA-Z0-9\-_]+)\/p\//i);
    if (matchB) {
      rawSlug = matchB[1];
    }
  }

  // Formato C: URLs generales con slug
  if (!rawSlug && clean.includes("mercadolibre.com.ar/")) {
    const parts = clean.split("mercadolibre.com.ar/")[1].split(/[?#/]/)[0];
    if (parts && parts.length > 5 && !parts.startsWith("MLA")) {
      rawSlug = parts;
    }
  }

  // Formatear slug a título limpio con mayúsculas
  let titulo = "";
  if (rawSlug) {
    titulo = rawSlug
      .split("-")
      .filter(w => w && w !== "_" && w.toLowerCase() !== "jm" && w.toLowerCase() !== "p")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  // 3. Detección automática de categoría según palabras clave
  let categoria = "General";
  const textToCheck = (titulo + " " + clean).toLowerCase();

  if (/auricular|inalambric|bluetooth|parlante|reloj|smartwatch|teclado|mouse|gamer|cable|cargador|proyector|camara|pantalla|tablet|notebook|pc/i.test(textToCheck)) {
    categoria = "Tecnología";
  } else if (/termo|lumilagro|stanley|cocina|freidora|cafetera|licuadora|picador|organizador|vaso|taza|olla|sarten|bazar|cuchillo|almohada|sabana/i.test(textToCheck)) {
    categoria = "Hogar";
  } else if (/zapatilla|remera|pantalon|buzo|campera|calzado|vestido|short|nike|adidas|puma|running/i.test(textToCheck)) {
    categoria = "Moda y Calzado";
  } else if (/cepillo|secador|alisador|crema|perfume|maquillaje|depilador|masajeador|facial|skincare|pelo|cabello/i.test(textToCheck)) {
    categoria = "Belleza";
  } else if (/herramienta|taladro|amoladora|destornillador|llave|soldadora|taller|compresor|pinza|sierra/i.test(textToCheck)) {
    categoria = "Herramientas";
  } else if (/auto|moto|freno|neumatico|cubierta|inflador|estereo|soporte auto/i.test(textToCheck)) {
    categoria = "General";
  }

  return {
    mlItemId,
    titulo,
    categoria
  };
}

/**
 * Función principal de extracción: combina API y fallback semántico garantizado
 */
export async function fetchMeliProductData(urlOrId) {
  if (!urlOrId || typeof urlOrId !== "string" || !urlOrId.trim()) {
    return {
      success: false,
      error: "Por favor pegá un enlace o código de Mercado Libre para analizar."
    };
  }

  const rawInput = urlOrId.trim();
  const parsed = parseMeliUrlSemantic(rawInput);
  const itemId = parsed.mlItemId;

  // Si no se detectó ningún código MLA ni slug
  if (!itemId && !parsed.titulo) {
    if (rawInput.toLowerCase().includes("meli.la")) {
      return {
        success: false,
        error: "Los enlaces cortos 'meli.la' son redirecciones de afiliado que no tienen el nombre del producto en el link. Pegá el enlace normal de Mercado Libre (ej: https://articulo.mercadolibre.com.ar/MLA-...) o escribí el código MLA."
      };
    }
    return {
      success: false,
      error: "No se reconoció un enlace válido de Mercado Libre. Pegá una URL tipo: https://articulo.mercadolibre.com.ar/MLA-..."
    };
  }

  // 1. Intentar consultar API oficial de Mercado Libre (si no está bloqueada por PolicyAgent)
  if (itemId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const orig = data.original_price || data.base_price || data.price;
        const curr = data.price;
        let disc = 0;
        if (orig && orig > curr) {
          disc = Math.round(((orig - curr) / orig) * 100);
        }

        let bestImg = "";
        if (data.pictures && data.pictures.length > 0) {
          bestImg = data.pictures[0].secure_url || data.pictures[0].url;
        } else if (data.thumbnail) {
          bestImg = data.thumbnail.replace(/-[A-Z]\.jpg$/, "-O.jpg");
        }

        return {
          success: true,
          mlItemId: data.id,
          titulo: data.title || parsed.titulo,
          precioOriginal: orig,
          precioOferta: curr,
          descuentoPorcentaje: disc,
          imagenUrl: bestImg,
          permalink: data.permalink || rawInput,
          categoria: parsed.categoria,
          envioGratis: data.shipping?.free_shipping || false
        };
      }
    } catch (e) {
      // Si la API falla o da 403, no pasa nada, continuamos al extractor semántico
    }
  }

  // 2. Extractor Semántico Garantizado (nunca falla ante bloqueos)
  return {
    success: true,
    mlItemId: itemId || "MLA000000",
    titulo: parsed.titulo || "Producto Mercado Libre",
    precioOriginal: "",
    precioOferta: "",
    descuentoPorcentaje: 0,
    imagenUrl: "",
    permalink: rawInput,
    categoria: parsed.categoria || "General",
    envioGratis: true,
    aviso: "Título y código autocompletados desde el enlace. Completá el precio y la foto para guardar la oferta."
  };
}
