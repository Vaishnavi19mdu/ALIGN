// ─── useProximityAlerts.ts ────────────────────────────────────────────────────
// Detects nearby tasks relative to the volunteer's current location.
// Deduplicates alerts so each task only fires once per session.
// Returns a list of active toast alerts the UI can render.

import { useState, useEffect, useRef, useCallback } from 'react';
import { getDistanceKm, formatDistance, proximityScore } from '../../lib/locationUtils'
import type { GeoCoords } from './../lib/locationUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NearbyTask {
  id: string;
  title: string;
  location: string;
  skill: string;
  urgency: 'Low' | 'High' | 'Critical';
  coords?: GeoCoords | null; // null = no coords available → skip distance calc
}

export interface ProximityAlert {
  alertId: string;       // unique per alert, stable for React keys
  taskId: string;
  taskTitle: string;
  distanceKm: number;
  distanceLabel: string; // "850 m" | "3.2 km"
  proximityPct: number;  // 0–100, for progress ring / badge
  urgency: NearbyTask['urgency'];
  firedAt: number;       // epoch ms — used for auto-dismiss countdown
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Tasks closer than this distance (km) will trigger an alert. */
const ALERT_RADIUS_KM = 5;

/** How long (ms) before an alert auto-dismisses. */
const AUTO_DISMISS_MS = 6_000;

/** Minimum gap (ms) between re-checking the same volunteer position. */
const RECHECK_THROTTLE_MS = 30_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useProximityAlerts
 *
 * @param volunteerCoords  Current volunteer position (null = not yet known).
 * @param tasks            Full task list — only tasks with coords are checked.
 * @param radiusKm         Override the default 5 km alert radius.
 *
 * @returns
 *   alerts      Active (non-dismissed) ProximityAlert list.
 *   dismiss     Call with alertId to manually remove an alert.
 *   clearAll    Clears all active alerts (e.g. on page change).
 */
export function useProximityAlerts(
  volunteerCoords: GeoCoords | null,
  tasks: NearbyTask[],
  radiusKm = ALERT_RADIUS_KM,
): {
  alerts: ProximityAlert[];
  dismiss: (alertId: string) => void;
  clearAll: () => void;
} {
  const [alerts, setAlerts] = useState<ProximityAlert[]>([]);

  // Tracks which task IDs have already fired an alert this session.
  const firedIds = useRef<Set<string>>(new Set());

  // Throttle: record the last time we ran the full proximity check.
  const lastCheckAt = useRef<number>(0);

  // Auto-dismiss timer refs: alertId → timeout handle
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Auto-dismiss logic ────────────────────────────────────────────────────

  const scheduleAutoDismiss = useCallback((alertId: string) => {
    // Clear any existing timer for this alert
    const existing = dismissTimers.current.get(alertId);
    if (existing) clearTimeout(existing);

    const handle = setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.alertId !== alertId));
      dismissTimers.current.delete(alertId);
    }, AUTO_DISMISS_MS);

    dismissTimers.current.set(alertId, handle);
  }, []);

  const dismiss = useCallback((alertId: string) => {
    const handle = dismissTimers.current.get(alertId);
    if (handle) { clearTimeout(handle); dismissTimers.current.delete(alertId); }
    setAlerts(prev => prev.filter(a => a.alertId !== alertId));
  }, []);

  const clearAll = useCallback(() => {
    dismissTimers.current.forEach(h => clearTimeout(h));
    dismissTimers.current.clear();
    setAlerts([]);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      dismissTimers.current.forEach(h => clearTimeout(h));
    };
  }, []);

  // ── Core proximity check ──────────────────────────────────────────────────

  useEffect(() => {
    if (!volunteerCoords) return;

    const now = Date.now();
    if (now - lastCheckAt.current < RECHECK_THROTTLE_MS) return;
    lastCheckAt.current = now;

    const newAlerts: ProximityAlert[] = [];

    for (const task of tasks) {
      // Skip if already alerted this session
      if (firedIds.current.has(task.id)) continue;

      // Skip tasks with no coords
      if (!task.coords) continue;

      const distKm = getDistanceKm(volunteerCoords, task.coords);
      if (distKm > radiusKm) continue;

      const alertId = `${task.id}-${now}`;
      const alert: ProximityAlert = {
        alertId,
        taskId: task.id,
        taskTitle: task.title,
        distanceKm: distKm,
        distanceLabel: formatDistance(distKm),
        proximityPct: proximityScore(distKm),
        urgency: task.urgency,
        firedAt: now,
      };

      firedIds.current.add(task.id);
      newAlerts.push(alert);
    }

    if (newAlerts.length === 0) return;

    setAlerts(prev => [...newAlerts, ...prev]);
    newAlerts.forEach(a => scheduleAutoDismiss(a.alertId));
  }, [volunteerCoords, tasks, radiusKm, scheduleAutoDismiss]);

  return { alerts, dismiss, clearAll };
}