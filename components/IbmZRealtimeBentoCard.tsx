/**
 * IbmZRealtimeBentoCard.tsx
 * Nutri-Guardian Z — IBM LinuxONE (s390x) Real-Time Decision Bento Card
 *
 * IBM Z Datathon 2026 — Theme 01: Real-Time AI for Critical Decisions
 *
 * Matches the existing Tailwind CSS Bento-card aesthetic (glassmorphism / dark-mode clinical).
 * Uses ONLY Tailwind classes present in the CDN build (no custom purge needed).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, Zap, ShieldAlert, ShieldCheck, Cpu, AlertTriangle, RefreshCw, Play } from 'lucide-react';
import {
  evaluateRealtimeDecision,
  fetchZTelemetry,
  subscribeToVitalStream,
  generateCriticalDemoPayload,
  generateSafeBaselinePayload,
  type ZDecisionResult,
  type ZTelemetry,
  type StreamingVitals,
  type PatientScanPayload,
} from '../utils/ibmZRealtimeService';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const PulsingDot: React.FC<{ color: string }> = ({ color }) => (
  <span className="relative flex h-2.5 w-2.5">
    <span
      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}
    />
    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
  </span>
);

const VitalTile: React.FC<{
  label: string;
  value: string;
  unit: string;
  alert: boolean;
  critical: boolean;
}> = ({ label, value, unit, alert, critical }) => (
  <div
    className={`p-3 rounded-2xl border transition-all duration-500 ${
      critical
        ? 'bg-red-950/60 border-red-500/40'
        : alert
        ? 'bg-amber-950/60 border-amber-500/40'
        : 'bg-white/5 border-white/10'
    }`}
  >
    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className={`text-base font-black ${critical ? 'text-red-400' : alert ? 'text-amber-400' : 'text-emerald-400'}`}>
      {value}
      <span className="text-[10px] font-bold text-slate-500 ml-0.5">{unit}</span>
    </p>
  </div>
);

const DecisionBadge: React.FC<{ status: ZDecisionResult['decision_status'] | null }> = ({ status }) => {
  if (!status) return null;
  const cfg = {
    SAFE_CONTINUE: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', label: 'SAFE TO CONSUME' },
    WARN_TITRATE_DOSE: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', label: 'WARN: TITRATE DOSE' },
    CRITICAL_INTERCEPT_CONTRAINDICATION: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', label: 'CRITICAL INTERCEPT' },
  }[status];

  return (
    <div className={`px-3 py-1.5 rounded-xl border ${cfg.bg} flex items-center gap-1.5`}>
      {status === 'SAFE_CONTINUE' ? (
        <ShieldCheck size={12} className={cfg.text} />
      ) : (
        <ShieldAlert size={12} className={cfg.text} />
      )}
      <span className={`text-[10px] font-black uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface IbmZRealtimeBentoCardProps {
  /** Optional: patient profile data to pre-fill biomarkers */
  patientGlucose?: number;
  patientEgfr?: number;
  patientPotassium?: number;
  onDecisionResult?: (result: ZDecisionResult) => void;
}

