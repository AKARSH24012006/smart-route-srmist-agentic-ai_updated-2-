import { AnimatePresence, motion } from "framer-motion";

const destinations = [
  { name: "Shillong", emoji: "🏔️", region: "Northeast India", desc: "Misty highlands, living root bridges, and jazz-filled evenings.", vibe: "Nature Explorer" },
  { name: "Goa", emoji: "🏖️", region: "Western Coast", desc: "Sun-kissed beaches, Portuguese heritage, and vibrant nightlife.", vibe: "Beach & Chill" },
  { name: "Ooty", emoji: "🌿", region: "Tamil Nadu", desc: "Rolling tea estates, toy train rides, and cool mountain air.", vibe: "Hill Station" },
  { name: "Munnar", emoji: "🍃", region: "Kerala", desc: "Emerald tea gardens, wildlife sanctuaries, and misty mornings.", vibe: "Serene Retreat" },
  { name: "Coorg", emoji: "☕", region: "Karnataka", desc: "Coffee plantations, cascading waterfalls, and Kodava cuisine.", vibe: "Cultural Escape" },
  { name: "Wayanad", emoji: "🌳", region: "Kerala", desc: "Dense forests, ancient caves, and spice-scented trails.", vibe: "Wild Adventure" },
  { name: "Rishikesh", emoji: "🧘", region: "Uttarakhand", desc: "Sacred rivers, adventure sports, and yoga ashrams.", vibe: "Spiritual & Wild" },
  { name: "Udaipur", emoji: "🏰", region: "Rajasthan", desc: "Lake palaces, sunset views, and royal Rajasthani cuisine.", vibe: "Royal Heritage" }
];

function DestinationModal({ isOpen, onClose, onSelect }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content glass-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Idea Radar</p>
                <h2>Discover Your Next Adventure</h2>
                <p className="modal-subtitle">Handpicked destinations curated by our AI agents. Click any card to set it as your destination.</p>
              </div>
              <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
            </div>

            <div className="modal-grid">
              {destinations.map((dest, index) => (
                <motion.button
                  key={dest.name}
                  className="destination-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.3 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onSelect(dest.name);
                    onClose();
                  }}
                >
                  <span className="destination-emoji">{dest.emoji}</span>
                  <div className="destination-info">
                    <strong>{dest.name}</strong>
                    <span className="destination-region">{dest.region}</span>
                    <p>{dest.desc}</p>
                    <span className="destination-vibe">{dest.vibe}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DestinationModal;
