import { type JSX, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";

// Piezas visuales compartidas por las vistas (misma paleta del resto de la app)

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <div className={`bg-white rounded-2xl p-5 ${className}`} style={{ border: "1px solid #E2E8F0" }}>
      {children}
    </div>
  );
}

export function TituloSeccion({ titulo, ayuda, accion }: { titulo: string; ayuda?: string; accion?: ReactNode }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>{titulo}</h3>
        {ayuda && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{ayuda}</p>}
      </div>
      {accion}
    </div>
  );
}

export function EncabezadoVista({ titulo, descripcion, children }: { titulo: string; descripcion: string; children?: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "#0F172A" }}>{titulo}</h2>
        <p className="text-sm mt-0.5 max-w-2xl" style={{ color: "#64748B" }}>{descripcion}</p>
      </div>
      {children}
    </div>
  );
}

type TonoAviso = "info" | "alerta" | "exito" | "error";

const TONOS: Record<TonoAviso, { fondo: string; borde: string; texto: string; icono: typeof Info }> = {
  info: { fondo: "#EFF6FF", borde: "#BFDBFE", texto: "#1E3A8A", icono: Info },
  alerta: { fondo: "#FFF7ED", borde: "#FED7AA", texto: "#9A3412", icono: AlertTriangle },
  exito: { fondo: "#ECFDF5", borde: "#A7F3D0", texto: "#065F46", icono: CheckCircle2 },
  error: { fondo: "#FEF2F2", borde: "#FECACA", texto: "#B91C1C", icono: AlertTriangle },
};

export function Aviso({ tono, children }: { tono: TonoAviso; children: ReactNode }): JSX.Element {
  const t = TONOS[tono];
  const Icono = t.icono;
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: t.fondo, border: `1px solid ${t.borde}`, color: t.texto }}>
      <Icono className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Cargando({ texto = "Cargando..." }: { texto?: string }): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm" style={{ color: "#94A3B8" }}>
      <Loader2 className="w-4 h-4 animate-spin" /> {texto}
    </div>
  );
}

export function BotonPrimario({ children, onClick, disabled, type = "button" }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}): JSX.Element {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)" }}
    >
      {children}
    </button>
  );
}

export function BotonSecundario({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ border: "1px solid #E2E8F0", color: "#334155" }}
    >
      {children}
    </button>
  );
}

// Número destacado con su etiqueta y, opcionalmente, el código de fórmula
export function Indicador({ etiqueta, valor, detalle, formula, color = "#0F172A" }: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  formula?: string;
  color?: string;
}): JSX.Element {
  return (
    <Tarjeta>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{etiqueta}</p>
        {formula && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}>
            {formula}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold mt-2 tracking-tight" style={{ color }}>{valor}</p>
      {detalle && <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{detalle}</p>}
    </Tarjeta>
  );
}
