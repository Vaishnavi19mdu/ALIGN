// ─── ProximityToast.tsx ───────────────────────────────────────────────────────
// Renders stacked proximity alerts at the bottom of the screen.
// Each toast shows task name, distance, urgency badge, and a live countdown ring.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Zap, Navigation } from 'lucide-react';
import type { ProximityAlert } from './useProximityAlerts';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 6_000;

// ─── Urgency theme map ────────────────────────────────────────────────────────

const URGENCY_THEME = {
  Critical: {
    bar:    'bg-red-500',
    badge:  'bg-red-100 text-red-700',
    icon:   'text-red-500',
    ring:   '#ef4444',
    border: 'border-red-200',
    glow:   'shadow-red-100',
  },
  High: {
    bar:    'bg-amber-400',
    badge:  'bg-amber-100 text-amber-700',
    icon:   'text-amber-500',
    ring:   '#f59e0b',
    border: 'border-amber-200',
    glow:   'shadow-amber-100',
  },
  Low: {
    bar:    'bg-brand-primary',
    badge:  'bg-brand-primary/10 text-brand-primary',
    icon:   'text-brand-primary',
    ring:   'var(--color-brand-primary, #4f46e5)',
    border: 'border-brand-primary/20',
    glow:   'shadow-brand-primary/10',
  },
} as const;

// ─── CountdownRing ────────────────────────────────────────────────────────────

/** SVG ring that depletes over AUTO_DISMISS_MS milliseconds. */
const CountdownRing = ({
  firedAt,
  color,
}: {
  firedAt: number;
  color: string;
}) => {
  const SIZE = 28;
  const STROKE = 2.5;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - firedAt;
      const pct = Math.min(elapsed / AUTO_DISMISS_MS, 1);
      setOffset(CIRC * pct);
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [firedAt, CIRC]);

  return (
    <svg width={SIZE} height={SIZE} className="-rotate-90 shrink-0" aria-hidden>
      {/* Track */}
      <circle
        cx={SIZE / 2} cy={SIZE / 2} r={R}
        fill="none" stroke="currentColor"
        strokeWidth={STROKE} className="text-black/8"
      />
      {/* Progress */}
      <circle
        cx={SIZE / 2} cy={SIZE / 2} r={R}
        fill="none" stroke={color}
        strokeWidth={STROKE}
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
      />
    </svg>
  );
};

// ─── SingleToast ──────────────────────────────────────────────────────────────

const SingleToast = ({
  alert,
  onDismiss,
  stackIndex,
}: {
  alert: ProximityAlert;
  onDismiss: (id: string) => void;
  stackIndex: number; // 0 = front (full opacity), 1+ = peeking behind
}) => {
  const theme = URGENCY_THEME[alert.urgency];
  const isPeeking = stackIndex > 0;

  return (
    <motion.div
      layout
      key={alert.alertId}
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{
        opacity: isPeeking ? 0.6 - stackIndex * 0.15 : 1,
        y: isPeeking ? stackIndex * -6 : 0,
        scale: isPeeking ? 1 - stackIndex * 0.04 : 1,
        zIndex: 50 - stackIndex,
      }}
      exit={{ opacity: 0, y: 32, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
    >
      <div
        className={`
          mx-auto max-w-sm w-full
          bg-white rounded-2xl border ${theme.border}
          shadow-lg ${theme.glow}
          overflow-hidden
          pointer-events-${isPeeking ? 'none' : 'auto'}
        `}
      >
        {/* Urgency colour bar */}
        <div className={`h-0.5 w-full ${theme.bar}`} />

        <div className="px-4 pt-3 pb-3.5 flex items-start gap-3">
          {/* Pin icon */}
          <div className={`w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0 ${theme.icon}`}>
            <MapPin className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-brand-text-primary leading-tight truncate">
                {alert.taskTitle}
              </p>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${theme.badge}`}>
                {alert.urgency}
              </span>
            </div>

            {/* Distance + score row */}
            <div className="flex items-center gap-3 text-[11px] text-brand-text-secondary">
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {alert.distanceLabel} away
              </span>
              <span className="flex items-center gap-1 font-semibold text-brand-primary">
                <Zap className="w-3 h-3" />
                {alert.proximityPct}% proximity
              </span>
            </div>
          </div>

          {/* Countdown ring + dismiss */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <CountdownRing firedAt={alert.firedAt} color={theme.ring} />
            <button
              onClick={() => onDismiss(alert.alertId)}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3 text-brand-text-secondary" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── ProximityToastStack ──────────────────────────────────────────────────────

interface ProximityToastStackProps {
  alerts: ProximityAlert[];
  onDismiss: (alertId: string) => void;
  /** Extra bottom offset so the stack clears the mobile nav bar (default 88px). */
  bottomOffset?: number;
}

export const ProximityToastStack = ({
  alerts,
  onDismiss,
  bottomOffset = 88,
}: ProximityToastStackProps) => {
  // Show at most 3 in the stack; oldest are at the back.
  const visible = alerts.slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div
      className="fixed left-4 right-4 z-50 pointer-events-none"
      style={{ bottom: bottomOffset }}
      aria-live="polite"
      aria-label="Nearby task alerts"
    >
      <div className="relative" style={{ height: '100px' }}>
        <AnimatePresence>
          {visible.map((alert, idx) => (
            <SingleToast
              key={alert.alertId}
              alert={alert}
              onDismiss={onDismiss}
              stackIndex={idx}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Overflow pill */}
      <AnimatePresence>
        {alerts.length > 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-2 flex justify-center pointer-events-auto"
          >
            <span className="px-3 py-1 bg-brand-primary text-white rounded-full text-[10px] font-bold shadow">
              +{alerts.length - 3} more nearby tasks
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};