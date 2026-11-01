import { createWorker } from "tesseract.js";

/**
 * Parsea el texto extraído por OCR de una captura de pantalla de Mercado Libre
 */
export function parseMercadoLibreText(rawText) {
  if (!rawText) return null;

  const lines = rawText
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // 1. EXTRAER PRECIOS
  // Busca expresiones de dinero como $ 469.999, $402.315, $ 469999
  const priceRegex = /\$\s?([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,8})/g;
  const foundPrices = [];
  let match;

  while ((match = priceRegex.exec(rawText)) !== null) {
    const cleanNum = Number(match[1].replace(/\./g, ""));
    // Filtrar cuotas o números muy chicos/grandes (rango de $1.000 a $50.000.000)
    if (cleanNum >= 1000 && cleanNum <= 50000000) {
      foundPrices.push(cleanNum);
    }
  }

  // Descuento explícito (ej: 14% OFF, 25 % OFF)
  let explicitDiscount = 0;
  const discountMatch = rawText.match(/(\d{1,2})\s*%\s*(?:OFF|descuento)/i);
  if (discountMatch) {
    explicitDiscount = parseInt(discountMatch[1], 10);
  }

  let precioOferta = "";
  let precioOriginal = "";
  let descuentoPorcentaje = explicitDiscount;

  if (foundPrices.length >= 2) {
    // Si hay más de un precio, el mayor suele ser el original tachado y el menor el de oferta
    const sorted = [...foundPrices].sort((a, b) => b - a);
    precioOriginal = sorted[0];
    precioOferta = sorted[1];
    if (precioOriginal > precioOferta) {
      descuentoPorcentaje = Math.round(((precioOriginal - precioOferta) / precioOriginal) * 100);
    }
  } else if (foundPrices.length === 1) {
    precioOferta = foundPrices[0];
  }

  // 2. EXTRAER TÍTULO
  // Busca el bloque de texto representativo del producto
  let candidateTitleLines = [];
  let isRecordingTitle = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar dónde suele comenzar el título
    if (/MÁS VENDIDO|Nuevo|Recomendado|vendidos/i.test(line)) {
      isRecordingTitle = true;
      continue;
    }

    // Si ya estamos grabando título
    if (isRecordingTitle) {
      // Si llegamos a precios, cuotas, opiniones o botón, cortar
      if (/\$|cuotas|opiniones|★★★★★|★|\(\d+\)|Color:|Stock|Comprar/i.test(line)) {
        break;
      }
      // Ignorar líneas cortas o ruidos
      if (line.length > 3 && !/^\d+(\.\d+)?$/.test(line)) {
        candidateTitleLines.push(line);
      }
    }
  }

  // Fallback para título si la heurística anterior no capturó
  if (candidateTitleLines.length === 0) {
    for (const line of lines) {
      if (
        line.length > 12 && 
        !/\$|cuotas|envío|gratis|stock|comprar|carrito|devolución|vendidos|tienda oficial/i.test(line) &&
        !/^[0-9\s.,-]+$/.test(line)
      ) {
        candidateTitleLines.push(line);
        if (candidateTitleLines.length >= 2) break;
      }
    }
  }

  let titulo = candidateTitleLines
    .join(" ")
    .replace(/[—\-_|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 3. ENVÍO GRATIS Y FULL
  const envioGratis = /llega gratis|envío gratis|retirá gratis|full/i.test(rawText);

  // 4. DETECCIÓN DE CATEGORÍA
  let categoria = "General";
  const fullLower = rawText.toLowerCase();

  if (/celular|smartphone|samsung|galaxy|iphone|motorola|xiaomi|auricular|bluetooth|gamer|parlante|tablet|smartwatch|notebook/i.test(fullLower)) {
    categoria = "Tecnología";
  } else if (/cocina|freidora|termo|lumilagro|stanley|cafetera|licuadora|picador|olla|sarten|bazar|cama|almohada/i.test(fullLower)) {
    categoria = "Hogar";
  } else if (/zapatilla|remera|pantalon|buzo|campera|calzado|vestido|short|nike|adidas/i.test(fullLower)) {
    categoria = "Moda y Calzado";
  } else if (/cepillo|secador|alisador|crema|perfume|maquillaje|depilador|masajeador|facial/i.test(fullLower)) {
    categoria = "Belleza";
  } else if (/herramienta|taladro|amoladora|destornillador|soldadora|taller|compresor/i.test(fullLower)) {
    categoria = "Herramientas";
  }

  return {
    titulo,
    precioOriginal: precioOriginal || "",
    precioOferta: precioOferta || "",
    descuentoPorcentaje: descuentoPorcentaje || 0,
    envioGratis,
    categoria
  };
}

/**
 * Recorta la foto del producto desde la captura (área izquierda donde ML muestra el producto)
 */
export async function cropProductImageFromScreenshot(imageSource) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        // Si la imagen es horizontal (pantalla completa o recorte amplio de ML)
        // La foto principal del producto se ubica a la izquierda (x: 5% a 45%, y: 5% a 90%)
        let cropX = 0;
        let cropY = 0;
        let cropW = w;
        let cropH = h;

        if (w > h * 1.1) {
          cropX = Math.round(w * 0.05);
          cropY = Math.round(h * 0.05);
          cropW = Math.round(w * 0.38);
          cropH = Math.round(h * 0.90);
        }

        canvas.width = cropW;
        canvas.height = cropH;

        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        const dataUrl = canvas.toDataURL("image/webp", 0.9);
        resolve(dataUrl);
      } catch (err) {
        console.warn("Fallo al recortar foto de la captura:", err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);

    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      resolve(null);
    }
  });
}

/**
 * Procesa la imagen completa con OCR y extracción
 */
export async function processScreenshotWithOcr(imageFileOrBlob, onProgress = null) {
  try {
    let worker = await createWorker("spa");

    if (onProgress) {
      onProgress(30, "Analizando texto con IA OCR...");
    }

    const ret = await worker.recognize(imageFileOrBlob);

    if (onProgress) {
      onProgress(75, "Extrayendo precios y título...");
    }

    const text = ret.data.text || "";
    await worker.terminate();

    const parsedData = parseMercadoLibreText(text);

    // Intentar recortar la foto del producto automáticamente
    if (onProgress) {
      onProgress(90, "Recortando foto del producto...");
    }
    const croppedImage = await cropProductImageFromScreenshot(imageFileOrBlob);

    return {
      success: true,
      data: {
        ...parsedData,
        imagenUrl: croppedImage || ""
      },
      rawText: text
    };
  } catch (err) {
    console.error("Error en OCR:", err);
    return {
      success: false,
      error: err.message || "Error al procesar la imagen con OCR"
    };
  }
}
