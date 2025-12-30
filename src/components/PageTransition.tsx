import { motion, useReducedMotion } from "framer-motion";
import { ReactNode, memo } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = memo(({ children }: PageTransitionProps) => {
  const prefersReducedMotion = useReducedMotion();

  // Skip animations entirely for reduced motion or mobile performance
  if (prefersReducedMotion) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
});

PageTransition.displayName = "PageTransition";

export default PageTransition;
