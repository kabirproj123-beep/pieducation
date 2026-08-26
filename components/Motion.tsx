"use client";

/**
 * Small motion primitives, all of which respect prefers-reduced-motion.
 *
 * Deliberately restrained: content fades up once as it enters the viewport, and
 * numbers count up. Nothing loops, nothing moves while you're reading.
 */
import { animate, useInView, useReducedMotion } from "motion/react";
import * as motionReact from "motion/react";
import { useEffect, useRef, useState } from "react";

const M = motionReact.motion;

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <M.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M.div>
  );
}

/**
 * Counts from 0 to `to` the first time it scrolls into view.
 *
 * `decimals` is for figures that lose meaning when rounded to a whole number —
 * a package of ₹21.8 LPA shown as "₹22 LPA" overstates it.
 */
export function CountUp({
  to,
  suffix = "",
  decimals = 0,
  duration = 1.4,
  className = "",
}: {
  to: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: setValue,
    });
    return () => controls.stop();
  }, [inView, reduced, to, duration]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
