import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { Aviso, Cargando } from "./components/Ui";
import type { Navegar, PestanaConfig, Vista } from "./components/Navegacion";
import { alPerderConexion, API_BASE_URL, JornadaApi } from "./services/api";
import InicioView from "./views/InicioView";
import PlanDelDiaView from "./views/PlanDelDiaView";
import ComedorView from "./views/ComedorView";
import InventarioView from "./views/InventarioView";
import ReportesView from "./views/ReportesView";
import ConfiguracionView from "./views/ConfiguracionView";

export default function App() {
  const [vista, setVista] = useState<Vista>("inicio");
  const [pestanaConfig, setPestanaConfig] = useState<PestanaConfig>("jornadas");
  const [conectado, setConectado] = useState<boolean | null>(null);

  const navegar: Navegar = useCallback((destino, pestana) => {
    if (pestana) setPestanaConfig(pestana);
    setVista(destino);
  }, []);

  const comprobarConexion = useCallback(() => {
    JornadaApi.listar()
      .then(() => setConectado(true))
      .catch(() => setConectado(false));
  }, []);

  useEffect(comprobarConexion, [comprobarConexion]);

  // Si el servidor se cae con la app abierta, se muestra el mismo aviso único
  useEffect(() => alPerderConexion(() => setConectado(false)), []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F8FAFC", color: "#0F172A" }}>
      <Sidebar vistaActiva={vista} navegar={navegar} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header vista={vista} conectado={conectado} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {conectado === null ? (
              <Cargando texto="Conectando con el servidor..." />
            ) : conectado === false ? (
              <Aviso tono="error">
                <p className="font-bold">No se pudo conectar con el servidor del PAE.</p>
                <p className="mt-1">
                  Arranca el backend (Spring Boot, puerto 8082) y vuelve a intentarlo. Dirección esperada: {API_BASE_URL}
                </p>
                <button type="button" onClick={comprobarConexion} className="mt-2 text-xs font-bold underline">
                  Reintentar
                </button>
              </Aviso>
            ) : (
              // Solo animación de entrada: una animación de salida con mode="wait"
              // bloquea el cambio de vista si el navegador pausa las animaciones
              // (pestaña oculta), y la navegación debe ser inmediata.
              <motion.div
                  key={vista}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {vista === "inicio" && <InicioView navegar={navegar} />}
                  {vista === "plan" && <PlanDelDiaView navegar={navegar} />}
                  {vista === "comedor" && <ComedorView navegar={navegar} />}
                  {vista === "inventario" && <InventarioView />}
                  {vista === "reportes" && <ReportesView navegar={navegar} />}
                  {vista === "configuracion" && <ConfiguracionView pestanaInicial={pestanaConfig} />}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
