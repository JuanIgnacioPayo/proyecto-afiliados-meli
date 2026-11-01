import { useState, useEffect, useMemo } from "react";
import { Search, Flame, Sparkles, Filter, X, Tag, TrendingUp, ShieldCheck } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { getProducts, trackProductClick } from "../services/productService";

const CATEGORIAS_PILLS = [
  "Todas",
  "🔥 Ofertas Relámpago",
  "Tecnología",
  "Hogar",
  "Moda y Calzado",
  "Belleza",
  "Herramientas"
];

export default function PublicCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("nuevo");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getProducts();
      setProducts(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const handleTrackClick = async (product) => {
    await trackProductClick(product.id);
  };

  // Filtrado y búsqueda instantánea (soporta "105", "#105", títulos y categorías)
  const filteredProducts = useMemo(() => {
    let list = [...products].filter(p => p.activo !== false);

    // Filtro por categoría o "Ofertas Relámpago"
    if (selectedCategory === "🔥 Ofertas Relámpago") {
      list = list.filter(p => p.destacado || p.descuentoPorcentaje >= 25);
    } else if (selectedCategory !== "Todas") {
      list = list.filter(p => p.categoria?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const cleanSearch = searchTerm.trim().toLowerCase().replace("#", "");
      list = list.filter(p => {
        const codeMatch = String(p.codigoNumerico || "").toLowerCase() === cleanSearch;
        const codeContains = String(p.codigoNumerico || "").includes(cleanSearch);
        const titleMatch = (p.titulo || "").toLowerCase().includes(cleanSearch);
        const catMatch = (p.categoria || "").toLowerCase().includes(cleanSearch);
        return codeMatch || codeContains || titleMatch || catMatch;
      });
    }

    // Ordenamiento
    if (sortBy === "descuento") {
      list.sort((a, b) => (b.descuentoPorcentaje || 0) - (a.descuentoPorcentaje || 0));
    } else if (sortBy === "precio_menor") {
      list.sort((a, b) => (a.precioOferta || 0) - (b.precioOferta || 0));
    } else if (sortBy === "popular") {
      list.sort((a, b) => (b.clicsContador || 0) - (a.clicsContador || 0));
    } else {
      // Por defecto: Más recientes o código más alto
      list.sort((a, b) => (b.codigoNumerico || 0) - (a.codigoNumerico || 0));
    }

    return list;
  }, [products, selectedCategory, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Hero Banner Mobile-First Orientado a Tráfico de Redes */}
      <div className="bg-gradient-to-b from-[#FFE600] to-yellow-300/80 px-4 pt-6 pb-10 border-b border-yellow-400">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-yellow-300 rounded-full text-xs font-black uppercase tracking-wider mb-3 shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>Selección Diaria de Ofertas Reales</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            ¿Viste un Reel o TikTok? <br className="hidden sm:inline" />
            <span className="text-blue-800">Buscá acá por número de código</span>
          </h1>
          
          <p className="mt-2 text-slate-800 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Ingresá el número que viste en el video (ej: <span className="font-bold underline decoration-slate-900">101</span> o <span className="font-bold underline decoration-slate-900">#105</span>) y accedé al link oficial con descuento asegurado.
          </p>

          {/* Buscador Prominente Instantáneo */}
          <div className="mt-6 max-w-2xl mx-auto relative">
            <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden bg-white border-2 border-slate-900 focus-within:border-blue-600 transition">
              <div className="pl-4 pr-2 text-slate-400 flex items-center justify-center">
                <Search className="w-6 h-6 text-slate-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Escribí el código (ej: 105) o qué producto buscás..."
                className="w-full py-4 pr-12 text-slate-900 placeholder-slate-400 font-semibold text-base sm:text-lg focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Sugerencias Rápidas de Códigos */}
            <div className="mt-2.5 flex items-center justify-center flex-wrap gap-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-600">Populares:</span>
              {products.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  onClick={() => setSearchTerm(String(p.codigoNumerico))}
                  className="px-2 py-0.5 bg-white/80 hover:bg-white rounded-md text-slate-800 border border-slate-300 shadow-2xs hover:scale-105 transition"
                >
                  #{p.codigoNumerico}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        
        {/* Barra de Filtros y Categorías (Pills) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          
          {/* Pills de Categorías Scrolleables en Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIAS_PILLS.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-2xs ${
                    isSelected
                      ? "bg-slate-900 text-yellow-300 shadow-md scale-105"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Selector de Ordenamiento */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
            <span className="text-xs font-semibold text-slate-500">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value="nuevo">Más Recientes (Código)</option>
              <option value="descuento">Mayor % de Descuento</option>
              <option value="popular">Más Clickeados</option>
              <option value="precio_menor">Menor Precio</option>
            </select>
          </div>
        </div>

        {/* Resumen de Resultados */}
        <div className="flex items-center justify-between my-6 text-sm text-slate-500">
          <span>
            Mostrando <b>{filteredProducts.length}</b> {filteredProducts.length === 1 ? "oferta disponible" : "ofertas disponibles"}
            {searchTerm && ` para "${searchTerm}"`}
          </span>

          {(searchTerm || selectedCategory !== "Todas") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("Todas");
              }}
              className="text-blue-600 hover:text-blue-800 font-bold text-xs inline-flex items-center gap-1"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Grilla de Productos */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-4">
                <div className="w-full pt-[100%] bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-6 bg-slate-100 rounded w-1/2" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onTrackClick={handleTrackClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600 mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No encontramos ofertas con ese criterio</h3>
            <p className="text-slate-500 text-sm mt-1">
              Verificá el número de código ingresado o intentá con una palabra más general.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("Todas");
              }}
              className="mt-5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow hover:bg-slate-800 transition"
            >
              Ver Todas las Ofertas
            </button>
          </div>
        )}

      </main>

      {/* Footer Confiable */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-1 font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Enlaces oficiales de Mercado Libre Argentina bajo el Programa de Afiliados</span>
          </div>
          <p>
            Los precios y promociones están sujetos a disponibilidad y cambios por parte de los vendedores de la plataforma oficial.
          </p>
        </div>
      </footer>

    </div>
  );
}
