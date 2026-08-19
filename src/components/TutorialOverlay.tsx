import React, { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "bahadvisory_tutorial_seen_v1";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Step {
  title: string;
  body: string;
  /** CSS selector for the real, currently-rendered element to spotlight —
   *  measured live via getBoundingClientRect instead of a hardcoded
   *  position, so it stays accurate across screen sizes and UI state
   *  (sidebar/legend collapsed, zones still loading, map panned, etc). */
  targetSelector: string;
  /** Optional second, smaller spotlight called out inside/near the primary
   *  one — e.g. the actual "Hide legend" button within the whole legend
   *  box, so the tip points at both the container and that specific control. */
  secondarySelector?: string;
  /** If set, this step only completes when the visitor clicks a real
   *  matching element (not just the "Got it" button) — used for the "tap a
   *  pin" step so they practice the actual gesture on a live flood marker. */
  requireClickSelector?: string;
}

const STEPS: Step[] = [
  {
    title: "This list shows every flooded area",
    body: '"All Locations" lets you jump straight to any active flood zone. Don\'t need it open? Tap the × in the top-right corner of this list to hide it and free up map space.',
    targetSelector: ".locations-sidebar__header",
  },
  {
    title: "This box explains the map colors",
    body: 'This whole box is the legend — every color and icon on the map (water level, road status, vehicle types) is explained here. Tap "Hide legend", highlighted below, any time to collapse it out of the way.',
    targetSelector: ".legend-panel",
    secondarySelector: ".legend-panel__toggle",
  },
  {
    title: "Tap a pin to see details",
    body: "That highlighted pin is a real flooded area on the map right now. Go ahead and tap it to open its details — water level, whether it's rising or falling, and which vehicles can safely pass.",
    targetSelector: ".zone-pin",
    requireClickSelector: ".zone-pin",
  },
];

function measure(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * Shown once on first visit (persisted via localStorage). Spotlights real,
 * currently-rendered UI elements — measured live every frame while a step
 * is showing — rather than hardcoded positions, so it tracks map pans,
 * zone pins arriving late, and window resizes automatically. The final
 * step additionally requires an actual click on a real flood pin to
 * proceed, rather than just describing the tap gesture.
 */
export default function TutorialOverlay() {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [secondaryRect, setSecondaryRect] = useState<Rect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setStep(0);
    } catch {
      // localStorage unavailable (e.g. private browsing) — just skip the tutorial.
    }
  }, []);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore — worst case the tutorial reappears next visit
    }
    setStep(null);
  }, []);

  const advance = useCallback(() => {
    setStep((s) => {
      if (s === null) return s;
      if (s >= STEPS.length - 1) {
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch {
          // ignore
        }
        return null;
      }
      return s + 1;
    });
  }, []);

  // Re-measure every frame while a step is visible — cheap (a couple of
  // getBoundingClientRect calls) and keeps the spotlight glued to its real
  // target without wiring up separate resize/scroll/mutation listeners.
  useEffect(() => {
    if (step === null) return;
    const current = STEPS[step];

    const tick = () => {
      setRect(measure(current.targetSelector));
      setSecondaryRect(current.secondarySelector ? measure(current.secondarySelector) : null);
      setTargetMissing(
        !!current.requireClickSelector && measure(current.requireClickSelector) === null
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [step]);

  // Gate the "tap a pin" step on an actual click of a real pin, anywhere on
  // the page (capture phase so it fires even though the pin itself has its
  // own click handler that opens the detail panel — both should happen).
  useEffect(() => {
    if (step === null) return;
    const current = STEPS[step];
    if (!current.requireClickSelector) return;

    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(current.requireClickSelector!)) advance();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [step, advance]);

  if (step === null) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const mustClickTarget = !!current.requireClickSelector && !targetMissing;

  // Card sits just below the primary highlight when we have one to anchor
  // to; falls back to centered (e.g. no flood zones loaded yet on the pin
  // step, so there's nothing real to anchor next to).
  const cardStyle: React.CSSProperties = rect
    ? {
        top: Math.min(rect.top + rect.height + 16, window.innerHeight - 220),
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 316)),
      }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="App walkthrough">
      {!rect && <div className="tutorial-backdrop" />}

      {rect && (
        <div
          className="tutorial-highlight"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      {secondaryRect && (
        <div
          className="tutorial-highlight--secondary"
          style={{
            top: secondaryRect.top - 3,
            left: secondaryRect.left - 3,
            width: secondaryRect.width + 6,
            height: secondaryRect.height + 6,
          }}
        />
      )}

      <div className="tutorial-card" style={cardStyle}>
        <div className="tutorial-card__eyebrow">
          Tip {step + 1} of {STEPS.length}
        </div>
        <h4>{current.title}</h4>
        <p>
          {current.body}
          {!!current.requireClickSelector && targetMissing && (
            <span className="tutorial-card__hint">
              No active flood zones right now, so there's no pin to tap — once DRRM publishes
              one, tap it the same way.
            </span>
          )}
        </p>
        <div className="tutorial-card__footer">
          <div className="tutorial-card__dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span key={i} className={`tutorial-dot ${i === step ? "tutorial-dot--active" : ""}`} />
            ))}
          </div>
          <div className="tutorial-card__actions">
            <button className="btn-secondary" onClick={finish}>
              Skip
            </button>
            {/* When a real pin exists, advancing only happens by actually
                clicking it (see the effect above) — no button shortcut, so
                the visitor practices the real gesture. */}
            {!mustClickTarget && (
              <button onClick={() => (isLast ? finish() : advance())}>
                {isLast ? "Got it" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}