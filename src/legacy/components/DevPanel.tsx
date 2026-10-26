/**
 * Developer Physics Tuning & Testing Laboratory Console for Just Short.
 * Exposes real-time sliders for gravity, stiffness, bending moment, friction,
 * telemetry for stored energy, phase, and deformation, and selectable Lab Challenges.
 */

import React from 'react';
import { LabChallenge, PhysicsConfig } from '../types/game';
import { Sliders, Eye, RefreshCw, X, FlaskConical, Mountain } from 'lucide-react';

interface DevPanelProps {
  config: PhysicsConfig;
  onChangeConfig: (newConfig: PhysicsConfig) => void;
  onResetDefaults: () => void;
  isDebugMode: boolean;
  onToggleDebug: () => void;
  isOpen: boolean;
  onClose: () => void;
  playerState: string;
  vx: number;
  vy: number;
  speed: number;
  strain: number;
  springForce: number;
  heightGained: number;
  distanceTraveled: number;
  storedEnergy: number;
  deformationPx: number;
  phase: string;
  plantStatus: string;
  anchorX: number;
  anchorY: number;
  activeChallenge: LabChallenge;
  onSelectChallenge: (challenge: LabChallenge) => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({
  config,
  onChangeConfig,
  onResetDefaults,
  isDebugMode,
  onToggleDebug,
  isOpen,
  onClose,
  playerState,
  vx,
  vy,
  speed,
  strain,
  springForce,
  heightGained,
  distanceTraveled,
  storedEnergy,
  deformationPx,
  phase,
  plantStatus,
  anchorX,
  anchorY,
  activeChallenge,
  onSelectChallenge,
}) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof PhysicsConfig, value: number) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  const challengeList: { id: LabChallenge; label: string; desc: string }[] = [
    { id: 'NONE', label: 'Mountain', desc: 'Handcrafted alpine 5-jump route' },
    { id: 'TEST_A', label: 'Lab A: Precision', desc: 'Short 90px gap onto narrow 110px spire' },
    { id: 'TEST_B', label: 'Lab B: Distance', desc: 'Wide 220px gap level sprint' },
    { id: 'TEST_C', label: 'Lab C: Height', desc: 'Elevated spire (+150px vertical climb)' },
    { id: 'TEST_D', label: 'Lab D: Ice Landing', desc: '130px gap to low-friction ice shelf' },
  ];

  return (
    <div className="fixed top-16 right-4 z-40 w-88 max-h-[calc(100vh-5rem)] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-4 text-slate-100 shadow-2xl text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <FlaskConical className="w-4 h-4 text-amber-400" />
          <span>Physics Lab & Tuning Console</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Physics Laboratory Mode Switcher */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-2">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Select Test Scenario</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {challengeList.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onSelectChallenge(ch.id)}
              className={`text-left px-2.5 py-1.5 rounded-lg border transition-all ${
                activeChallenge === ch.id
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <div className="font-semibold text-[11px] flex items-center justify-between">
                <span>{ch.label}</span>
                {activeChallenge === ch.id && (
                  <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">{ch.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Physical Telemetry Monitor */}
      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 mb-4 space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center text-slate-400">
          <span>State / Phase:</span>
          <span className="font-semibold text-emerald-400 uppercase tracking-wide">
            {playerState} · <span className="text-amber-300">{phase}</span>
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Velocity (vx, vy):</span>
          <span className="tabular-nums text-slate-200">
            {Math.round(vx)} · {Math.round(vy)} px/s
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Ground Speed:</span>
          <span className="tabular-nums text-slate-200">{Math.round(speed)} px/s</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Deformation:</span>
          <span className="tabular-nums text-amber-400">
            {deformationPx.toFixed(1)} px ({(strain * 100).toFixed(0)}%)
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Stored Energy:</span>
          <span className="tabular-nums text-sky-400">{Math.round(storedEnergy)} J</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Restoring Force:</span>
          <span className="tabular-nums text-amber-300">{Math.round(springForce)} N</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Height / Distance:</span>
          <span className="tabular-nums text-emerald-400">
            +{Math.round(heightGained)}px · {Math.round(distanceTraveled)}px
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Plant Anchor:</span>
          <span className="tabular-nums text-slate-300">
            ({Math.round(anchorX)}, {Math.round(anchorY)})
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Plant Status:</span>
          <span
            className={`text-[10px] ${
              plantStatus.includes('Valid') ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {plantStatus}
          </span>
        </div>
      </div>

      {/* Debug Overlay Button */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={onToggleDebug}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-medium transition-colors border ${
            isDebugMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>F3 Vectors ({isDebugMode ? 'ON' : 'OFF'})</span>
        </button>

        <button
          onClick={onResetDefaults}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
          title="Reset to Defaults"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sliders List */}
      <div className="space-y-3.5">
        {/* Sim Speed */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Simulation Speed</span>
            <span className="font-mono tabular-nums text-amber-400">{config.simSpeed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.05"
            value={config.simSpeed}
            onChange={(e) => handleChange('simSpeed', parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Gravity */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Gravity (g)</span>
            <span className="font-mono tabular-nums text-slate-400">{config.gravity}</span>
          </div>
          <input
            type="range"
            min="400"
            max="2000"
            step="50"
            value={config.gravity}
            onChange={(e) => handleChange('gravity', parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Pole Radial Stiffness (k) */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Radial Stiffness (k)</span>
            <span className="font-mono tabular-nums text-slate-400">{config.poleStiffness} N/px</span>
          </div>
          <input
            type="range"
            min="40"
            max="300"
            step="5"
            value={config.poleStiffness}
            onChange={(e) => handleChange('poleStiffness', parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Bending Stiffness (kBend) */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Bending Restoring Torque</span>
            <span className="font-mono tabular-nums text-slate-400">{config.bendingStiffness}</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={config.bendingStiffness}
            onChange={(e) => handleChange('bendingStiffness', parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Pole Damping */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Pole Damping (c)</span>
            <span className="font-mono tabular-nums text-slate-400">{config.poleDamping.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="12.0"
            step="0.5"
            value={config.poleDamping}
            onChange={(e) => handleChange('poleDamping', parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Pole Length */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Pole Rest Length (L0)</span>
            <span className="font-mono tabular-nums text-slate-400">{config.poleLength} px</span>
          </div>
          <input
            type="range"
            min="120"
            max="260"
            step="5"
            value={config.poleLength}
            onChange={(e) => handleChange('poleLength', parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Run Acceleration */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Run Acceleration (Gradual)</span>
            <span className="font-mono tabular-nums text-slate-400">{config.runAcceleration} px/s²</span>
          </div>
          <input
            type="range"
            min="400"
            max="2000"
            step="50"
            value={config.runAcceleration}
            onChange={(e) => handleChange('runAcceleration', parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Max Run Speed */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Max Run Speed</span>
            <span className="font-mono tabular-nums text-slate-400">{config.maxRunSpeed} px/s</span>
          </div>
          <input
            type="range"
            min="200"
            max="450"
            step="10"
            value={config.maxRunSpeed}
            onChange={(e) => handleChange('maxRunSpeed', parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
