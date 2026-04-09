import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

let toastIdCounter = 0;

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container" aria-live="polite">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            className={`toast-item toast-${toast.type || "info"}`}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => onDismiss(toast.id)}
          >
            <span className="toast-icon">
              {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
            </span>
            <div className="toast-body">
              {toast.title && <strong>{toast.title}</strong>}
              <p>{toast.message}</p>
            </div>
            <motion.div
              className="toast-progress"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = (message, type = "info", title = "", duration = 4000) => {
    toastIdCounter += 1;
    const id = toastIdCounter;
    setToasts(current => [...current, { id, message, type, title, duration }]);
    setTimeout(() => {
      setToasts(current => current.filter(t => t.id !== id));
    }, duration);
    return id;
  };

  const dismiss = id => {
    setToasts(current => current.filter(t => t.id !== id));
  };

  const success = (message, title = "") => push(message, "success", title);
  const error = (message, title = "") => push(message, "error", title);
  const info = (message, title = "") => push(message, "info", title);

  return { toasts, push, dismiss, success, error, info };
}

export { ToastContainer, useToast };
