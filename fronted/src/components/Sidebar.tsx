import { Sigma } from "lucide-react";
import { cn } from "../utils";
import { VISTAS, type Navegar, type Vista } from "./Navegacion";

interface SidebarProps {
  vistaActiva: Vista;
  navegar: Navegar;
}

export default function Sidebar({ vistaActiva, navegar }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between" style={{ backgroundColor: "#0F172A" }}>
      <div>
        {/* Marca */}
        <div className="h-16 flex items-center px-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)" }}
            >
              <span className="text-white font-bold text-xs tracking-tight">PAE</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Ciudad Ebenezer</h1>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#64748B" }}>
                Alimentación escolar
              </p>
            </div>
          </div>
        </div>

        <nav className="p-3 mt-2 flex flex-col gap-0.5">
          {VISTAS.map((item, i) => {
            const activa = vistaActiva === item.id;
            const Icono = item.icono;
            // Configuración va separada: se usa al inicio, no en el ciclo diario
            const separar = item.id === "configuracion";
            return (
              <div key={item.id}>
                {separar && <div className="my-2 mx-3 border-t border-white/5" />}
                <button
                  onClick={() => navegar(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 relative",
                    activa ? "" : "hover:bg-white/5"
                  )}
                  style={activa ? { backgroundColor: "rgba(59, 130, 246, 0.2)" } : undefined}
                >
                  {activa && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full" style={{ backgroundColor: "#3B82F6" }} />
                  )}
                  <Icono className="w-4 h-4 flex-shrink-0" style={{ color: activa ? "#3B82F6" : "#475569" }} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium" style={{ color: activa ? "#DBEAFE" : "#CBD5E1" }}>
                      {!separar && <span style={{ color: "#475569" }}>{i + 1}. </span>}
                      {item.titulo}
                    </span>
                    <span className="block text-[11px] truncate" style={{ color: "#64748B" }}>{item.ayuda}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Modelo en uso: acceso directo a sus parámetros */}
      <button
        onClick={() => navegar("configuracion", "parametros")}
        className="m-3 p-3 rounded-xl text-left transition-colors hover:bg-white/10"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <Sigma className="w-4 h-4" style={{ color: "#60A5FA" }} />
          <span className="text-xs font-bold" style={{ color: "#E2E8F0" }}>Modelo de pedido</span>
        </div>
        <p className="text-[11px] mt-1 leading-snug" style={{ color: "#94A3B8" }}>
          Vendedor de periódicos: pide un poco más cuando faltar cuesta más que sobrar. Ver costos →
        </p>
      </button>
    </aside>
  );
}
