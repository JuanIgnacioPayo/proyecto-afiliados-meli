import { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Scissors, 
  AlertCircle,
  FileImage,
  ArrowRight
} from "lucide-react";
import { processScreenshotWithOcr } from "../services/imageOcrParser";

export default function ScreenshotDropzone({ onDataExtracted }) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [extractedPreview, setExtractedPreview] = useState(null);

  const fileInputRef = useRef(null);

  // Escuchar pegado con Ctrl + V desde el portapapeles
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleImageFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setErrorMsg("El archivo seleccionado no es una imagen válida.");
      return;
    }

    setProcessing(true);
    setErrorMsg(null);
    setExtractedPreview(null);
    setProgressPercent(10);
    setProgressMsg("Iniciando motor OCR de reconocimiento...");

    const result = await processScreenshotWithOcr(file, (percent, msg) => {
      setProgressPercent(percent);
      setProgressMsg(msg);
    });

    if (result.success && result.data) {
      setProgressPercent(100);
      setProgressMsg("¡Información extraída con éxito!");
      setExtractedPreview(result.data);

      if (onDataExtracted) {
        onDataExtracted(result.data);
      }
    } else {
      setErrorMsg(result.error || "No se pudo extraer texto de la imagen.");
    }

    setProcessing(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  const formatPrice = (val) => {
    if (!val) return "-";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-indigo-50/50 p-5 sm:p-6 rounded-3xl border-2 border-dashed border-amber-300 relative overflow-hidden transition-all shadow-xs">
      
      {/* Input oculto para selección manual */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleImageFile(e.target.files[0]);
          }
        }}
      />

      {/* Zona activa de Drop y Click */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !processing && fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? "bg-yellow-200/60 scale-[1.01] border-2 border-yellow-500 shadow-md"
            : "hover:bg-white/70"
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center shadow-sm">
          {processing ? (
            <RefreshCw className="w-7 h-7 animate-spin text-slate-950" />
          ) : (
            <Camera className="w-7 h-7 text-slate-950" />
          )}
        </div>

        <div>
          <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-2">
            <span>Arrastrá un recorte de Mercado Libre o pegalo con</span>
            <kbd className="px-2 py-0.5 bg-slate-900 text-yellow-300 rounded-md font-mono text-xs sm:text-sm shadow-xs">
              Ctrl + V
            </kbd>
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto">
            Hacé <b className="text-slate-800">Win + Shift + S</b> en Mercado Libre, recortá el producto y precios, y pegalo acá. El escáner inteligente autocompletará título, precio anterior, precio de oferta, % OFF y recortará la foto automáticamente.
          </p>
        </div>

        {/* Barra de Progreso OCR */}
        {processing && (
          <div className="w-full max-w-md mt-3 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>{progressMsg}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Previsualización del Resultado Extraído */}
      {extractedPreview && (
        <div className="mt-4 p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
            {extractedPreview.imagenUrl ? (
              <img
                src={extractedPreview.imagenUrl}
                alt=""
                className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                <FileImage className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ Reconocido con éxito
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {extractedPreview.categoria}
                </span>
              </div>
              <h5 className="font-extrabold text-slate-900 text-sm line-clamp-1 mt-0.5" title={extractedPreview.titulo}>
                {extractedPreview.titulo || "Producto Detectado"}
              </h5>
              <div className="flex items-center gap-2 mt-1 text-xs">
                {extractedPreview.precioOriginal && (
                  <span className="text-slate-400 line-through">
                    {formatPrice(extractedPreview.precioOriginal)}
                  </span>
                )}
                <span className="font-black text-slate-900 text-sm">
                  {formatPrice(extractedPreview.precioOferta)}
                </span>
                {extractedPreview.descuentoPorcentaje > 0 && (
                  <span className="font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded text-[11px]">
                    {extractedPreview.descuentoPorcentaje}% OFF
                  </span>
                )}
                {extractedPreview.envioGratis && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                    🚚 Envío Gratis
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex-shrink-0 self-end sm:self-center">
            Campos cargados en el formulario 👇
          </div>
        </div>
      )}

    </div>
  );
}
