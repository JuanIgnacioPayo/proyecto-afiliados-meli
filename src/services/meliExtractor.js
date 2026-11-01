/**
 * Servicio para extraer datos de productos de Mercado Libre
 * Soporta URLs tipo:
 * - https://articulo.mercadolibre.com.ar/MLA-123456789-titulo...
 * - https://articulo.mercadolibre.com.ar/MLA123456789...
 * - https://www.mercadolibre.com.ar/p/MLA12345678
 * Utiliza la API pública de Mercado Libre (api.mercadolibre.com/items/MLA...)
 */

export function extractMeliItemId(url) {
  if (!url) return null;
  // Buscar patrones como MLA-123456789 o MLA123456789
  const matchMla = url.match(/(MLA)[\s-_]?(\d+)/i);
  if (matchMla) {
    return `MLA${matchMla[2]}`;
  }
  return null;
}

export async function fetchMeliProductData(urlOrId) {
  const itemId = extractMeliItemId(urlOrId) || (urlOrId.startsWith("MLA") ? urlOrId : null);

  if (!itemId) {
    throw new Error("No se pudo detectar el código de publicación MLA (ej: MLA-123456789) en el enlace.");
  }

  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status} al consultar la API de Mercado Libre`);
    }
    const data = await response.json();

    const originalPrice = data.original_price || data.base_price || data.price;
    const currentPrice = data.price;
    let discount = 0;

    if (originalPrice && originalPrice > currentPrice) {
      discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    // Obtener mejor imagen disponible
    let bestImage = "";
    if (data.pictures && data.pictures.length > 0) {
      bestImage = data.pictures[0].secure_url || data.pictures[0].url;
    } else if (data.thumbnail) {
      // Reemplazar -I.jpg por -O.jpg para obtener alta resolución
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
      permalink: data.permalink,
      categoria: data.category_id || "General",
      envioGratis: data.shipping?.free_shipping || false,
      condicion: data.condition === "new" ? "Nuevo" : "Usado",
      garantia: data.warranty || ""
    };
  } catch (error) {
    console.error("Error al extraer producto de ML:", error);
    // Retornar error descriptivo
    return {
      success: false,
      error: error.message || "Error al conectar con la API de Mercado Libre"
    };
  }
}
