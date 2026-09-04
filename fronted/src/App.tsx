import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar, { TabType } from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./views/DashboardView";
import PlanificacionView from "./views/PlanificacionView";
import InventarioView from "./views/InventarioView";
import ReportesView from "./views/ReportesView";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F8FAFC", color: "#0F172A" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {activeTab === "dashboard" && <DashboardView />}
                {activeTab === "planificacion" && <PlanificacionView />}
                {activeTab === "inventario" && <InventarioView />}
                {activeTab === "reportes" && <ReportesView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
