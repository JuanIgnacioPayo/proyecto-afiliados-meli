import { Link, useLocation } from "react-router-dom";
import { Zap, Shield, ShoppingBag, ArrowLeft } from "lucide-react";

export default function Navbar({ onSearchChange, searchTerm }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 bg-[#FFE600] border-b border-yellow-400 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo y Nombre */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-yellow-400 flex items-center justify-center font-black text-xl shadow-sm group-hover:scale-105 transition transform">
              <Zap className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight block">
                MELI<span className="text-blue-700">OFERTAS</span>
              </span>
              <span className="text-[10px] font-bold text-slate-800 tracking-wider uppercase block">
                Hub de Afiliados AR
              </span>
            </div>
          </Link>

          {/* Acceso a Admin o Volver a Vidriera */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ver Vidriera Pública</span>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 rounded-xl text-xs sm:text-sm font-bold transition border border-slate-900/10"
                title="Panel de Administración y Roadmap"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Panel Admin</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
