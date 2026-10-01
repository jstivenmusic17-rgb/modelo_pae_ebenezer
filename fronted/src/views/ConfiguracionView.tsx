import { useEffect, useState, type JSX } from "react";
import { cn } from "../utils";
import { EncabezadoVista } from "../components/Ui";
import type { PestanaConfig } from "../components/Navegacion";
import JornadasCursosTab from "./configuracion/JornadasCursosTab";
import EstudiantesTab from "./configuracion/EstudiantesTab";
import CocinaTab from "./configuracion/CocinaTab";
import ParametrosTab from "./configuracion/ParametrosTab";

const PESTANAS: { id: PestanaConfig; titulo: string; ayuda: string }[] = [
  { id: "jornadas", titulo: "Jornadas y cursos", ayuda: "Paso 1" },
  { id: "estudiantes", titulo: "Estudiantes", ayuda: "Paso 2" },
  { id: "cocina", titulo: "Cocina", ayuda: "Paso 3" },
  { id: "parametros", titulo: "Parámetros del modelo", ayuda: "Costos" },
];

export default function ConfiguracionView({ pestanaInicial }: { pestanaInicial: PestanaConfig }): JSX.Element {
  const [pestana, setPestana] = useState<PestanaConfig>(pestanaInicial);

  // Si otra vista nos manda a una pestaña concreta, la abrimos
  useEffect(() => setPestana(pestanaInicial), [pestanaInicial]);

  return (
    <div>
      <EncabezadoVista
        titulo="Configuración"
        descripcion="Lo que se prepara una sola vez: jornadas, cursos, estudiantes y cocina, y los costos que usa el modelo para decidir cuánto pedir. Los insumos se gestionan en Inventario."
      />
      <div className="flex flex-wrap gap-1 p-1 rounded-xl mb-6 w-fit" style={{ backgroundColor: "#E2E8F0" }}>
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all", pestana === p.id ? "bg-white shadow-sm" : "hover:bg-white/50")}
            style={{ color: pestana === p.id ? "#1E3A8A" : "#475569" }}
          >
            <span className="text-[10px] font-bold mr-1.5" style={{ color: "#94A3B8" }}>{p.ayuda}</span>
            {p.titulo}
          </button>
        ))}
      </div>
      {pestana === "jornadas" && <JornadasCursosTab />}
      {pestana === "estudiantes" && <EstudiantesTab irACursos={() => setPestana("jornadas")} />}
      {pestana === "cocina" && <CocinaTab />}
      {pestana === "parametros" && <ParametrosTab />}
    </div>
  );
}
