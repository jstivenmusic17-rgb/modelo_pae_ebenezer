import { type JSX } from "react";
import { ArrowRight, Inbox } from "lucide-react";

interface EmptyStateProps {
  titulo: string;
  mensaje: string;
  accion?: { etiqueta: string; onClick: () => void };
}

// Se muestra cuando falta un dato previo: explica qué falta y lleva a crearlo,
// en lugar de mostrar tablas vacías o indicadores en cero.
export default function EmptyState({ titulo, mensaje, accion }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px dashed #CBD5E1" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#EFF6FF" }}>
        <Inbox className="w-5 h-5" style={{ color: "#3B82F6" }} />
      </div>
      <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>{titulo}</h3>
      <p className="text-sm mt-1 max-w-md" style={{ color: "#64748B" }}>{mensaje}</p>
      {accion && (
        <button
          type="button"
          onClick={accion.onClick}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)" }}
        >
          {accion.etiqueta} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
