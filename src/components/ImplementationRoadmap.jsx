import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  ShoppingBag, 
  Send, 
  Rocket, 
  ExternalLink, 
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { 
  getRoadmapState, 
  saveRoadmapState, 
  calculateProgress 
} from "../services/roadmapService";
import { isFirebaseConfigured, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { testTelegramConnection } from "../services/telegramService";

const ICONS = {
  Layers,
  ShieldCheck,
  ShoppingBag,
  Send,
  Rocket
};

export default function ImplementationRoadmap({ onTaskCompleted, onNavigateTab }) {
  const [fases, setFases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFase, setActiveFase] = useState("fase-1");
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const state = await getRoadmapState();
      setFases(state);

      // Auto-abrir en la primera fase que tenga tareas pendientes
      const primerFasePendiente = state.find(f => 
        f.tareas && f.tareas.some(t => !t.completada)
      );

      if (primerFasePendiente) {
        setActiveFase(primerFasePendiente.id);
      } else if (state.length > 0) {
        setActiveFase(state[state.length - 1].id);
      }

      setLoading(false);
    }
    load();
  }, []);

  const progress = calculateProgress(fases);

  const toggleTask = async (faseId, taskId) => {
    const updated = fases.map(fase => {
      if (fase.id !== faseId) return fase;
      return {
        ...fase,
        tareas: fase.tareas.map(tarea => {
          if (tarea.id !== taskId) return tarea;
          return { ...tarea, completada: !tarea.completada };
        })
      };
    });

    setFases(updated);
    await saveRoadmapState(updated);
    if (onTaskCompleted) {
      onTaskCompleted(calculateProgress(updated));
    }

    // Si la fase actual se completó al 100%, avanzar automáticamente a la siguiente pendiente
    const currentPhase = updated.find(f => f.id === faseId);
    if (currentPhase && currentPhase.tareas.every(t => t.completada)) {
      const nextPending = updated.find(f => f.tareas.some(t => !t.completada));
      if (nextPending) {
        setActiveFase(nextPending.id);
      }
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runFirestoreTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (!isFirebaseConfigured || !db) {
        setTestResult({
          type: "warning",
          message: "Firebase aún no está configurado en .env. Pegá tus credenciales y reiniciá el servidor Vite."
        });
        setIsTesting(false);
        return;
      }
      await setDoc(doc(db, "roadmap_progreso", "test_connection"), {
        fecha: new Date().toISOString(),
        status: "ok"
      });
      setTestResult({
        type: "success",
        message: "¡Conexión con Firestore exitosa! La base de datos responde correctamente."
      });
      await toggleTask("fase-1", "1-4");
    } catch (err) {
      setTestResult({
        type: "error",
        message: `Error al conectar con Firestore: ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const runTelegramTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      setTestResult({
        type: "warning",
        message: "Faltan definir VITE_TELEGRAM_BOT_TOKEN o VITE_TELEGRAM_CHAT_ID en tu archivo .env"
      });
      setIsTesting(false);
      return;
    }

    const res = await testTelegramConnection(token, chatId);
    if (res.success) {
      setTestResult({
        type: "success",
        message: "¡Mensaje enviado a tu Canal de Telegram con éxito!"
      });
      await toggleTask("fase-4", "4-3");
    } else {
      setTestResult({
        type: "error",
        message: `Fallo de Telegram: ${res.description}`
      });
    }
    setIsTesting(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-yellow-500" />
        <span className="text-slate-600 font-medium">Cargando guía de implementación...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      {/* Encabezado del Roadmap */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Asistente de Puesta en Marcha</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Barra de Progreso y Checklist a Producción
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
              Seguí esta guía interactiva paso a paso con accesos directos a la consola de Firebase, Telegram y Mercado Libre para dejar tu negocio 100% operativo.
            </p>
          </div>

          {/* Medidor Circular de Porcentaje */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/15 self-start md:self-auto">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-yellow-400">
                {progress}%
              </div>
              <div className="text-xs text-slate-300 font-medium uppercase tracking-wider">
                Avance Total
              </div>
            </div>
            <div className="w-16 h-16 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-yellow-400 transition-all duration-700 ease-out"
                  strokeDasharray={`${progress}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Barra de Progreso Lineal Animada */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
            <span>Progreso General de Implementación</span>
            <span>{progress === 100 ? "🎉 ¡Todo listo y en producción!" : `${progress}% completado`}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
            <div 
              className="bg-gradient-to-r from-yellow-400 via-amber-300 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alertas de Test en Vivo */}
      {testResult && (
        <div className={`p-4 mx-6 mt-6 rounded-xl flex items-start gap-3 border ${
          testResult.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
            : testResult.type === "warning"
            ? "bg-amber-50 text-amber-900 border-amber-200"
            : "bg-red-50 text-red-900 border-red-200"
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            testResult.type === "success" ? "text-emerald-600" : testResult.type === "warning" ? "text-amber-600" : "text-red-600"
          }`} />
          <div className="text-sm">
            <span className="font-bold block">
              {testResult.type === "success" ? "Resultado Exitoso:" : testResult.type === "warning" ? "Atención Requerida:" : "Error Detectado:"}
            </span>
            <span>{testResult.message}</span>
          </div>
        </div>
      )}

      {/* Lista de Fases y Tareas */}
      <div className="p-6 sm:p-8 space-y-4">
        {fases.map((fase) => {
          const IconComponent = ICONS[fase.icon] || Layers;
          const completedCount = fase.tareas.filter(t => t.completada).length;
          const isAllCompleted = completedCount === fase.tareas.length;
          const isOpen = activeFase === fase.id;

          return (
            <div 
              key={fase.id}
              className={`rounded-xl border transition-all ${
                isOpen 
                  ? "border-indigo-300 shadow-sm bg-slate-50/50" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {/* Header de la Fase */}
              <button
                type="button"
                onClick={() => setActiveFase(isOpen ? null : fase.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${fase.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {fase.titulo}
                      </h3>
                      {isAllCompleted ? (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Completada
                        </span>
                      ) : isOpen ? (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 bg-yellow-100 border border-yellow-300 px-2 py-0.5 rounded-full">
                          ⚡ En Curso
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {fase.descripcion}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-full">
                    {completedCount} / {fase.tareas.length}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Subtareas Desplegables */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-200/70 space-y-3">
                  {fase.tareas.map((tarea) => (
                    <div 
                      key={tarea.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                        tarea.completada 
                          ? "bg-emerald-50/40 border-emerald-200/80" 
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-grow">
                        <button
                          type="button"
                          onClick={() => toggleTask(fase.id, tarea.id)}
                          className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-emerald-600 transition"
                        >
                          {tarea.completada ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                        
                        <div className="min-w-0 w-full space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${
                              tarea.completada ? "text-emerald-950 line-through opacity-80" : "text-slate-900"
                            }`}>
                              {tarea.titulo}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {tarea.detalle}
                          </p>
                          
                          {/* Botones / Enlaces directos a donde tiene que ir el usuario */}
                          {tarea.enlaces && tarea.enlaces.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {tarea.enlaces.map((enlace, idx) => {
                                if (enlace.tab && onNavigateTab) {
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => onNavigateTab(enlace.tab)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-slate-950 rounded-lg text-xs font-bold transition shadow-2xs hover:scale-102"
                                    >
                                      <span>{enlace.texto}</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  );
                                }
                                return (
                                  <a
                                    key={idx}
                                    href={enlace.url}
                                    target={enlace.url.startsWith("http") ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-bold transition shadow-2xs hover:scale-102"
                                  >
                                    <span>{enlace.texto}</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          {/* Ayuda / Snippet con botón de copia */}
                          {tarea.ayuda && (
                            <div className="text-[12px] bg-slate-100 p-2.5 rounded-lg text-slate-700 font-mono flex items-center justify-between gap-2 border border-slate-200">
                              <span className="truncate">{tarea.ayuda}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(tarea.ayuda, tarea.id)}
                                className="text-slate-500 hover:text-slate-800 p-1 flex-shrink-0"
                                title="Copiar ayuda"
                              >
                                {copiedKey === tarea.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botones de Acción / Test Directo */}
                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0">
                        {tarea.accionTest === "testFirestore" && (
                          <button
                            type="button"
                            disabled={isTesting}
                            onClick={runFirestoreTest}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                            <span>Probar Firestore</span>
                          </button>
                        )}

                        {tarea.accionTest === "testTelegram" && (
                          <button
                            type="button"
                            disabled={isTesting}
                            onClick={runTelegramTest}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Probar Canal</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleTask(fase.id, tarea.id)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                            tarea.completada 
                              ? "bg-slate-200 text-slate-700 hover:bg-slate-300" 
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {tarea.completada ? "Desmarcar" : "Marcar Hecho"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
