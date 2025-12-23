
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          CricketScan <span className="text-emerald-500">AI</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-400">Smart Highlight Generator</span>
        <div className="h-4 w-[1px] bg-slate-700"></div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Gemini Powered</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