const IbmZRealtimeBentoCard: React.FC<IbmZRealtimeBentoCardProps> = ({
  patientGlucose,
  patientEgfr,
  patientPotassium,
  onDecisionResult,
}) => {
  const [telemetry, setTelemetry]       = useState<ZTelemetry | null>(null);
  const [vitals, setVitals]             = useState<StreamingVitals | null>(null);
  const [decision, setDecision]         = useState<ZDecisionResult | null>(null);
  const [isRunning, setIsRunning]       = useState(false);
  const [isFetching, setIsFetching]     = useState(false);
  const [demoMode, setDemoMode]         = useState<'normal' | 'critical'>('normal');
  const unsubRef                        = useRef<(() => void) | null>(null);

  // Fetch telemetry on mount
  useEffect(() => {
    fetchZTelemetry().then(setTelemetry);
  }, []);

  // Start streaming vitals
  const startStream = useCallback(() => {
    if (unsubRef.current) unsubRef.current();
    setIsRunning(true);
    unsubRef.current = subscribeToVitalStream(
      (v) => {
        setVitals(v);
        // Auto-evaluate on critical food scan events
        if (v.food_scan_event && v.alert_level !== 'SAFE') {
          const payload: PatientScanPayload = {
            continuous_glucose_mg_dl: v.continuous_glucose,
            heart_rate_bpm: v.heart_rate,
            systolic_bp_mmhg: v.systolic_bp,
            egfr_ml_min: patientEgfr ?? 28,
            serum_potassium_mmol: v.serum_potassium,
            active_med_warfarin: v.warfarin_active ? 1 : 0,
            active_med_ace_inhibitor: v.ace_inhibitor ? 1 : 0,
            meal_potassium_mg: v.food_scan_event.potassium_mg,
            meal_vitamin_k_mcg: v.food_scan_event.vitamin_k_mcg,
            meal_sodium_mg: 500,
            meal_glycemic_load: v.food_scan_event.glycemic_load,
          };
          evaluateRealtimeDecision(payload).then((r) => {
            setDecision(r);
            onDecisionResult?.(r);
          });
        }
      },
      (err) => console.error('[IBM Z Stream]', err)
    );
  }, [patientEgfr, onDecisionResult]);

  // Stop streaming
  const stopStream = useCallback(() => {
    setIsRunning(false);
    unsubRef.current?.();
    unsubRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { unsubRef.current?.(); }, []);

  // Demo: simulate critical collision
  const runCriticalDemo = useCallback(async () => {
    setIsFetching(true);
    setDemoMode('critical');
    const payload = generateCriticalDemoPayload();
    const result  = await evaluateRealtimeDecision(payload);
    setDecision(result);
    onDecisionResult?.(result);
    setIsFetching(false);
  }, [onDecisionResult]);

  // Demo: safe baseline
  const runSafeDemo = useCallback(async () => {
    setIsFetching(true);
    setDemoMode('normal');
    const payload = generateSafeBaselinePayload();
    const result  = await evaluateRealtimeDecision(payload);
    setDecision(result);
    onDecisionResult?.(result);
    setIsFetching(false);
  }, [onDecisionResult]);

  const alertLevel = vitals?.alert_level ?? 'SAFE';

  return (
    <div className="bento-card p-8 bg-slate-900 text-white relative overflow-hidden border-none shadow-2xl col-span-1 lg:col-span-2">
      {/* Background glow */}
      <div
        className={`absolute inset-0 opacity-10 transition-all duration-1000 ${
          alertLevel === 'CRITICAL' ? 'bg-red-500' : alertLevel === 'WARN' ? 'bg-amber-500' : 'bg-blue-500'
        }`}
        style={{ filter: 'blur(60px)' }}
      />

      <div className="relative z-10 space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PulsingDot color={alertLevel === 'CRITICAL' ? 'bg-red-500' : alertLevel === 'WARN' ? 'bg-amber-400' : 'bg-emerald-500'} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                IBM LinuxONE (s390x) Real-Time Decision Engine
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight">
              Live Clinical AI Stream
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {telemetry && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <Cpu size={12} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400">
                  {telemetry.architecture} · {telemetry.cpu_cores} cores
                </span>
              </div>
            )}
            {telemetry && (
              <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-xl">
                <Zap size={11} className="text-blue-400" />
                <span className="text-[10px] font-black text-blue-400">
                  p99 {telemetry.p99_inference_ms.toFixed(2)}ms
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Live Vitals Ticker ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <VitalTile
            label="CGM Glucose"
            value={vitals ? vitals.continuous_glucose.toFixed(0) : (patientGlucose?.toFixed(0) ?? '—')}
            unit="mg/dL"
            alert={vitals ? vitals.continuous_glucose > 180 : false}
            critical={vitals ? vitals.continuous_glucose > 270 : false}
          />
          <VitalTile
            label="Serum K+"
            value={vitals ? vitals.serum_potassium.toFixed(2) : (patientPotassium?.toFixed(2) ?? '—')}
            unit="mmol/L"
            alert={vitals ? vitals.serum_potassium > 5.0 : false}
            critical={vitals ? vitals.serum_potassium > 6.0 : false}
          />
          <VitalTile
            label="BP Systolic"
            value={vitals ? vitals.systolic_bp.toFixed(0) : '—'}
            unit="mmHg"
            alert={vitals ? vitals.systolic_bp > 140 : false}
            critical={vitals ? vitals.systolic_bp > 180 : false}
          />
          <VitalTile
            label="Heart Rate"
            value={vitals ? vitals.heart_rate.toFixed(0) : '—'}
            unit="bpm"
            alert={vitals ? vitals.heart_rate > 100 : false}
            critical={vitals ? vitals.heart_rate > 130 : false}
          />
        </div>

        {/* ── Food Scan Event Ticker ────────────────────────────────────── */}
        {vitals?.food_scan_event && (
          <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
            <Activity size={14} className="text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Food Scan Event</p>
              <p className="text-xs font-bold text-white truncate">{vitals.food_scan_event.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-tight">K+ {vitals.food_scan_event.potassium_mg}mg</p>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-tight">GL {vitals.food_scan_event.glycemic_load}</p>
            </div>
            <div className="bg-slate-700 px-2 py-1 rounded-lg shrink-0">
              <p className="text-[9px] font-black text-slate-300">{(vitals.throughput_eps / 1000).toFixed(1)}k eps</p>
            </div>
          </div>
        )}

        {/* ── Decision Output ───────────────────────────────────────────── */}
        {decision && (
          <div
            className={`p-5 rounded-2xl border transition-all duration-500 animate-in fade-in ${
              decision.decision_status === 'SAFE_CONTINUE'
                ? 'bg-emerald-950/50 border-emerald-500/30'
                : decision.decision_status === 'WARN_TITRATE_DOSE'
                ? 'bg-amber-950/50 border-amber-500/30'
                : 'bg-red-950/50 border-red-500/30'
            }`}
          >
            <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
              <DecisionBadge status={decision.decision_status} />
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                  <Zap size={10} className="text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400">
                    {decision.inference_latency_ms.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                  <Cpu size={10} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400">
                    {decision.source === 'ibm_z_linuxone' ? 's390x' : 'local fallback'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-300 mb-2">{decision.action_directive}</p>

            {decision.deterministic_rule_triggered && (
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                <p className="text-[10px] font-bold text-amber-300">{decision.deterministic_rule_triggered}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Risk Probability:</p>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    decision.risk_probability > 0.7 ? 'bg-red-500' : decision.risk_probability > 0.4 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.round(decision.risk_probability * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-white">
                {Math.round(decision.risk_probability * 100)}%
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Audit Hash:</p>
              <p className="text-[8px] font-mono text-slate-500 truncate">{decision.s390x_signature_hash.slice(0, 32)}…</p>
            </div>
          </div>
        )}

        {/* ── Controls ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            id="ibm-z-stream-toggle"
            onClick={isRunning ? stopStream : startStream}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
              isRunning
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isRunning ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
            {isRunning ? 'Stop Stream' : 'Start Vitals Stream'}
          </button>

          <button
            id="ibm-z-critical-demo"
            onClick={runCriticalDemo}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50"
          >
            <ShieldAlert size={13} />
            {isFetching && demoMode === 'critical' ? 'Evaluating…' : 'Simulate Critical Collision'}
          </button>

          <button
            id="ibm-z-safe-demo"
            onClick={runSafeDemo}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all duration-200 disabled:opacity-50"
          >
            <ShieldCheck size={13} />
            {isFetching && demoMode === 'normal' ? 'Evaluating…' : 'Safe Baseline'}
          </button>
        </div>

        {/* ── Theme Banner ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
            IBM Z Datathon 2026 · Theme 01: Real-Time AI for Critical Decisions · {telemetry?.roc_auc ? `ROC-AUC ${telemetry.roc_auc}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IbmZRealtimeBentoCard;
