/**
 * Victory Card Modal for Just Short when reaching the Mountain Summit.
 */

import React from 'react';
import { GameMode } from '../types/game';
import { Trophy, Clock, Zap, RotateCcw, X, Flame } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  time: number;
  jumps: number;
  mode: GameMode;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  time,
  jumps,
  mode,
}) => {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms < 10 ? '0' : ''}${ms}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Icon */}
        <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-amber-400 uppercase mb-1">
          <Flame className="w-3.5 h-3.5" />
          <span>Stage 1 Completed</span>
        </div>

        <h2 className="text-2xl font-black text-white mb-2">
          Grand Peak Summit Conquered!
        </h2>

        <p className="text-xs text-slate-400 mb-6">
          You navigated the five vertical spires, mastered the elastic pole physics, and reached the warm campfire cave.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 mb-6">
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ascent Time</span>
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-100">
              {formatTime(time)}
            </div>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Total Vaults</span>
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-100">
              {jumps}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onRestart();
              onClose();
            }}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again / Speedrun Ascent</span>
          </button>
        </div>
      </div>
    </div>
  );
};
