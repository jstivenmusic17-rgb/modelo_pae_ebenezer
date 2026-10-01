import { CalendarDays } from "lucide-react";
import { infoVista, type Vista } from "./Navegacion";

interface HeaderProps {
  vista: Vista;
  conectado: boolean | null;
}

export default function Header({ vista, conectado }: HeaderProps) {
  const info = infoVista(vista);
  const hoy = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <header
      className="h-14 flex items-center justify-between px-6 sticky top-0 z-10"
      style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}
    >
      <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>
        {info.titulo} <span className="font-normal" style={{ color: "#94A3B8" }}>· {info.ayuda}</span>
      </p>

      <div className="flex items-center gap-3">
        <span className="hidden md:flex items-center gap-1.5 text-xs capitalize" style={{ color: "#64748B" }}>
          <CalendarDays className="w-3.5 h-3.5" /> {hoy}
        </span>
        {conectado !== null && (
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={conectado ? { backgroundColor: "#ECFDF5", color: "#059669" } : { backgroundColor: "#FEF2F2", color: "#DC2626" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: conectado ? "#10B981" : "#EF4444" }} />
            {conectado ? "Servidor conectado" : "Sin conexión"}
          </span>
        )}
      </div>
    </header>
  );
}
