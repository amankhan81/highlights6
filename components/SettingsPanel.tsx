
import React from 'react';
import { ScanSettings } from '../types';

interface SettingsPanelProps {
  settings: ScanSettings;
  setSettings: (s: ScanSettings) => void;
  onScanToggle: () => void;
  isScanning: boolean;
  onExport: () => void;
  isExporting: boolean;
  exportProgress: number;
  hasHighlights: boolean;
  hasVideo: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  settings, setSettings, onScanToggle, isScanning, onExport, isExporting, hasHighlights, hasVideo 
}) => {
  const updateSetting = <K extends keyof ScanSettings>(key: K, value: ScanSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Scanner Config</h2>
      
      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Scan Speed */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-3">Scan Speed: {settings.scanSpeed}x</label>
          <input 
            type="range" min="1" max="8" step="1"
            value={settings.scanSpeed}
            onChange={(e) => updateSetting('scanSpeed', parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            disabled={isScanning}
          />
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] text-slate-600 font-bold">1X (Detailed)</span>
            <span className="text-[10px] text-slate-600 font-bold">8X (Fast)</span>
          </div>
        </div>

        {/* Clip Timing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Pre-Roll (s)</label>
            <input 
              type="number" min="0" max="30"
              value={settings.preRoll}
              onChange={(e) => updateSetting('preRoll', parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              disabled={isScanning}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Duration (s)</label>
            <input 
              type="number" min="5" max="60"
              value={settings.clipDuration}
              onChange={(e) => updateSetting('clipDuration', parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              disabled={isScanning}
            />
          </div>
        </div>

        {/* Event Toggles */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Detect Events</label>
          {[
            { id: 'detectSix', label: 'Sixes (6)', color: 'border-purple-500' },
            { id: 'detectFour', label: 'Fours (4)', color: 'border-blue-500' },
            { id: 'detectWicket', label: 'Wickets / Out', color: 'border-red-500' },
            { id: 'detectOverEnd', label: 'Over Summary', color: 'border-emerald-500' }
          ].map((evt) => (
            <label key={evt.id} className={`flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-900/50 cursor-pointer hover:bg-slate-900 transition-colors ${settings[evt.id as keyof ScanSettings] ? 'border-l-4 ' + evt.color : ''}`}>
              <span className="text-sm font-medium text-slate-300">{evt.label}</span>
              <input 
                type="checkbox"
                checked={!!settings[evt.id as keyof ScanSettings]}
                onChange={(e) => updateSetting(evt.id as keyof ScanSettings, e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-800"
                disabled={isScanning}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="pt-6 space-y-4">
        <button 
          onClick={onScanToggle}
          disabled={!hasVideo}
          className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            ${isScanning 
              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
              : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-emerald-500/20'
            }`}
        >
          {isScanning ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Stop Scanning
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Start Smart Scan
            </>
          )}
        </button>

        <button 
          onClick={onExport}
          disabled={!hasHighlights || isScanning || isExporting}
          className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Highlight Reel
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
