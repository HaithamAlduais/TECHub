"use client";

import React, { useEffect, useRef, useState } from "react";

type DottedGlowBackgroundProps = {
  className?: string;
  /** distance between dot centers in pixels */
  gap?: number;
  /** base radius of each dot in CSS px */
  radius?: number;
  /** dot color (will pulse by alpha) */
  color?: string;
  /** optional dot color for dark mode */
  darkColor?: string;
  /** shadow/glow color for bright dots */
  glowColor?: string;
  /** optional glow color for dark mode */
  darkGlowColor?: string;
  /** optional CSS variable name for light dot color (e.g. --color-zinc-900) */
  colorLightVar?: string;
  /** optional CSS variable name for dark dot color (e.g. --color-zinc-100) */
  colorDarkVar?: string;
  /** optional CSS variable name for light glow color */
  glowColorLightVar?: string;
  /** optional CSS variable name for dark glow color */
  glowColorDarkVar?: string;
  /** global opacity for the whole layer */
  opacity?: number;
  /** background radial fade opacity (0 = transparent background) */
  backgroundOpacity?: number;
  /** minimum per-dot speed in rad/s */
  speedMin?: number;
  /** maximum per-dot speed in rad/s */
  speedMax?: number;
  /** global speed multiplier for all dots */
  speedScale?: number;
};

/**
 * Canvas-based dotted background that randomly glows and dims.
 * - Uses a stable grid of dots.
 * - Each dot gets its own phase + speed producing organic shimmering.
 * - Handles high-DPI and resizes via ResizeObserver.
 *
 * Performance optimisations vs. the naive version:
 *  1. shadowBlur removed — replaced with a pre-rendered offscreen glow sprite
 *     blended with globalAlpha, costing a single drawImage per glowing dot.
 *  2. Dots batched into a single Path2D per frame → one fill() call total.
 *  3. width/height cached after resize, never read inside the rAF loop.
 */
