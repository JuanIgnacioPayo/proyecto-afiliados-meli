/**
 * Servicio para el Radar de Tendencias y Evaluación de Rentabilidad de Afiliados
 * Consulta endpoints oficiales de Mercado Libre Argentina (trends/MLA)
 * y evalúa la probabilidad de conversión para videos de Reels/TikTok.
 */

// Categorías estratégicas con mayor potencial de afiliados en Mercado Libre Argentina
export const CATEGORIAS_RADAR = [
  { id: "TODAS", nombre: "🔥 Más buscadas en toda Argentina", categoryId: null },
  { id: "HOGAR", nombre: "🏠 Hogar, Cocina y Bazar", categoryId: "MLA1574" },
  { id: "TECH", nombre: "🎧 Tecnología, Audio y Gadgets", categoryId: "MLA1000" },
  { id: "CELULARES", nombre: "📱 Celulares y Accesorios", categoryId: "MLA1051" },
  { id: "BELLEZA", nombre: "💅 Belleza y Cuidado Personal", categoryId: "MLA1246" },
  { id: "HERRAMIENTAS", nombre: "🛠️ Herramientas y Taller", categoryId: "MLA1499" },
  { id: "DEPORTES", nombre: "🏃 Deportes y Fitness", categoryId: "MLA1276" },
  { id: "AUTOS", nombre: "🚗 Accesorios para Vehículos", categoryId: "MLA1743" }
];

// Tendencias de respaldo si la API de trends está lenta o tiene rate limit
const FALLBACK_TRENDS = {
  TODAS: [
    { keyword: "auriculares inalambricos bluetooth", url: "https://listado.mercadolibre.com.ar/auriculares-inalambricos" },
    { keyword: "freidora de aire sin aceite", url: "https://listado.mercadolibre.com.ar/freidora-de-aire" },
    { keyword: "picadora electrica de alimentos", url: "https://listado.mercadolibre.com.ar/picadora-electrica" },
    { keyword: "soporte celular auto magnetico", url: "https://listado.mercadolibre.com.ar/soporte-celular-auto" },
    { keyword: "luz led con sensor de movimiento", url: "https://listado.mercadolibre.com.ar/luz-led-sensor" },
    { keyword: "mini compresor inflador portatil", url: "https://listado.mercadolibre.com.ar/mini-compresor-portatil" },
    { keyword: "cepillo secador alisador", url: "https://listado.mercadolibre.com.ar/cepillo-secador-alisador" },
    { keyword: "termo acero inoxidable 1 litro", url: "https://listado.mercadolibre.com.ar/termo-acero-inoxidable" }
  ],
  HOGAR: [
    { keyword: "freidora de aire 4 litros", url: "https://listado.mercadolibre.com.ar/freidora-de-aire" },
    { keyword: "dispensador de agua electrico", url: "https://listado.mercadolibre.com.ar/dispensador-agua-electrico" },
    { keyword: "sellador termico de bolsas", url: "https://listado.mercadolibre.com.ar/sellador-termico-bolsas" },
    { keyword: "organizador de heladera acrilico", url: "https://listado.mercadolibre.com.ar/organizador-heladera" }
  ],
  TECH: [
    { keyword: "auriculares cancelacion ruido", url: "https://listado.mercadolibre.com.ar/auriculares-cancelacion-ruido" },
    { keyword: "teclado mecanico inalambrico", url: "https://listado.mercadolibre.com.ar/teclado-mecanico" },
    { keyword: "cargador inalambrico 3 en 1", url: "https://listado.mercadolibre.com.ar/cargador-3-en-1" },
    { keyword: "proyector portatil smart", url: "https://listado.mercadolibre.com.ar/proyector-portatil" }
  ]
};

/**
 * Obtener tendencias en tiempo real desde la API de Mercado Libre Argentina
 */
export async function fetchMeliTrends(categoryId = null) {
  try {
    const endpoint = categoryId 
      ? `https://api.mercadolibre.com/trends/MLA/${categoryId}`
      : "https://api.mercadolibre.com/trends/MLA";

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.slice(0, 12).map(item => ({
        keyword: item.keyword,
        url: item.url || `https://listado.mercadolibre.com.ar/${encodeURIComponent(item.keyword)}`
      }));
    }
  } catch (error) {
    console.warn("Fallo temporal en trends API de MeLi, usando respaldo estratégico:", error);
  }

  // Devolver fallback según categoría
  if (categoryId === "MLA1574") return FALLBACK_TRENDS.HOGAR;
  if (categoryId === "MLA1000") return FALLBACK_TRENDS.TECH;
  return FALLBACK_TRENDS.TODAS;
}

/**
 * Evalúa un producto y calcula el "Índice de Oportunidad de Afiliado" (0 a 100)
 */
