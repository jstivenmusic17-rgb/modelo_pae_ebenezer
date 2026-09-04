import { type CSSProperties, type FocusEvent, type JSX, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

// Estilos compartidos por todos los formularios en modal de la app, para
// que cada vista no repita las mismas clases de Tailwind + estilos inline.
export const INPUT_CLASS = "w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-all";
export const INPUT_STYLE: CSSProperties = {
  backgroundColor: "#F8FAFC",
  border: "1px solid #E2E8F0",
  color: "#0F172A",
};

export function focusInput(e: FocusEvent<HTMLInputElement | HTMLSelectElement>): void {
  e.currentTarget.style.borderColor = "#3B82F6";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
}

export function blurInput(e: FocusEvent<HTMLInputElement | HTMLSelectElement>): void {
  e.currentTarget.style.borderColor = "#E2E8F0";
  e.currentTarget.style.boxShadow = "none";
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

export function FormField({ label, children }: FormFieldProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold" style={{ color: "#475569" }}>{label}</label>
      {children}
    </div>
  );
}

interface SubmitButtonProps {
  submitting: boolean;
  submittingLabel: string;
  label: string;
}

export function SubmitButton({ submitting, submittingLabel, label }: SubmitButtonProps): JSX.Element {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-95 disabled:cursor-wait"
      style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)", boxShadow: "0 4px 14px rgba(30,58,138,0.3)" }}
    >
      {submitting ? submittingLabel : label}
    </button>
  );
}

// Confirmación de borrado en dos pasos dentro del propio formulario — no usa
// `window.confirm()` porque ese diálogo nativo no está disponible en el
// entorno de vista previa (mismo motivo por el que se evita `window.prompt`).
interface DangerZoneProps {
  label: string;
  confirming: boolean;
  deleting: boolean;
  onRequestConfirm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DangerZone({
  label,
  confirming,
  deleting,
  onRequestConfirm,
  onCancel,
  onConfirm,
}: DangerZoneProps): JSX.Element {
  if (confirming) {
    return (
      <div className="pt-3 flex items-center gap-2" style={{ borderTop: "1px solid #F1F5F9" }}>
        <p className="text-xs flex-1 font-semibold" style={{ color: "#B91C1C" }}>¿Eliminar definitivamente?</p>
        <button type="button" onClick={onCancel} className="text-xs font-semibold px-2 py-1.5" style={{ color: "#64748B" }}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white disabled:cursor-wait"
          style={{ backgroundColor: "#DC2626" }}
        >
          {deleting ? "Eliminando..." : "Sí, eliminar"}
        </button>
      </div>
    );
  }
  return (
    <div className="pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
      <button
        type="button"
        onClick={onRequestConfirm}
        className="flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: "#DC2626" }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        {label}
      </button>
    </div>
  );
}
