import { useState, useEffect } from "react";
import { 
  Flame, 
  Search, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  ArrowRight, 
  Sparkles, 
  Calculator, 
  Copy, 
  Check, 
  RefreshCw,
  Sliders,
  DollarSign,
  Video,
  ThumbsUp
} from "lucide-react";
import { 
  CATEGORIAS_RADAR, 
  fetchMeliTrends, 
  calculateOpportunityScore 
} from "../services/nicheRadarService";
import { fetchMeliProductData } from "../services/meliExtractor";

export default function NicheRadar({ onImportToForm }) {
  const [subTab, setSubTab] = useState("tendencias"); // 'tendencias' | 'evaluador' | 'simulador'
  
  // Estado de Tendencias
  const [selectedCat, setSelectedCat] = useState("TODAS");
  const [trends, setTrends] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Estado del Evaluador
  const [productUrl, setProductUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [evalResult, setEvalResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Estado del Simulador
  const [views, setViews] = useState(15000);
  const [ctrProfile, setCtrProfile] = useState(2.5); // % que va al link in bio
  const [crMeli, setCrMeli] = useState(3.0); // % que compra en MeLi
  const [avgTicket, setAvgTicket] = useState(55000); // Ticket en ARS
  const [commissionRate, setCommissionRate] = useState(8); // % de comisión

  // Cargar tendencias al cambiar de categoría
  useEffect(() => {
    async function loadTrends() {
      setLoadingTrends(true);
      const catObj = CATEGORIAS_RADAR.find(c => c.id === selectedCat);
      const data = await fetchMeliTrends(catObj?.categoryId);
      setTrends(data || []);
      setLoadingTrends(false);
    }
    loadTrends();
  }, [selectedCat]);

  // Escanear Producto
  const handleScanProduct = async (urlOverride = null) => {
    const targetUrl = urlOverride || productUrl;
    if (!targetUrl.trim()) return;

    setScanning(true);
    setScanError(null);
    setScannedProduct(null);
    setEvalResult(null);

    const res = await fetchMeliProductData(targetUrl);
    if (res.success) {
      setScannedProduct(res);
      const evaluation = calculateOpportunityScore(res);
      setEvalResult(evaluation);
    } else {
      setScanError(res.error || "No se pudo extraer la información del producto.");
    }
    setScanning(false);
  };

  // Copiar guión al portapapeles
  const handleCopyScript = () => {
    if (!evalResult?.guion) return;
    const fullScript = `🎬 GUION SUGERIDO PARA REEL / TIKTOK:
GANCHO (0-3s): ${evalResult.guion.gancho}
DESARROLLO: ${evalResult.guion.desarrollo}
LLAMADO A LA ACCIÓN: ${evalResult.guion.llamadoAccion}`;
    navigator.clipboard.writeText(fullScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Cálculos del simulador
  const clicksAlHub = Math.round(views * (ctrProfile / 100));
  const ventasEstimadas = Number((clicksAlHub * (crMeli / 100)).toFixed(1));
  const facturacionTotal = Math.round(ventasEstimadas * avgTicket);
  const gananciaComision = Math.round(facturacionTotal * (commissionRate / 100));

  const formatPrice = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      
      {/* Encabezado del Radar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-slate-950 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Herramienta Estratégica</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Radar de Nichos y Cazador de Ganadores
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
              Descubrí qué está buscando la gente en Mercado Libre Argentina, analizá si un producto tiene potencial viral y calculá tus ganancias estimadas antes de grabar.
            </p>
          </div>

          {/* Selector de Sub-pestañas */}
          <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setSubTab("tendencias")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                subTab === "tendencias" 
                  ? "bg-yellow-400 text-slate-950 shadow-sm" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Tendencias en Vivo</span>
            </button>
            <button
              onClick={() => setSubTab("evaluador")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                subTab === "evaluador" 
                  ? "bg-yellow-400 text-slate-950 shadow-sm" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Cazador de Links</span>
            </button>
            <button
              onClick={() => setSubTab("simulador")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                subTab === "simulador" 
                  ? "bg-yellow-400 text-slate-950 shadow-sm" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Simulador \$</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO 1: TENDENCIAS EN VIVO */}
      {subTab === "tendencias" && (
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Palabras y Productos Más Buscados en Mercado Libre Argentina
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Datos extraídos de la API de tendencias. Elegí un nicho para ver qué productos tienen alta demanda hoy:
            </p>
          </div>

          {/* Pills de Categorías del Radar */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS_RADAR.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                  selectedCat === cat.id
                    ? "bg-slate-900 text-yellow-300 border-slate-900 shadow-sm scale-102"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Grilla de Tendencias */}
          {loadingTrends ? (
            <div className="py-12 flex items-center justify-center gap-3 text-slate-500 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin text-yellow-500" />
              <span>Consultando tendencias en Mercado Libre...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trends.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm capitalize truncate">
                      {item.keyword}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition"
                      title="Ver publicaciones en Mercado Libre"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        setProductUrl(item.url);
                        setSubTab("evaluador");
                      }}
                      className="text-[11px] font-bold text-slate-700 hover:text-indigo-600 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs"
                      title="Probar en el Evaluador"
                    >
                      Evaluar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tip Pro */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
            <Flame className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">💡 Consejo para tus Reels y TikToks:</span>
              Cuando un término está acá arriba, significa que <b>la gente ya tiene la intención de compra</b>. Si hacés un video mostrando cómo funciona ese producto y decís <i>"Buscá el código #10X en mi web para el link con descuento"</i>, la tasa de conversión se multiplica por 3.
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: CAZADOR Y EVALUADOR DE LINKS (SCORE 0-100) */}
      {subTab === "evaluador" && (
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Evaluador de Potencial Viral y Conversión (Score de Afiliado)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pegá el link de cualquier publicación de Mercado Libre para analizar si cumple los 4 pilares ganadores:
            </p>
          </div>

          {/* Input de Análisis */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              placeholder="Pegá el link de Mercado Libre (ej: https://articulo.mercadolibre.com.ar/MLA-...)"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              className="flex-grow px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 text-sm"
            />
            <button
              onClick={() => handleScanProduct()}
              disabled={scanning || !productUrl.trim()}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-yellow-300 font-extrabold text-sm rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0"
            >
              {scanning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
              ) : (
                <Zap className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              )}
              <span>{scanning ? "Analizando..." : "Escanear Producto"}</span>
            </button>
          </div>

          {scanError && (
            <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Resultado de la Evaluación */}
          {evalResult && scannedProduct && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-6">
              
              {/* Tarjeta de Resumen con Score */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={scannedProduct.imagenUrl}
                    alt=""
                    className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1 bg-white flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {scannedProduct.mlItemId} • {scannedProduct.categoria}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                      {scannedProduct.titulo}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatPrice(scannedProduct.precioOferta)}
                      </span>
                      {scannedProduct.descuentoPorcentaje > 0 && (
                        <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {scannedProduct.descuentoPorcentaje}% OFF
                        </span>
                      )}
                      {scannedProduct.envioGratis && (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          🚚 Envío Gratis
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Termómetro de Score */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center sm:text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${evalResult.badgeColor}`}>
                      {evalResult.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                      Puntaje de Oportunidad
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 text-yellow-300 flex items-center justify-center font-black text-2xl shadow-inner">
                    {evalResult.score}
                  </div>
                </div>
              </div>

              {/* Desglose de Factores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {evalResult.breakdown.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-slate-700 leading-tight">
                      {item.factor}
                    </span>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Puntaje:</span>
                      <span className={`font-black text-xs px-2 py-0.5 rounded ${
                        item.status === "good" ? "bg-emerald-100 text-emerald-800" : item.status === "neutral" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                      }`}>
                        +{item.pts} / {item.max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pros y Contras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/70 space-y-2">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Puntos Fuertes para el Video
                  </span>
                  <ul className="text-xs text-emerald-950 space-y-1 pl-4 list-disc">
                    {evalResult.pros.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/70 space-y-2">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    A tener en cuenta
                  </span>
                  <ul className="text-xs text-amber-950 space-y-1 pl-4 list-disc">
                    {evalResult.contras.length > 0 ? (
                      evalResult.contras.map((c, idx) => <li key={idx}>{c}</li>)
                    ) : (
                      <li>No se detectaron objeciones críticas. ¡Producto muy limpio!</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Guion Sugerido para Grabar */}
              <div className="bg-indigo-950 text-white p-5 rounded-2xl relative overflow-hidden space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-yellow-400">
                      Guion Express para tu Reel / TikTok
                    </span>
                  </div>
                  <button
                    onClick={handleCopyScript}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? "Copiado" : "Copiar Guion"}</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-200">
                  <p><b className="text-yellow-300">🎣 Gancho (0 a 3s):</b> "{evalResult.guion.gancho}"</p>
                  <p><b className="text-slate-100">📦 Demostración:</b> "{evalResult.guion.desarrollo}"</p>
                  <p><b className="text-emerald-300">👉 Llamado a la Acción (CTA):</b> "{evalResult.guion.llamadoAccion}"</p>
                </div>
              </div>

              {/* Botón de Importar al Hub con 1 Clic */}
              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => {
                    if (onImportToForm) {
                      onImportToForm({
                        ...scannedProduct,
                        originalMeliUrl: productUrl
                      });
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-[#3483fa] hover:bg-[#2968c8] text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 hover:scale-102"
                >
                  <span>📥 Importar al Formulario de Nueva Oferta</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* CONTENIDO 3: SIMULADOR DE INGRESOS */}
      {subTab === "simulador" && (
        <div className="p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Simulador de Ingresos y Rentabilidad por Video
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Proyectá tus ganancias estimadas en pesos argentinos ajustando el alcance del video y el ticket del producto:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Controles de Entrada */}
            <div className="lg:col-span-2 space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              
              {/* Slider 1: Vistas */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Vistas Estimadas en Reel / TikTok</span>
                  <span className="text-indigo-600 font-extrabold text-sm">{views.toLocaleString("es-AR")} vistas</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="200000"
                  step="1000"
                  value={views}
                  onChange={(e) => setViews(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Slider 2: CTR */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>% de Espectadores que van al Hub (CTR a la Bio)</span>
                  <span className="text-indigo-600 font-extrabold text-sm">{ctrProfile}% ({clicksAlHub} visitas al Hub)</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={ctrProfile}
                  onChange={(e) => setCtrProfile(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Slider 3: Ticket */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Precio Promedio del Producto (Ticket en ARS)</span>
                  <span className="text-indigo-600 font-extrabold text-sm">{formatPrice(avgTicket)}</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="250000"
                  step="5000"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Slider 4: Comisión */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Tasa de Comisión de Afiliado MeLi</span>
                  <span className="text-indigo-600 font-extrabold text-sm">{commissionRate}%</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="15"
                  step="1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="text-[11px] text-slate-600 block mt-1">
                  El programa de afiliados de MeLi paga entre 5% y 14% según la categoría.
                </span>
              </div>

            </div>

            {/* Tarjeta de Ganancias Proyectadas */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl flex flex-col justify-between shadow-xl border border-indigo-900">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 block mb-1">
                  Ganancia Estimada por Video
                </span>
                <div className="text-3xl sm:text-4xl font-black text-yellow-300">
                  {formatPrice(gananciaComision)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  En base a una tasa de conversión promedio en Mercado Libre del {crMeli}%.
                </p>
              </div>

              <div className="my-6 space-y-2.5 pt-6 border-t border-white/10 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Clics dirigidos al Hub:</span>
                  <span className="font-bold text-white">{clicksAlHub}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ventas generadas estimadas:</span>
                  <span className="font-bold text-emerald-400">~{ventasEstimadas} compras</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Facturación total MeLi:</span>
                  <span className="font-bold text-white">{formatPrice(facturacionTotal)}</span>
                </div>
              </div>

              <div className="p-3 bg-white/10 rounded-xl text-[11px] text-slate-300">
                🚀 <b>Potencial mensual:</b> Publicando 1 Reel diario (30 videos al mes), con solo 5 videos que alcancen este rendimiento superarías los <b>{formatPrice(gananciaComision * 5)}</b> mensuales.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