export function calculateOpportunityScore(product) {
  let score = 0;
  const breakdown = [];
  const pros = [];
  const contras = [];

  const precio = Number(product.precioOferta) || 0;
  const descuento = Number(product.descuentoPorcentaje) || 0;
  const envioGratis = Boolean(product.envioGratis);

  // 1. Criterio Descuento (0 a 25 puntos)
  if (descuento >= 30) {
    score += 25;
    breakdown.push({ factor: "Descuento Masivo (>30% OFF)", pts: 25, max: 25, status: "good" });
    pros.push(`Excelente descuento de ${descuento}% OFF para generar urgencia en el video.`);
  } else if (descuento >= 20) {
    score += 20;
    breakdown.push({ factor: "Buen Descuento (20-29% OFF)", pts: 20, max: 25, status: "good" });
    pros.push(`Descuento del ${descuento}% OFF, atractivo para la audiencia.`);
  } else if (descuento >= 10) {
    score += 10;
    breakdown.push({ factor: "Descuento Moderado (10-19% OFF)", pts: 10, max: 25, status: "neutral" });
    contras.push("El descuento es moderado; deberás compensarlo destacando mucho la utilidad del producto.");
  } else {
    score += 2;
    breakdown.push({ factor: "Descuento Bajo o Nulo (<10%)", pts: 2, max: 25, status: "bad" });
    contras.push("Sin descuento llamativo. En Reels suele convertir menos.");
  }

  // 2. Criterio Ticket Dulce para Compra por Impulso (0 a 30 puntos)
  // Rango óptimo en Argentina: $25.000 a $140.000 ARS
  if (precio >= 25000 && precio <= 140000) {
    score += 30;
    breakdown.push({ factor: "Ticket Dulce de Impulso ($25k - $140k)", pts: 30, max: 30, status: "good" });
    pros.push("Precio perfecto para compra no meditada con tarjeta de débito/crédito sin consultar en familia.");
  } else if (precio > 140000 && precio <= 250000) {
    score += 20;
    breakdown.push({ factor: "Ticket Medio ($140k - $250k)", pts: 20, max: 30, status: "neutral" });
    pros.push("Mayor comisión por venta, aunque requiere mostrar muy bien la calidad y cuotas.");
  } else if (precio < 25000 && precio > 5000) {
    score += 15;
    breakdown.push({ factor: "Ticket Económico (<$25k)", pts: 15, max: 30, status: "neutral" });
    contras.push("Comisión baja en pesos por unidad vendida; necesitás mucho volumen.");
  } else if (precio > 250000) {
    score += 10;
    breakdown.push({ factor: "Ticket Alto (>$250k)", pts: 10, max: 30, status: "bad" });
    contras.push("El usuario suele comparar precios varios días y se vence la cookie de atribución.");
  } else {
    score += 5;
    breakdown.push({ factor: "Precio fuera de rango estándar", pts: 5, max: 30, status: "bad" });
  }

  // 3. Criterio Envío Gratis (0 a 25 puntos)
  if (envioGratis) {
    score += 25;
    breakdown.push({ factor: "Envío Gratis Incluido", pts: 25, max: 25, status: "good" });
    pros.push("Elimina la principal objeción de compra en Argentina (costo de flete).");
  } else {
    score += 5;
    breakdown.push({ factor: "Envío con Costo", pts: 5, max: 25, status: "bad" });
    contras.push("Atención: El costo de envío puede provocar abandono del carrito.");
  }

  // 4. Criterio de Presentación e Imagen (0 a 20 puntos)
  if (product.imagenUrl && product.imagenUrl.includes("http")) {
    score += 20;
    breakdown.push({ factor: "Foto en Alta Calidad Lista", pts: 20, max: 20, status: "good" });
    pros.push("Imagen clara sobre fondo blanco lista para destacar en la vidriera.");
  } else {
    score += 8;
    breakdown.push({ factor: "Falta Foto en Alta Calidad", pts: 8, max: 20, status: "neutral" });
  }

  // Veredicto Final
  let nivel = "BAJA";
  let badgeColor = "bg-red-100 text-red-800 border-red-200";
  let label = "Poco Recomendado";

  if (score >= 80) {
    nivel = "ORO";
    badgeColor = "bg-amber-100 text-amber-900 border-amber-300";
    label = "🔥 ¡Oportunidad ORO! Producto Ganador";
  } else if (score >= 65) {
    nivel = "BUENA";
    badgeColor = "bg-emerald-100 text-emerald-900 border-emerald-300";
    label = "⚡ Muy Buena Oportunidad";
  } else if (score >= 50) {
    nivel = "MEDIA";
    badgeColor = "bg-blue-100 text-blue-900 border-blue-300";
    label = "⚖️ Oportunidad Aceptable";
  }

  // Guion exprés sugerido para Reel/TikTok
  const guion = {
    gancho: `¿Buscabas ${product.titulo.slice(0, 35)}...? ¡Mirá lo que encontré en Mercado Libre hoy con ${descuento > 0 ? `${descuento}% OFF` : 'descuento'}!`,
    desarrollo: `Es ideal porque tiene ${envioGratis ? 'Envío Gratis a todo el país' : 'excelentes calificaciones'} y te ahorrás tiempo y dinero.`,
    llamadoAccion: `Andá al link de mi perfil, escribí el código #${product.codigoNumerico || '101'} en el buscador del Hub y te lleva directo al precio oficial de oferta.`
  };

  return {
    score,
    nivel,
    label,
    badgeColor,
    breakdown,
    pros,
    contras,
    guion
  };
}
