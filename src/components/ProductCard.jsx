import { useState } from "react";
import { ExternalLink, Tag, Zap, Check, Copy, Share2 } from "lucide-react";

export default function ProductCard({ product, onTrackClick }) {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatPrice = (val) => {
    if (!val && val !== 0) return "";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleCtaClick = (e) => {
    if (onTrackClick) {
      onTrackClick(product);
    }
  };

  const handleCopyCode = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`#${product.codigoNumerico}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-yellow-400/80 transition-all duration-300 flex flex-col overflow-hidden relative">
      
      {/* Top Header: Badge de Código de Video # y % Descuento */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        {/* Badge Código de Producto (foco en tráfico de Reels/TikTok) */}
        <div 
          onClick={handleCopyCode}
          title="Clic para copiar código del Reel"
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/95 text-yellow-300 font-extrabold text-xs sm:text-sm rounded-full shadow-md backdrop-blur-sm cursor-pointer hover:scale-105 active:scale-95 transition"
        >
          <span className="text-yellow-400">#</span>
          <span>{product.codigoNumerico}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
          ) : (
            <Copy className="w-3 h-3 text-slate-400 opacity-70 group-hover:opacity-100" />
          )}
        </div>

        {/* Badge de Descuento */}
        {product.descuentoPorcentaje > 0 && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-full shadow-md tracking-tight">
            <span>{product.descuentoPorcentaje}% OFF</span>
          </div>
        )}
      </div>

      {/* Contenedor de Imagen de Producto */}
      <div className="w-full pt-[100%] relative bg-white flex items-center justify-center p-6 border-b border-slate-100 overflow-hidden">
        <img
          src={product.imagenUrl || "https://http2.mlstatic.com/frontend-assets/ui-navigation/5.22.8/mercadolibre/logo__large_plus.png"}
          alt={product.titulo}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Pill de Envío Gratis */}
        {product.envioGratis && (
          <div className="absolute bottom-2.5 left-3 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md text-[11px] font-semibold">
            <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
            <span>Envío Gratis</span>
          </div>
        )}
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white">
        
        {/* Categoría y Título */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            {product.categoria || "Oferta Especial"}
          </span>
          <h3 
            className="text-slate-800 font-semibold text-sm sm:text-base leading-snug line-clamp-2 mt-1 min-h-[2.6rem] group-hover:text-blue-600 transition-colors"
            title={product.titulo}
          >
            {product.titulo}
          </h3>
        </div>

        {/* Sección de Precios */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          {product.precioOriginal && product.precioOriginal > product.precioOferta ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 line-through">
                {formatPrice(product.precioOriginal)}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                Ahorrás {formatPrice(product.precioOriginal - product.precioOferta)}
              </span>
            </div>
          ) : (
            <div className="h-4" />
          )}

          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatPrice(product.precioOferta)}
            </span>
          </div>
        </div>

        {/* Botón CTA Principal hacia Mercado Libre */}
        <div className="mt-4">
          <a
            href={product.linkAfiliado || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCtaClick}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#3483fa] hover:bg-[#2968c8] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.98]"
          >
            <span>Ver en Mercado Libre</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
