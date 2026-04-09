import { motion, AnimatePresence } from "framer-motion";

function SplashScreen({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <div className="splash-bg-glow splash-glow-1" />
          <div className="splash-bg-glow splash-glow-2" />
          <div className="splash-bg-glow splash-glow-3" />

          <div className="splash-content">
            <motion.div
              className="splash-ring-wrapper"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <div className="splash-ring" />
            </motion.div>

            <motion.div
              className="splash-ring-wrapper"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <div className="splash-ring splash-ring-2" />
            </motion.div>

            <motion.div
              className="splash-orbs"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <span className="splash-orb" style={{ "--delay": "0s" }} />
              <span className="splash-orb" style={{ "--delay": "0.33s" }} />
              <span className="splash-orb" style={{ "--delay": "0.66s" }} />
            </motion.div>

            <motion.div
              className="splash-brand"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            >
              AI
            </motion.div>

            <motion.p
              className="splash-title"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Smart Route SRMist
            </motion.p>

            <motion.p
              className="splash-subtitle"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Initializing Agentic AI Systems...
            </motion.p>

            <motion.div
              className="splash-progress"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 1.8, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;
