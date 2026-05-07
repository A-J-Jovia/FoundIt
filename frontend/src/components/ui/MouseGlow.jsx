import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function MouseGlow() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updateMousePosition = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", updateMousePosition);
        return () => window.removeEventListener("mousemove", updateMousePosition);
    }, []);

    return (
        <motion.div
            // Removed mix-blend-multiply — on light/white backgrounds this blend mode
            // composites the orb as a near-white layer during drag, amplifying the flash.
            // Using normal blending with lower opacity achieves the same soft glow safely.
            className="pointer-events-none fixed top-0 left-0 w-[40vw] h-[40vw] rounded-full z-0 opacity-40 transition-opacity duration-300 hidden md:block"
            animate={{
                x: mousePosition.x - window.innerWidth * 0.2,
                y: mousePosition.y - window.innerWidth * 0.2,
            }}
            transition={{
                type: "spring",
                damping: 40,
                stiffness: 200,
                mass: 0.5,
            }}
            style={{
                background: "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.08) 35%, rgba(255, 255, 255, 0) 70%)",
                filter: "blur(40px)",
                // Explicit isolation prevents this fixed element from interfering
                // with backdrop-filter stacking contexts in glass elements below
                isolation: "isolate",
            }}
        />
    );
}
