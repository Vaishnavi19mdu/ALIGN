// ─── LocationSection.tsx ──────────────────────────────────────────────────────
// Settings card: captures, persists, and Firestore-syncs the volunteer's
// location. Uses movedBeyondThreshold (200 m) to avoid redundant uploads.

import { useState, useEffect, useRef } from 'react';
import {
  MapPin, Navigation, RefreshCw, CheckCircle2,
  AlertCircle, Loader2, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  getCurrentPosition,
  reverseGeocode,
  movedBeyondThreshold,
  type GeoCoords,
  type LocationStatus,
} from '../../lib/locationUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavedLocation {
  coords: GeoCoords;
  label: string;
  savedAt: number; // epoch ms
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'volunteer_location_v1';

export const loadSavedLocation = (): SavedLocation | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch {
    return null;
  }
};

const persistLocal = (loc: SavedLocation) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch { /* ignore */ }
};

const clearLocal = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
};

const timeAgo = (ms: number): string => {
  const diff = Date.now() - ms;
  if (diff < 60_000)     return 'just now';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return `${Math.floor(diff / 86_400_000)} day(s) ago`;
};

// ─── Firestore writer ─────────────────────────────────────────────────────────

async function syncToFirestore(uid: string, coords: GeoCoords, label: string): Promise<void> {
  await updateDoc(doc(db, 'volunteers', uid), {
    location: { lat: coords.lat, lng: coords.lng },
    locationLabel: label,
    locationUpdatedAt: new Date().toISOString(),
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LocationSectionProps {
  /** Firestore volunteer document ID. Falls back to auth profile uid if omitted. */
  userId?: string | null;
  /**
   * Called whenever a new location is successfully captured.
   * Use this to update the parent's volunteer-coords state so proximity
   * alerts can react immediately without re-reading localStorage.
   */
  onLocationChange?: (coords: GeoCoords, label: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LocationSection = ({ userId, onLocationChange }: LocationSectionProps) => {
  const { profile } = useAuth();
  const uid = userId ?? profile?.uid ?? null;

  const [saved, setSaved] = useState<SavedLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setSaved(loadSavedLocation());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3_000);
  };

  // ── Core capture handler ─────────────────────────────────────────────────────

  const handleCapture = async () => {
    setStatus('requesting');
    setError(null);

    try {
      const coords = await getCurrentPosition();

      // Throttle: skip Firestore write if volunteer hasn't moved 200 m
      const prevCoords = saved?.coords ?? null;
      const hasMoved = !prevCoords || movedBeyondThreshold(prevCoords, coords, 200);

      const label = await reverseGeocode(coords);
      const entry: SavedLocation = { coords, label, savedAt: Date.now() };

      setSaved(entry);
      persistLocal(entry);
      setStatus('granted');
      onLocationChange?.(coords, label);

      if (uid && hasMoved) {
        try {
          await syncToFirestore(uid, coords, label);
          showToast('Location saved to your profile');
        } catch {
          showToast('Saved locally — cloud sync failed');
        }
      } else if (!hasMoved) {
        showToast('Location unchanged (< 200 m from last save)');
      } else {
        showToast('Location captured (local only)');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not get location.';
      setError(msg);
      setStatus('denied');
    }
  };

  const handleClear = () => {
    setSaved(null);
    setStatus('idle');
    setError(null);
    clearLocal();
  };

  const isRequesting = status === 'requesting';

  return (
    <Card className="p-5 space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">
            📍 Your Location
          </p>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Used to match you with nearby tasks
          </p>
        </div>
        {saved && (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Clear location"
          >
            <X className="w-3.5 h-3.5 text-brand-text-secondary" />
          </button>
        )}
      </div>

      {/* ── Saved / Empty state ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {saved ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-4 space-y-3">
              {/* Pin + label */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-brand-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text-primary leading-snug">
                    {saved.label}
                  </p>
                  <p className="text-[10px] text-brand-text-secondary mt-0.5 font-mono">
                    {saved.coords.lat.toFixed(5)}, {saved.coords.lng.toFixed(5)}
                  </p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between text-[10px] text-brand-text-secondary border-t border-brand-primary/10 pt-2">
                <span>Updated {timeAgo(saved.savedAt)}</span>
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            </div>

            {/* Update button */}
            <button
              onClick={handleCapture}
              disabled={isRequesting}
              className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-brand-primary hover:opacity-75 transition-opacity disabled:opacity-40"
            >
              {isRequesting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              {isRequesting ? 'Getting location…' : 'Update Location'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Privacy explainer */}
            <div className="rounded-xl border border-black/8 bg-brand-background px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-brand-text-primary">Why we need this</p>
              <p className="text-[11px] text-brand-text-secondary leading-relaxed">
                We use your location only to calculate how close you are to each task — never for tracking.
                You can remove it any time.
              </p>
            </div>

            {/* CTA */}
            <Button
              className="w-full gap-2 text-sm"
              onClick={handleCapture}
              disabled={isRequesting}
            >
              {isRequesting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Navigation className="w-4 h-4" />}
              {isRequesting ? 'Requesting permission…' : 'Use Current Location'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-brand-text-primary text-white text-[11px] font-semibold rounded-full shadow-lg whitespace-nowrap"
          >
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};