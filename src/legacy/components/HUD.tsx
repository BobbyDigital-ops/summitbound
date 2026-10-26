/**
 * HUD & Top Navigation Bar for Just Short.
 * Strictly adheres to Top Bar Contract and clean telemetry overlays.
 */

import React from 'react';
import { GameMode, LabChallenge } from '../types/game';
import { Volume2, VolumeX, Sliders, HelpCircle, RotateCcw, FlaskConical } from 'lucide-react';
import { sounds } from '../audio/SoundEffects';

interface HUDProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  checkpointName: string;
  jumps: number;
  time: number;
  speed: number;
  isDevPanelOpen: boolean;
  onToggleDevPanel: () => void;
  onOpenHelp: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  activeChallenge: LabChallenge;
  onSelectChallenge: (challenge: LabChallenge) => void;
}

export const HUD: React.FC<HUDProps> = ({
  mode,
  onSelectMode,
  checkpointName,
  jumps,
  time,
  speed,
  isDevPanelOpen,
  onToggleDevPanel,
  onOpenHelp,
  onRestart,
  isMuted,
  onToggleMute,
  activeChallenge,
  onSelectChallenge,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-6 px-6 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 text-slate-100 select-none">
      {/* Zone 1: Brand Wordmark (Single line, display face) */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="text-xl font-black tracking-tight text-slate-100 whitespace-nowrap shrink-0">
          JUST SHORT
        </a>
        <span className="hidden sm:inline-block text-xs text-slate-400 font-serif italic">
          Mountain Physics Ascent
        </span>
      </div>

      {/* Zone 2: Mode Selector & Telemetry (Single line, whitespace-nowrap) */}
      <div className="flex items-center gap-6 text-xs text-slate-300">
        {/* Game Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => onSelectMode('NORMAL')}
            className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
              mode === 'NORMAL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => onSelectMode('HARDCORE')}
            className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
              mode === 'HARDCORE'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hardcore
          </button>
        </div>

        {/* Lab Challenge Indicator Badge */}
        {activeChallenge !== 'NONE' && (
          <button
            onClick={() => onSelectChallenge('NONE')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono hover:bg-amber-500/30 transition-colors"
            title="Click to return to Mountain Route"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span>{activeChallenge.replace('TEST_', 'LAB ')} (Exit Lab)</span>
          </button>
        )}

        {/* Clean Telemetry Indicators */}
        <div className="hidden md:flex items-center gap-4 font-mono text-slate-300">
          <div>
            <span className="text-slate-500">Area: </span>
            <span className="text-amber-400">{checkpointName}</span>
          </div>
          <span className="text-slate-700">·</span>
          <div>
            <span className="text-slate-500">Vaults: </span>
            <span className="tabular-nums text-slate-200">{jumps}</span>
          </div>
          <span className="text-slate-700">·</span>
          <div>
            <span className="text-slate-500">Time: </span>
            <span className="tabular-nums text-slate-200">{formatTime(time)}</span>
          </div>
        </div>
      </div>

      {/* Zone 3: Quick Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sound Toggle */}
        <button
          onClick={onToggleMute}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Quick Restart */}
        <button
          onClick={onRestart}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          title="Restart Attempt (R)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Help / Controls Info */}
        <button
          onClick={onOpenHelp}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          title="Controls Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Physics Panel Toggle */}
        <button
          onClick={onToggleDevPanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
            isDevPanelOpen
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Physics Panel</span>
        </button>
      </div>
    </header>
  );
};
