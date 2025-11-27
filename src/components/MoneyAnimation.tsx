import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MoneyAnimationProps {
  type: "income" | "expense";
  onComplete: () => void;
}

export const MoneyAnimation = ({ type, onComplete }: MoneyAnimationProps) => {
  const [coins, setCoins] = useState<number[]>([]);

  useEffect(() => {
    // Generate random coins
    const coinCount = 40;
    setCoins(Array.from({ length: coinCount }, (_, i) => i));

    // Play animation and cleanup
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Background overlay with color based on type */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: type === "expense" ? 0.4 : 0.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className={`absolute inset-0 ${
          type === "expense" 
            ? "bg-gradient-to-b from-red-600/30 to-orange-600/30" 
            : "bg-gradient-to-b from-green-600/15 to-emerald-600/15"
        }`}
      />

      {/* Bucket for income */}
      {type === "income" && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="text-8xl">🪣</div>
        </motion.div>
      )}

      {/* Alarm icon for expense */}
      {type === "expense" && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, 8, -8, 8, -8, 0]
          }}
          transition={{ 
            duration: 0.4,
            repeat: 6,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2"
        >
          <div className="text-8xl filter drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
            🚨
          </div>
        </motion.div>
      )}

      {/* Money coins animation */}
      <AnimatePresence>
        {coins.map((coin) => {
          const randomX = Math.random() * 100;
          const randomDelay = Math.random() * 0.5;
          const randomDuration = 1.5 + Math.random() * 1;

          return (
            <motion.div
              key={coin}
              initial={{
                x: `${randomX}vw`,
                y: type === "income" ? "-10vh" : "100vh",
                rotate: 0,
                scale: 0,
              }}
              animate={{
                y: type === "income" ? "90vh" : "-10vh",
                rotate: 360 * (type === "income" ? 1 : -1),
                scale: [0, 1, 1, 0.8],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: randomDuration,
                delay: randomDelay,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute text-6xl"
              style={{ left: 0, top: 0 }}
            >
              {type === "income" ? "💰" : "💸"}
            </motion.div>
          );
        })}
      </AnimatePresence>

    </div>
  );
};
