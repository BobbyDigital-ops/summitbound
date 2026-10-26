/**
 * Start Menu & Controls Guide Modal for Just Short.
 */

import React from 'react';
import { GameMode } from '../types/game';
import { Mountain, Flame, ShieldAlert, Play, X, ArrowRight } from 'lucide-react';

interface StartModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

export const StartModal: React.FC<StartModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSelectMode,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-100 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Lore */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400 uppercase mb-1">
            <Mountain className="w-4 h-4" />
            <span>Alpine Vaulting Prototype · Stage 1</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            JUST SHORT
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ascend towering stone spires emerging from misty cloud valleys. Master elastic pole-vaulting physics to cross perilous mountain chasms. Plant your pole on the edge, bend into the momentum, and time your release for a magnificent launch.
          </p>
        </div>

        {/* Controls Breakdown */}
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 mb-6 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Mountaineer Controls
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-amber-300 font-bold shrink-0">
                A / D
              </span>
              <span className="text-slate-300">Run left & right / build approach momentum</span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-emerald-300 font-bold shrink-0">
                Hold SPACE / LMB
              </span>
              <span className="text-slate-300">Plant pole on surface ahead & ride pendulum swing</span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-sky-300 font-bold shrink-0">
                Release SPACE / LMB
              </span>
              <span className="text-slate-300">Detach & propel across the mountain chasm!</span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-slate-300 font-bold shrink-0">
                R / F3
              </span>
              <span className="text-slate-300">Quick respawn at checkpoint / F3 physics telemetry</span>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Select Game Mode
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSelectMode('NORMAL')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'NORMAL'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Normal Mode</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Campfire caves activate checkpoints. Falling into the abyss respawns at your last camp.
              </p>
            </button>

            <button
              onClick={() => onSelectMode('HARDCORE')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'HARDCORE'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Hardcore Mode</span>
              </div>
              <p className="text-[11px] text-slate-400">
                No checkpoint respawning! Any fall into the abyss sends you back to the very start.
              </p>
            </button>
          </div>
        </div>

        {/* Start Game CTA */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/20"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Begin Mountain Ascent</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
