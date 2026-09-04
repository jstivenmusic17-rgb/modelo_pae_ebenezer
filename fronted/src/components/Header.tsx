import { Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header
      className="h-14 flex items-center justify-between px-6 sticky top-0 z-10"
      style={{
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Buscar órdenes, insumos..."
            className="rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none transition-all w-56"
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              color: "#0F172A",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3B82F6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live status pill */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: "#ECFDF5", color: "#059669" }}
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#10B981" }} />
            <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ backgroundColor: "#10B981" }} />
          </span>
          Servicio Activo
        </div>

        <button
          className="relative p-2 rounded-full transition-colors duration-200 hover:bg-slate-100"
          style={{ color: "#64748B" }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: "#F97316", border: "1.5px solid #fff" }}
          />
        </button>

        <div className="flex items-center gap-2.5 pl-3" style={{ borderLeft: "1px solid #E2E8F0" }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)" }}
          >
            AP
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold" style={{ color: "#0F172A" }}>Admin PAE</p>
            <p className="text-[10px]" style={{ color: "#94A3B8" }}>Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}
