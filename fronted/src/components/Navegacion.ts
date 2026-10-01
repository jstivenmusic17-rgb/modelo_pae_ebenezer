import { Calculator, Home, PackageSearch, BarChart3, Settings, UtensilsCrossed, type LucideIcon } from "lucide-react";

// Las vistas siguen el ciclo diario del PAE: configurar una vez, y cada día
// planear → registrar en comedor → revisar inventario → reportar.
export type Vista = "inicio" | "plan" | "comedor" | "inventario" | "reportes" | "configuracion";
export type PestanaConfig = "jornadas" | "estudiantes" | "cocina" | "parametros";
export type Navegar = (vista: Vista, pestana?: PestanaConfig) => void;

export interface InfoVista {
  id: Vista;
  titulo: string;
  ayuda: string;
  icono: LucideIcon;
}

export const VISTAS: InfoVista[] = [
  { id: "inicio", titulo: "Inicio", ayuda: "Resumen del día y primeros pasos", icono: Home },
  { id: "plan", titulo: "Plan del día", ayuda: "Calcula cuántas raciones pedir", icono: Calculator },
  { id: "comedor", titulo: "Comedor", ayuda: "Anota las raciones servidas", icono: UtensilsCrossed },
  { id: "inventario", titulo: "Inventario", ayuda: "Insumos, stock y reorden", icono: PackageSearch },
  { id: "reportes", titulo: "Reportes", ayuda: "Indicadores F1–F20", icono: BarChart3 },
  { id: "configuracion", titulo: "Configuración", ayuda: "Cursos, estudiantes, cocina, costos", icono: Settings },
];

export function infoVista(vista: Vista): InfoVista {
  return VISTAS.find((v) => v.id === vista) ?? VISTAS[0];
}
