import { type JSX, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, description, onClose, children }: ModalProps): JSX.Element {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#FFFFFF", boxShadow: "0 20px 40px rgba(15,23,42,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>{title}</h3>
            {description && (
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{description}</p>
            )}
          </div>
          <button onClick={onClose} className="flex-shrink-0" style={{ color: "#94A3B8" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
}
