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

  /**
   * Reduced motion drops the travel and the delay, but it must not change
   * *what* is rendered. Returning a plain div in that case left the server's
   * hidden markup — the server can't know a device's motion preference —
   * hydrating against a visible one, and hydration mismatches are how a page
   * ends up stuck in whichever state it was rendered in. It also means the
   * content no longer waits on an observer that may never fire.
   */
  const show = inView || reduced !== false;

  return (
    <M.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={reduced ? { duration: 0 } : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M.div>
  );
}

/**
 * Counts from 0 to `to` the first time it scrolls into view.
 *
 * The figure itself is never at the mercy of the animation. `null` means "show
 * the real number", and it is what the server renders, what a device asking
 * for reduced motion keeps, and what anything else that stops the count-up
 * from running falls back to — a browser with no IntersectionObserver, a
 * phone where the observer never fires, JavaScript that failed to load. It
 * used to render a literal 0 and only replace it once an animation ran, so a
 * phone with Reduce Motion on (which Android's battery saver turns on by
 * itself) showed "0+ Engineering, 0+ Medical" on the homepage while a laptop
 * showed the real counts.
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
  const reduced = useReducedMotion();

  /**
   * Two observers on purpose. `armed` fires well before the number is on
   * screen and is what drops it to zero; `started` fires as it arrives and
   * runs the count. Doing both off one trigger meant the real figure was
   * painted for a few frames and then visibly snapped back to zero.
   */
  const armed = useInView(ref, { once: true, margin: "400px" });
  const started = useInView(ref, { once: true });

  const [value, setValue] = useState<number | null>(null);

  // `useReducedMotion` answers null until it has a device to ask — on the
  // server, and so in the hydration render too. Only an explicit `false` is a
  // request for motion, which also keeps the server and client markup
  // identical: both render the real figure.
  const animating = reduced === false && armed;

  useEffect(() => {
    if (!animating || !started) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: setValue,
    });
    return () => controls.stop();
  }, [animating, started, to, duration]);

  // Zero only while an armed count-up has yet to produce a figure of its own.
  const shown = value ?? (animating ? 0 : to);

  return (
    <span ref={ref} className={className}>
      {shown.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
