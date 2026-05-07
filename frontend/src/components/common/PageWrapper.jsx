import { motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    y: -18,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
};

/**
 * Wraps any page in a consistent fade-up entry / fade-up exit animation.
 * Usage: <PageWrapper> ... page content ... </PageWrapper>
 */
export default function PageWrapper({ children, className = "" }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen ${className}`}
    >
      {children}
    </motion.div>
  );
}