export const DottedGlowBackground = ({
  className,
  gap = 12,
  radius = 2,
  color = "rgba(0,0,0,0.7)",
  darkColor,
  glowColor = "rgba(0, 170, 255, 0.85)",
  darkGlowColor,
  colorLightVar,
  colorDarkVar,
  glowColorLightVar,
  glowColorDarkVar,
  opacity = 0.6,
  backgroundOpacity = 0,
  speedMin = 0.4,
  speedMax = 1.3,
  speedScale = 1,
}: DottedGlowBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [resolvedColor, setResolvedColor] = useState<string>(color);
  const [resolvedGlowColor, setResolvedGlowColor] = useState<string>(glowColor);

  // Resolve CSS variable value from the container or root
  const resolveCssVariable = (
    el: Element,
    variableName?: string,
  ): string | null => {
    if (!variableName) return null;
    const normalized = variableName.startsWith("--")
      ? variableName
      : `--${variableName}`;
    const fromEl = getComputedStyle(el as Element)
      .getPropertyValue(normalized)
      .trim();
    if (fromEl) return fromEl;
    const root = document.documentElement;
    const fromRoot = getComputedStyle(root).getPropertyValue(normalized).trim();
    return fromRoot || null;
  };

  const detectDarkMode = (): boolean => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  };

  // Keep resolved colors in sync with theme changes and prop updates
  useEffect(() => {
    const container = containerRef.current ?? document.documentElement;

    const compute = () => {
      const isDark = detectDarkMode();

      let nextColor: string = color;
      let nextGlow: string = glowColor;

      if (isDark) {
        const varDot = resolveCssVariable(container, colorDarkVar);
        const varGlow = resolveCssVariable(container, glowColorDarkVar);
        nextColor = varDot || darkColor || nextColor;
        nextGlow = varGlow || darkGlowColor || nextGlow;
      } else {
        const varDot = resolveCssVariable(container, colorLightVar);
        const varGlow = resolveCssVariable(container, glowColorLightVar);
        nextColor = varDot || nextColor;
        nextGlow = varGlow || nextGlow;
      }

      setResolvedColor(nextColor);
      setResolvedGlowColor(nextGlow);
    };

    compute();

    const mql = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    const handleMql = () => compute();
    mql?.addEventListener?.("change", handleMql);

    const mo = new MutationObserver(() => compute());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      mql?.removeEventListener?.("change", handleMql);
      mo.disconnect();
    };
  }, [
    color,
    darkColor,
    glowColor,
    darkGlowColor,
    colorLightVar,
    colorDarkVar,
    glowColorLightVar,
    glowColorDarkVar,
  ]);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;
    let isVisible = true;

    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);

    // ── Cached dimensions — only updated on resize, never inside rAF ──────────
    let cachedW = 0;
    let cachedH = 0;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      cachedW = Math.floor(width);
      cachedH = Math.floor(height);
      el.width = Math.max(1, cachedW * dpr);
      el.height = Math.max(1, cachedH * dpr);
      el.style.width = `${cachedW}px`;
      el.style.height = `${cachedH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // ── Dot grid ──────────────────────────────────────────────────────────────
    let dots: { x: number; y: number; phase: number; speed: number }[] = [];

    const regenDots = () => {
      dots = [];
      const cols = Math.ceil(cachedW / gap) + 2;
      const rows = Math.ceil(cachedH / gap) + 2;
      const min = Math.min(speedMin, speedMax);
      const max = Math.max(speedMin, speedMax);
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          const phase = Math.random() * Math.PI * 2;
          const span = Math.max(max - min, 0);
          const speed = min + Math.random() * span;
          dots.push({ x, y, phase, speed });
        }
      }
    };

    regenDots();

    // ── Offscreen glow sprite (replaces shadowBlur entirely) ──────────────────
    // Build a small radial-gradient circle on an offscreen canvas once.
    // We re-render it only when resolvedGlowColor or radius changes.
    const GLOW_R = radius * 6; // total sprite radius in CSS px
    const spriteSize = Math.ceil(GLOW_R * 2 * dpr);

    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = spriteSize;
    spriteCanvas.height = spriteSize;
    const sc = spriteCanvas.getContext("2d")!;

    const buildSprite = () => {
      sc.clearRect(0, 0, spriteSize, spriteSize);
      const cx = spriteSize / 2;
      const g = sc.createRadialGradient(cx, cx, 0, cx, cx, spriteSize / 2);
      g.addColorStop(0, resolvedGlowColor);
      g.addColorStop(1, "rgba(0,0,0,0)");
      sc.fillStyle = g;
      sc.fillRect(0, 0, spriteSize, spriteSize);
    };
    buildSprite();

    const glowSpriteOffset = GLOW_R; // distance from dot centre to sprite top-left

    let last = performance.now();

    const draw = (now: number) => {
      if (stopped) return;
      if (!isVisible) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const dt = (now - last) / 1000; // seconds (unused but kept for future use)
      void dt;
      last = now;

      const W = cachedW;
      const H = cachedH;

      ctx.clearRect(0, 0, W, H);

      // ── Optional background gradient ────────────────────────────────────────
      if (backgroundOpacity > 0) {
        const grad = ctx.createRadialGradient(
          W * 0.5, H * 0.4, Math.min(W, H) * 0.1,
          W * 0.5, H * 0.5, Math.max(W, H) * 0.7,
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${Math.min(Math.max(backgroundOpacity, 0), 1)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      const time = (now / 1000) * Math.max(speedScale, 0);

      // ── Pass 1: glow sprites (drawImage, no shadow API) ─────────────────────
      // Use a separate compositing pass so base dots aren't washed out.
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const a = 0.25 + 0.55 * lin;

        if (a > 0.6) {
          const glow = (a - 0.6) / 0.4;
          ctx.globalAlpha = glow * opacity * 0.7;
          ctx.drawImage(
            spriteCanvas,
            d.x - glowSpriteOffset,
            d.y - glowSpriteOffset,
            GLOW_R * 2,
            GLOW_R * 2,
          );
        }
      }

      // ── Pass 2: Base Dots (Animating Alpha) ────────────────────────────────
      // Note: To animate alpha per dot without massive performance cost, we use
      // the batched Path2D but only fill the "dim" dots, and then individually
      // fill the "bright" dots.
      ctx.globalAlpha = opacity * 0.25; // Base minimum dim alpha
      const dimPath = new Path2D();
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        dimPath.moveTo(d.x + radius, d.y);
        dimPath.arc(d.x, d.y, radius, 0, Math.PI * 2);
      }
      ctx.fillStyle = resolvedColor;
      ctx.fill(dimPath);

      // ── Pass 3: Bright Dots (Individual Fills) ─────────────────────────────
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const a = 0.25 + 0.55 * lin;

        if (a > 0.3) {
          ctx.globalAlpha = a * opacity;
          ctx.beginPath();
          ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      resize();
      regenDots();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 },
    );
    observer.observe(container);

    window.addEventListener("resize", handleResize);
    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      ro.disconnect();
    };
  }, [
    gap,
    radius,
    resolvedColor,
    resolvedGlowColor,
    opacity,
    backgroundOpacity,
    speedMin,
    speedMax,
    speedScale,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0 }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
};
