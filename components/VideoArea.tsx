import React, { useRef, useState, useEffect } from 'react';
import { Rect } from '../types';

interface VideoAreaProps {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isScanning: boolean;
  scanProgress: number;
  detectionArea: Rect;
  onAreaChange: (area: Rect) => void;
}

const VideoArea: React.FC<VideoAreaProps> = ({ 
  videoUrl, videoRef, onUpload, isScanning, scanProgress, detectionArea, onAreaChange 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isScanning || !videoUrl || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setStartPos({ x, y });
    setIsDragging(true);
    onAreaChange({ x, y, width: 1, height: 1 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);

    onAreaChange({ 
      x: Math.max(0, x), 
      y: Math.max(0, y), 
      width: Math.min(100 - x, width), 
      height: Math.min(100 - y, height) 
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
      {!videoUrl ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="group w-full max-w-2xl border-2 border-dashed border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer"
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="video/*" 
            onChange={onUpload} 
            className="hidden" 
          />
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform pointer-events-none">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-center pointer-events-none">
            <h3 className="text-lg font-semibold text-slate-200 mb-1">Upload Match Footage</h3>
            <p className="text-slate-500 text-sm">MP4, MOV or WEBM files are supported</p>
          </div>
          <button 
            type="button"
            className="mt-2 px-6 py-2.5 bg-emerald-500 text-slate-900 rounded-lg font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
          >
            Browse Files
          </button>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <video 
            ref={videoRef}
            src={videoUrl}
            controls={!isScanning}
            className="max-w-full max-h-full rounded-lg shadow-2xl pointer-events-none"
            crossOrigin="anonymous"
          />
          
          {/* Scanning Overlay UI */}
          {isScanning && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center pointer-events-none rounded-lg border-2 border-emerald-500/30">
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500 px-3 py-1 rounded-full">
                <span className="animate-pulse w-2 h-2 bg-white rounded-full"></span>
                <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest">Scanning Match</span>
              </div>

              <div className="absolute bottom-8 w-2/3 max-w-md bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-700 shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">Analysis Progress</span>
                  <span className="text-xs font-bold text-emerald-400">{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Selection Box */}
          <div 
            className={`absolute border-2 border-emerald-500 bg-emerald-500/10 rounded pointer-events-none transition-shadow ${isScanning ? 'opacity-30 border-dashed' : 'opacity-100 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}
            style={{
              left: `${detectionArea.x}%`,
              top: `${detectionArea.y}%`,
              width: `${detectionArea.width}%`,
              height: `${detectionArea.height}%`
            }}
          >
            {!isScanning && (
              <div className="absolute -top-6 left-0 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter whitespace-nowrap bg-slate-900 px-1 rounded shadow">
                Detection Zone (Drag to Adjust)
              </div>
            )}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-400"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-400"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-400"></div>
          </div>
          
          {!videoUrl && <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">Loading...</div>}
        </div>
      )}
    </div>
  );
};

export default VideoArea;