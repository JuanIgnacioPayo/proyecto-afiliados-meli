/**
 * Servicio de publicación en canales de Telegram
 * Utiliza la API directa de Telegram Bot (sendPhoto y sendMessage)
 */

export async function sendTelegramOffer(product, customBotToken = null, customChatId = null) {
  const botToken = (customBotToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN)?.trim();
  const chatId = (customChatId || import.meta.env.VITE_TELEGRAM_CHAT_ID)?.trim();

  if (!botToken || !chatId) {
    return {
      success: false,
      error: "Falta configurar el Token del Bot o el Chat ID del canal de Telegram en .env"
    };
  }

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(val);
  };

  const discountBadge = product.descuentoPorcentaje > 0 
    ? ` 🔥 <b>${product.descuentoPorcentaje}% OFF</b>` 
    : "";

  const originalPriceFormatted = product.precioOriginal && product.precioOriginal > product.precioOferta
    ? `<s>${formatPrice(product.precioOriginal)}</s> `
    : "";

  const captionHtml = `
⚡ <b>OFERTA IMPERDIBLE #${product.codigoNumerico || "000"}</b> ⚡${discountBadge}

📦 <b>${product.titulo}</b>

💰 <b>Precio Oferta:</b> ${originalPriceFormatted}<b>${formatPrice(product.precioOferta)}</b>
${product.envioGratis ? "🚚 <i>¡Envío Gratis!</i>" : ""}

👇 <b>Comprá directo con descuento oficial acá:</b>
`.trim();

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: "🛒 Ver Oferta en Mercado Libre",
          url: product.linkAfiliado
        }
      ]
    ]
  };

  try {
    let endpoint = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    let body = {
      chat_id: chatId,
      photo: product.imagenUrl,
      caption: captionHtml,
      parse_mode: "HTML",
      reply_markup: inlineKeyboard
    };

    // Si no hay imagen válida, enviar como mensaje de texto simple
    if (!product.imagenUrl || !product.imagenUrl.startsWith("http")) {
      endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
      body = {
        chat_id: chatId,
        text: captionHtml,
        parse_mode: "HTML",
        reply_markup: inlineKeyboard
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await res.json();
    if (!result.ok) {
      throw new Error(result.description || "Error desconocido devuelto por Telegram API");
    }

    return {
      success: true,
      messageId: result.result?.message_id
    };
  } catch (error) {
    console.error("Error enviando a Telegram:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Función de test rápido para verificar si el Bot y ChatID funcionan
 */
export async function testTelegramConnection(botToken, chatId) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ <b>¡Conexión Exitosa con Telegram!</b>\nTu Hub de Afiliados de Mercado Libre ya está vinculado correctamente para publicar ofertas automáticas.",
        parse_mode: "HTML"
      })
    });
    const data = await res.json();
    return {
      success: data.ok,
      description: data.description || (data.ok ? "Mensaje enviado exitosamente" : "Error en Telegram")
    };
  } catch (err) {
    return {
      success: false,
      description: err.message
    };
  }
}
