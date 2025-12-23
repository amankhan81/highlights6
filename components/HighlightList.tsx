
import React from 'react';
import { Highlight, EventType } from '../types';

interface HighlightListProps {
  highlights: Highlight[];
  onDelete: (id: string) => void;
  onJump: (timestamp: number) => void;
  isScanning: boolean;
}

const HighlightList: React.FC<HighlightListProps> = ({ highlights, onDelete, onJump, isScanning }) => {
  const getBadgeColor = (type: EventType) => {
    switch (type) {
      case EventType.SIX: return 'bg-purple-600';
      case EventType.FOUR: return 'bg-blue-600';
      case EventType.WICKET: return 'bg-red-600';
      case EventType.OVER_END_UPDATE: return 'bg-emerald-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          Timeline
          <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px]">{highlights.length} Clips</span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {highlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-50 grayscale">
            <svg className="w-12 h-12 mb-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm text-slate-400">No highlights detected yet.</p>
            {isScanning && <p className="text-xs text-emerald-500 animate-pulse mt-1 italic">Scanning match...</p>}
          </div>
        ) : (
          highlights.map((h) => (
            <div 
              key={h.id}
              className="group relative bg-slate-700/50 border border-slate-700 rounded-lg overflow-hidden hover:border-emerald-500/50 transition-colors cursor-pointer"
              onClick={() => onJump(h.timestamp)}
            >
              <div className="aspect-video w-full relative">
                <img src={h.thumbnail} alt={h.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase ${getBadgeColor(h.type)} shadow-lg`}>
                  {h.type.replace('_', ' ')}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(h.id);
                  }}
                  className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded-full text-slate-300 hover:text-red-400 hover:bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">{h.label}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {Math.floor(h.timestamp / 60)}:{(h.timestamp % 60).toFixed(0).padStart(2, '0')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HighlightList;
