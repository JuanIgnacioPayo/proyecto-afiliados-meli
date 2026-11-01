import { useState, useEffect, useMemo } from "react";
import { 
  PlusCircle, 
  TrendingUp, 
  MousePointerClick, 
  ShoppingBag, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Zap, 
  Lock, 
  LogOut, 
  LogIn, 
  Edit3,
  Sliders,
  DollarSign,
  Compass
} from "lucide-react";
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getNextNumericCode 
} from "../services/productService";
import { fetchMeliProductData } from "../services/meliExtractor";
import { sendTelegramOffer } from "../services/telegramService";
import ImplementationRoadmap from "../components/ImplementationRoadmap";
import NicheRadar from "../components/NicheRadar";
import ScreenshotDropzone from "../components/ScreenshotDropzone";
import { auth, googleProvider, isFirebaseConfigured } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

export default function AdminDashboard() {
  // Estado de Autenticación
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  // Estado de Datos y Formularios
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeTab, setActiveTab] = useState("roadmap"); // 'roadmap' | 'catalogo' | 'nuevo'

  // Formulario de Carga
  const [formData, setFormData] = useState({
    codigoNumerico: 101,
    titulo: "",
    linkAfiliado: "",
    originalMeliUrl: "",
    mlItemId: "",
    imagenUrl: "",
    precioOriginal: "",
    precioOferta: "",
    descuentoPorcentaje: 0,
    categoria: "Tecnología",
    envioGratis: false,
    destacado: false,
    enviarTelegram: true
  });

  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [sendingTelegramId, setSendingTelegramId] = useState(null);

  // Escuchar estado de autenticación
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setAuthLoading(false);
      });
      return () => unsub();
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleImportFromRadar = (product) => {
    setFormData(prev => ({
      ...prev,
      titulo: product.titulo || prev.titulo,
      mlItemId: product.mlItemId || prev.mlItemId,
      originalMeliUrl: product.originalMeliUrl || product.permalink || prev.originalMeliUrl,
      imagenUrl: product.imagenUrl || prev.imagenUrl,
      precioOriginal: product.precioOriginal || prev.precioOriginal,
      precioOferta: product.precioOferta || prev.precioOferta,
      descuentoPorcentaje: product.descuentoPorcentaje || prev.descuentoPorcentaje,
      categoria: product.categoria || prev.categoria,
      envioGratis: product.envioGratis ?? prev.envioGratis
    }));
    setActiveTab("nuevo");
    setFeedbackMessage({
      type: "success",
      text: "¡Producto importado desde el Radar! Ahora pegá tu link de afiliado meli.la y guardá la oferta."
    });
  };

  const handleScreenshotDataExtracted = (data) => {
    setFormData(prev => ({
      ...prev,
      titulo: data.titulo || prev.titulo,
      precioOriginal: data.precioOriginal || prev.precioOriginal,
      precioOferta: data.precioOferta || prev.precioOferta,
      descuentoPorcentaje: data.descuentoPorcentaje || prev.descuentoPorcentaje,
      categoria: data.categoria || prev.categoria,
      envioGratis: data.envioGratis ?? prev.envioGratis,
      imagenUrl: data.imagenUrl || prev.imagenUrl
    }));
    setFeedbackMessage({
      type: "success",
      text: "¡Captura procesada con éxito! Título, precios, descuento y foto cargados en el formulario."
    });
  };

  // Cargar productos
  const loadData = async () => {
    setLoadingProducts(true);
    const data = await getProducts();
    setProducts(data || []);
    // Actualizar sugerencia del próximo código
    const nextCode = getNextNumericCode(data);
    setFormData(prev => ({ ...prev, codigoNumerico: nextCode }));
    setLoadingProducts(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Validación de Administrador
  const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();
  const isAdmin = useMemo(() => {
    if (devBypass) return true;
    if (!isFirebaseConfigured) return true; // Modo de desarrollo inicial
    if (!currentUser) return false;
    if (!configuredAdminEmail || configuredAdminEmail === "admin@ejemplo.com") return true;
    const allowed = configuredAdminEmail.split(",").map(e => e.trim().toLowerCase());
    return allowed.includes(currentUser.email?.toLowerCase());
  }, [currentUser, configuredAdminEmail, devBypass]);

  // Manejo de Login con Google
  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured || !auth) {
      setFeedbackMessage({
        type: "warning",
        text: "Firebase no tiene credenciales válidas en .env. Usando acceso de desarrollo local."
      });
      setDevBypass(true);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setFeedbackMessage({ type: "error", text: `Error de login: ${err.message}` });
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setDevBypass(false);
  };

  // Cálculo de Métricas
  const metrics = useMemo(() => {
    const total = products.length;
    const activos = products.filter(p => p.activo !== false).length;
    const clicsTotales = products.reduce((acc, p) => acc + (p.clicsContador || 0), 0);
    const top5 = [...products]
      .sort((a, b) => (b.clicsContador || 0) - (a.clicsContador || 0))
      .slice(0, 5);
    return { total, activos, clicsTotales, top5 };
  }, [products]);

  // Autocompletar con Extractor de Mercado Libre
  const handleAutoExtract = async () => {
    const urlToUse = formData.originalMeliUrl?.trim() || formData.linkAfiliado?.trim();
    if (!urlToUse) {
      setFeedbackMessage({
        type: "error",
        text: "Pegá primero el enlace del producto en Mercado Libre (ej: articulo.mercadolibre.com.ar/MLA-...) o el código MLA para autocompletar."
      });
      return;
    }

    setExtracting(true);
    setFeedbackMessage(null);

    try {
      const res = await fetchMeliProductData(urlToUse);
      if (res.success) {
        setFormData(prev => ({
          ...prev,
          titulo: res.titulo || prev.titulo,
          mlItemId: res.mlItemId || prev.mlItemId,
          imagenUrl: res.imagenUrl || prev.imagenUrl,
          precioOriginal: res.precioOriginal || prev.precioOriginal,
          precioOferta: res.precioOferta || prev.precioOferta,
          descuentoPorcentaje: res.descuentoPorcentaje || prev.descuentoPorcentaje,
          categoria: res.categoria || prev.categoria,
          envioGratis: res.envioGratis ?? prev.envioGratis,
          originalMeliUrl: prev.originalMeliUrl || res.permalink || urlToUse
        }));
        setFeedbackMessage({
          type: "success",
          text: res.aviso 
            ? `⚡ ${res.aviso}` 
            : `¡Datos extraídos con éxito! Publicación: ${res.mlItemId}`
        });
      } else {
        setFeedbackMessage({
          type: "warning",
          text: res.error
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: `Error al extraer datos: ${err.message}`
      });
    } finally {
      setExtracting(false);
    }
  };

  // Recalcular % de descuento automáticamente al cambiar precios
  const handlePriceChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      const orig = Number(field === "precioOriginal" ? value : prev.precioOriginal);
      const ofer = Number(field === "precioOferta" ? value : prev.precioOferta);
      if (orig && ofer && orig > ofer) {
        updated.descuentoPorcentaje = Math.round(((orig - ofer) / orig) * 100);
      } else {
        updated.descuentoPorcentaje = 0;
      }
      return updated;
    });
  };

  // Guardar nuevo producto
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.linkAfiliado || !formData.precioOferta) {
      setFeedbackMessage({
        type: "error",
        text: "Completá como mínimo el Título, el Link de Afiliado y el Precio de Oferta."
      });
      return;
    }

    setSubmitting(true);
    setFeedbackMessage(null);

    try {
      const created = await createProduct(formData);

      // Si está activo el switch de Telegram, enviar automáticamente
      let telegramStatus = "no_solicitado";
      if (formData.enviarTelegram) {
        const tgRes = await sendTelegramOffer(created);
        if (tgRes.success) {
          telegramStatus = "enviado";
          await updateProduct(created.id, { publicadoTelegram: true });
        } else {
          telegramStatus = `error: ${tgRes.error}`;
        }
      }

      setFeedbackMessage({
        type: "success",
        text: `¡Oferta #${created.codigoNumerico} guardada exitosamente! ${
          telegramStatus === "enviado" ? "Publicada en el canal de Telegram." : ""
        }`
      });

      // Recargar lista y limpiar formulario
      await loadData();
      setActiveTab("catalogo");
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: `Error al guardar producto: ${err.message}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Disparar envío a Telegram de un producto existente
  const handleManualTelegramSend = async (product) => {
    setSendingTelegramId(product.id);
    const res = await sendTelegramOffer(product);
    if (res.success) {
      await updateProduct(product.id, { publicadoTelegram: true });
      await loadData();
      setFeedbackMessage({
        type: "success",
        text: `¡Oferta #${product.codigoNumerico} enviada a Telegram!`
      });
    } else {
      setFeedbackMessage({
        type: "error",
        text: `No se pudo enviar a Telegram: ${res.error}`
      });
    }
    setSendingTelegramId(null);
  };

  // Alternar estado activo / pausado
  const handleToggleActive = async (product) => {
    const newState = !product.activo;
    await updateProduct(product.id, { activo: newState });
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, activo: newState } : p));
  };

  // Borrar producto
  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que querés eliminar esta oferta?")) {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(`#${code}`);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const formatPrice = (val) => {
    if (!val && val !== 0) return "-";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Si está cargando autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <RefreshCw className="w-5 h-5 animate-spin text-yellow-500" />
          <span className="text-slate-700 font-semibold">Verificando credenciales...</span>
        </div>
      </div>
    );
  }

  // Pantalla de Bloqueo si no está autenticado como administrador
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto text-yellow-600 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">Acceso de Administrador</h2>
            <p className="text-slate-500 text-sm mt-1">
              Esta sección está restringida exclusivamente al dueño del Hub de Afiliados.
            </p>
          </div>

          {currentUser ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left">
              <span className="font-bold block">Acceso denegado</span>
              El correo <b>{currentUser.email}</b> no figura en la variable <code>VITE_ADMIN_EMAIL</code>.
            </div>
          ) : null}

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow transition"
            >
              <LogIn className="w-5 h-5 text-yellow-400" />
              <span>Iniciar Sesión con Google</span>
            </button>

            <button
              onClick={() => setDevBypass(true)}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl transition"
            >
              🛠️ Modo Desarrollo Local (Bypass temporal)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      
      {/* Barra Superior del Panel */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-slate-900 flex items-center justify-center font-black">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white">Panel de Control de Afiliados</h1>
              <p className="text-xs text-slate-400">
                {currentUser?.email ? `Admin: ${currentUser.email}` : "Modo Desarrollador Local"}
              </p>
            </div>
          </div>

          {/* Selector de Pestañas Principales */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab("roadmap")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "roadmap" 
                  ? "bg-yellow-400 text-slate-950 shadow-sm" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Progreso</span>
            </button>
            <button
              onClick={() => setActiveTab("radar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "radar" 
                  ? "bg-yellow-400 text-slate-950 shadow-sm" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>🎯 Radar Nichos</span>
            </button>
            <button
              onClick={() => setActiveTab("catalogo")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "catalogo" 
                  ? "bg-yellow-400 text-slate-950 shadow-sm" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Catálogo ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("nuevo")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "nuevo" 
                  ? "bg-yellow-400 text-slate-950 shadow-sm" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nueva Oferta</span>
            </button>
          </div>

          {/* Salir */}
          {(currentUser || devBypass) && (
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-800 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>

      {/* Notificaciones Globales Feedback */}
      {feedbackMessage && (
        <div className={`py-3 px-6 text-sm font-semibold flex items-center justify-between shadow-xs ${
          feedbackMessage.type === "success" 
            ? "bg-emerald-600 text-white" 
            : feedbackMessage.type === "warning"
            ? "bg-amber-500 text-white"
            : "bg-red-600 text-white"
        }`}>
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-white/80 hover:text-white text-xs">
            Cerrar ✕
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-8">
        
        {/* KPI Cards: Dashboard de Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Productos Activos
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {metrics.activos} <span className="text-sm font-semibold text-slate-600">/ {metrics.total}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clics a Mercado Libre
              </span>
              <div className="text-3xl font-black text-emerald-600 mt-1">
                {metrics.clicsTotales}
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <MousePointerClick className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Promedio Clics / Item
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {metrics.total > 0 ? (metrics.clicsTotales / metrics.total).toFixed(1) : 0}
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Canal Telegram
              </span>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {import.meta.env.VITE_TELEGRAM_CHAT_ID ? "Conectado" : "Pendiente .env"}
              </div>
              <span className="text-[11px] text-slate-600">Publicaciones automáticas</span>
            </div>
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* TAB 1: Barra de Progreso Dinámica y Checklist */}
        {activeTab === "roadmap" && (
          <ImplementationRoadmap onTaskCompleted={loadData} onNavigateTab={setActiveTab} />
        )}

        {/* TAB 2: Radar de Nichos y Cazador de Ganadores */}
        {activeTab === "radar" && (
          <NicheRadar onImportToForm={handleImportFromRadar} />
        )}

        {/* TAB 3: Formulario de Carga Rápida de Nuevas Ofertas */}
        {activeTab === "nuevo" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Cargar Nueva Oferta de Afiliado
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Pegá el link de Mercado Libre para autocompletar foto, título y descuentos al instante.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-600 font-semibold block">Próximo Código</span>
                <span className="text-lg font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                  #{formData.codigoNumerico}
                </span>
              </div>
            </div>

            {/* Escáner Inteligente de Captura / OCR */}
            <div className="mb-6">
              <ScreenshotDropzone onDataExtracted={handleScreenshotDataExtracted} />
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-6">
              
              {/* Sección 1: Links e Integración */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
                {/* Paso 1: Link original para extraer */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    1. Enlace del Producto en Mercado Libre o Código MLA (para autocompletar)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://articulo.mercadolibre.com.ar/MLA-... o MLA12345678"
                      value={formData.originalMeliUrl}
                      onChange={(e) => setFormData({ ...formData, originalMeliUrl: e.target.value })}
                      className="flex-grow px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 text-sm"
                    />
                    <button
                      type="button"
                      disabled={extracting}
                      onClick={handleAutoExtract}
                      className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 flex-shrink-0"
                    >
                      <Zap className={`w-4 h-4 fill-slate-950 ${extracting ? "animate-spin" : ""}`} />
                      <span>{extracting ? "Extrayendo..." : "Autocompletar"}</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Pegá el enlace directo del producto (o su código MLA) y presioná "Autocompletar" para cargar foto, título y precio.
                  </span>
                </div>

                {/* Paso 2: Link de afiliado */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      2. Link de Afiliado Oficial (meli.la/...) *
                    </label>
                    <a
                      href="https://www.mercadolibre.com.ar/afiliados/hub?is_affiliate=true#menu-user"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-lg transition"
                      title="Abrir tu panel oficial de Afiliados de MeLi"
                    >
                      <span>Abrir Hub de Afiliados MeLi</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://meli.la/2abc123"
                    value={formData.linkAfiliado}
                    onChange={(e) => setFormData({ ...formData, linkAfiliado: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 text-sm"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Es el enlace con tu cookie de afiliado donde Mercado Libre te acredita las comisiones.
                  </span>
                </div>
              </div>

              {/* Sección 2: Datos de la Oferta */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Código #
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.codigoNumerico}
                      onChange={(e) => setFormData({ ...formData, codigoNumerico: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Título del Producto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Auriculares Inalámbricos Bluetooth Pro"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600 text-sm"
                    />
                  </div>
                </div>

                {/* Precios y Descuento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Precio Anterior ($ ARS)
                    </label>
                    <input
                      type="number"
                      placeholder="85000"
                      value={formData.precioOriginal}
                      onChange={(e) => handlePriceChange("precioOriginal", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Precio de Oferta ($ ARS) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="59990"
                      value={formData.precioOferta}
                      onChange={(e) => handlePriceChange("precioOferta", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-emerald-700 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      % de Descuento
                    </label>
                    <input
                      type="number"
                      value={formData.descuentoPorcentaje}
                      onChange={(e) => setFormData({ ...formData, descuentoPorcentaje: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
                    />
                  </div>
                </div>

                {/* Imagen y Categoría */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      URL de la Foto (Alta Resolución)
                    </label>
                    <input
                      type="url"
                      placeholder="https://http2.mlstatic.com/..."
                      value={formData.imagenUrl}
                      onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Categoría
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 text-sm"
                    >
                      <option value="Tecnología">Tecnología</option>
                      <option value="Hogar">Hogar</option>
                      <option value="Moda y Calzado">Moda y Calzado</option>
                      <option value="Belleza">Belleza y Cuidado</option>
                      <option value="Herramientas">Herramientas</option>
                      <option value="Deportes">Deportes</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                {/* Toggles y Switches */}
                <div className="pt-2 flex flex-wrap gap-6 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.envioGratis}
                      onChange={(e) => setFormData({ ...formData, envioGratis: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">🚚 Envío Gratis</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.destacado}
                      onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                      className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-400"
                    />
                    <span className="text-xs font-semibold text-slate-700">⭐ Oferta Destacada</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
                    <input
                      type="checkbox"
                      checked={formData.enviarTelegram}
                      onChange={(e) => setFormData({ ...formData, enviarTelegram: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-xs font-bold text-sky-900 flex items-center gap-1">
                      <Send className="w-3.5 h-3.5 text-sky-600" />
                      Publicar automáticamente en Telegram al guardar
                    </span>
                  </label>
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("catalogo")}
                  className="px-5 py-3 text-slate-600 font-bold text-sm hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-[#3483fa] hover:bg-[#2968c8] text-white font-black text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submitting ? "Guardando..." : "Guardar y Publicar Oferta"}</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* TAB 3: Catálogo y Tabla de Gestión de Productos */}
        {activeTab === "catalogo" && (
          <div className="space-y-6">
            
            {/* Top 5 Ranking de Clics */}
            {metrics.top5.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Ranking de Conversión: Top 5 Productos Más Clickeados
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {metrics.top5.map((p, idx) => (
                    <div 
                      key={p.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>#{idx + 1} Top</span>
                        <span className="text-yellow-600 bg-yellow-100 px-1.5 py-0.2 rounded font-black">
                          #{p.codigoNumerico}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
                        {p.titulo}
                      </h4>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-slate-600">Clics:</span>
                        <span className="font-black text-emerald-600 text-sm">{p.clicsContador || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla de Productos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Listado de Ofertas Registradas</h3>
                  <p className="text-xs text-slate-500">
                    Administrá el estado, revisá clics o dispará alertas directas a tu canal.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("nuevo")}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nueva Oferta</span>
                </button>
              </div>

              {loadingProducts ? (
                <div className="p-8 text-center text-slate-500 text-sm">Cargando productos...</div>
              ) : products.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-700">No hay productos cargados todavía.</p>
                  <button
                    onClick={() => setActiveTab("nuevo")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    Cargar el primer producto
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4">Precio Oferta</th>
                        <th className="py-3 px-4 text-center">Clics</th>
                        <th className="py-3 px-4 text-center">Telegram</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          
                          {/* Código # */}
                          <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                            <button
                              onClick={() => handleCopyCode(p.codigoNumerico, p.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-yellow-300 rounded-md font-mono text-xs hover:scale-105 transition"
                              title="Copiar código para Reel"
                            >
                              <span>#{p.codigoNumerico}</span>
                              {copiedCodeId === p.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </td>

                          {/* Foto + Título */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.imagenUrl}
                                alt=""
                                className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 line-clamp-1 block" title={p.titulo}>
                                  {p.titulo}
                                </span>
                                <span className="text-[11px] text-slate-600 block">
                                  {p.categoria}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Precios */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {formatPrice(p.precioOferta)}
                            </div>
                            {p.descuentoPorcentaje > 0 && (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                                {p.descuentoPorcentaje}% OFF
                              </span>
                            )}
                          </td>

                          {/* Contador de Clics */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full text-xs">
                              <MousePointerClick className="w-3 h-3" />
                              {p.clicsContador || 0}
                            </span>
                          </td>

                          {/* Estado en Telegram */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              disabled={sendingTelegramId === p.id}
                              onClick={() => handleManualTelegramSend(p)}
                              className={`p-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition ${
                                p.publicadoTelegram
                                  ? "text-sky-700 bg-sky-50 hover:bg-sky-100"
                                  : "text-slate-400 hover:text-sky-600 bg-slate-100"
                              }`}
                              title={p.publicadoTelegram ? "Ya enviado a Telegram (clic para reenviar)" : "Publicar en Telegram"}
                            >
                              <Send className={`w-3.5 h-3.5 ${sendingTelegramId === p.id ? "animate-bounce" : ""}`} />
                              <span className="text-[10px]">
                                {p.publicadoTelegram ? "Enviado" : "Enviar"}
                              </span>
                            </button>
                          </td>

                          {/* Estado Activo / Pausado */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleActive(p)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                p.activo !== false
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {p.activo !== false ? "Activo" : "Pausado"}
                            </button>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={p.linkAfiliado}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                                title="Ver link de afiliado"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"
                                title="Eliminar oferta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
