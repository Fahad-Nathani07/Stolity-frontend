import React, { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

const presets = {
  fadeUp: {
    hidden: { opacity: 0, y: 36 },
    visible: { opacity: 1, y: 0 },
  },
  fadeSoft: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  },
  rise: {
    hidden: { opacity: 0, y: 48, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  left: {
    hidden: { opacity: 0, x: -36 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 36 },
    visible: { opacity: 1, x: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -18 },
    visible: { opacity: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.94, y: 24 },
    visible: { opacity: 1, scale: 1, y: 0 },
  },
};

/**
 * Smooth scroll-reveal using Framer Motion.
 */
const ScrollReveal = forwardRef(function ScrollReveal(
  {
    children,
    as = "div",
    variant = "fadeUp",
    delay = 0,
    duration = 0.85,
    className,
    style,
    amount = 0.18,
    once = true,
    ...rest
  },
  ref
) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as] || motion.div;
  const preset = presets[variant] || presets.fadeUp;

  if (reduceMotion) {
    const Tag = as;
    return (
      <Tag ref={ref} className={className} style={style} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: "0px 0px -6% 0px" }}
      variants={preset}
      transition={{
        duration,
        delay,
        ease: EASE,
        opacity: { duration: duration * 0.85, delay, ease: EASE },
        y: { duration, delay, ease: EASE },
        x: { duration, delay, ease: EASE },
        scale: { duration: duration * 1.05, delay, ease: EASE },
      }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
});

export default ScrollReveal;
