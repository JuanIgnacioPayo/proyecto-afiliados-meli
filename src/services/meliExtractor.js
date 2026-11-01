/**
 * Servicio para extraer datos de productos de Mercado Libre
 * Soporta:
 * - URLs originales: https://articulo.mercadolibre.com.ar/MLA-123456789-titulo...
 * - URLs de catálogo: https://www.mercadolibre.com.ar/p/MLA12345678
 * - Código directo: MLA123456789 o MLA-123456789
 * - URLs cortas de afiliados (meli.la/...): resolución automática o guía clara
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
 * Intenta resolver un enlace acortado tipo meli.la
 */
async function resolveShortLink(shortUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`https://unshorten.me/json/${encodeURIComponent(shortUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && data.resolved_url) {
        return data.resolved_url;
      }
    }
  } catch (err) {
    console.warn("No se pudo desabreviar el link corto automáticamente:", err);
  }
  return null;
}

export async function fetchMeliProductData(urlOrId) {
  if (!urlOrId || typeof urlOrId !== "string" || !urlOrId.trim()) {
    return {
      success: false,
      error: "Por favor pegá un enlace o código de Mercado Libre para analizar."
    };
  }

  let rawInput = urlOrId.trim();
  let itemId = extractMeliItemId(rawInput);
  let resolvedUrl = null;

  // Si es un enlace acortado tipo meli.la y no tiene el código MLA visible
  if (!itemId && rawInput.toLowerCase().includes("meli.la")) {
    resolvedUrl = await resolveShortLink(rawInput);
    if (resolvedUrl) {
      itemId = extractMeliItemId(resolvedUrl);
    }
  }

  // Si aún no se pudo determinar el ID de publicación
  if (!itemId) {
    if (rawInput.toLowerCase().includes("meli.la")) {
      return {
        success: false,
        error: "Los enlaces cortos 'meli.la' son redirecciones de afiliado que no exponen el código del producto. Pegá el enlace original de la publicación (ej: https://articulo.mercadolibre.com.ar/MLA-...) o escribí el código MLA directamente."
      };
    }
    return {
      success: false,
      error: "No se encontró el código MLA (ej: MLA-123456789) en el enlace. Verificá que sea una URL de producto de Mercado Libre válida."
    };
  }

  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: `La publicación con código ${itemId} no fue encontrada en Mercado Libre o ya fue dada de baja.`
        };
      }
      return {
        success: false,
        error: `Mercado Libre respondió con error HTTP ${response.status}. Podés cargar los datos manualmente.`
      };
    }

    const data = await response.json();

    const originalPrice = data.original_price || data.base_price || data.price;
    const currentPrice = data.price;
    let discount = 0;

    if (originalPrice && originalPrice > currentPrice) {
      discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    // Obtener la mejor imagen en alta resolución
    let bestImage = "";
    if (data.pictures && data.pictures.length > 0) {
      bestImage = data.pictures[0].secure_url || data.pictures[0].url;
    } else if (data.thumbnail) {
      bestImage = data.thumbnail.replace(/-[A-Z]\.jpg$/, "-O.jpg");
    }

    return {
      success: true,
      mlItemId: data.id,
      titulo: data.title || "",
      precioOriginal: originalPrice,
      precioOferta: currentPrice,
      descuentoPorcentaje: discount,
      imagenUrl: bestImage,
      permalink: data.permalink || resolvedUrl || rawInput,
      categoria: data.category_id || "General",
      envioGratis: data.shipping?.free_shipping || false,
      condicion: data.condition === "new" ? "Nuevo" : "Usado",
      garantia: data.warranty || ""
    };
  } catch (error) {
    console.error("Error al consultar API de Mercado Libre:", error);
    return {
      success: false,
      error: `Error de conexión: ${error.message || "No se pudo conectar con Mercado Libre"}`
    };
  }
}
