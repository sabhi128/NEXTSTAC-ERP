import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Mouse position state
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Spring physics for smooth trailing effect on the outer ring
    // Balanced: Responsive (keeps up) but Smooth (no jitter)
    const springConfig = { damping: 30, stiffness: 450, mass: 0.5 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const moveCursor = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseEnter = () => setIsHovering(true);
        const handleMouseLeave = () => setIsHovering(false);

        // Track global mouse movement
        window.addEventListener('mousemove', moveCursor);

        // Add hover listeners to clickable elements
        const clickableElements = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
        clickableElements.forEach(el => {
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });

        // MutationObserver to handle dynamically added elements
        const observer = new MutationObserver((mutations) => {
            const newClickables = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
            newClickables.forEach(el => {
                el.removeEventListener('mouseenter', handleMouseEnter); // clean up duplicates
                el.removeEventListener('mouseleave', handleMouseLeave);
                el.addEventListener('mouseenter', handleMouseEnter);
                el.addEventListener('mouseleave', handleMouseLeave);
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            clickableElements.forEach(el => {
                el.removeEventListener('mouseenter', handleMouseEnter);
                el.removeEventListener('mouseleave', handleMouseLeave);
            });
            observer.disconnect();
        };
    }, []);

    // Hide if mouse leaves window
    useEffect(() => {
        const handleMouseOut = () => setIsVisible(false);
        const handleMouseIn = () => setIsVisible(true);
        document.addEventListener('mouseout', handleMouseOut);
        document.addEventListener('mouseover', handleMouseIn);
        return () => {
            document.removeEventListener('mouseout', handleMouseOut);
            document.removeEventListener('mouseover', handleMouseIn);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 2147483647 }}>
            {/* Inner Dot - Follows mouse exactly */}
            <motion.div
                className="fixed top-0 left-0 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            />

            {/* Outer Ring - Follows with spring physics */}
            <motion.div
                className="fixed top-0 left-0 border border-indigo-400 rounded-full"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
                animate={{
                    width: isHovering ? 60 : 32,
                    height: isHovering ? 60 : 32,
                    borderColor: isHovering ? 'rgba(99, 102, 241, 0.8)' : 'rgba(99, 102, 241, 0.4)',
                    borderWidth: isHovering ? 2 : 1,
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 28
                }}
            />
        </div>
    );
}
