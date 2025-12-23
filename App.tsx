import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EventType, Highlight, ScanSettings, Rect } from './types';
import { analyzeFrame } from './services/geminiService';
import HighlightList from './components/HighlightList';
import VideoArea from './components/VideoArea';
import SettingsPanel from './components/SettingsPanel';
import Header from './components/Header';

const App: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [settings, setSettings] = useState<ScanSettings>({
    scanSpeed: 4,
    preRoll: 5,
    clipDuration: 15,
    detectSix: true,
    detectFour: true,
    detectWicket: true,
    detectOverEnd: true,
    detectionArea: { x: 30, y: 65, width: 40, height: 25 }, // Default focus on scorecard area
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDetectionTimeRef = useRef<number>(-100);
  const isScanningRef = useRef(false);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(file));
      setHighlights([]);
      setScanProgress(0);
    }
    e.target.value = '';
  };

  const captureFrame = useCallback((crop: boolean = true): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    if (crop) {
      const { x, y, width, height } = settings.detectionArea;
      canvas.width = (vw * width) / 100;
      canvas.height = (vh * height) / 100;
      ctx.drawImage(
        video,
        (vw * x) / 100, (vh * y) / 100, (vw * width) / 100, (vh * height) / 100,
        0, 0, canvas.width, canvas.height
      );
    } else {
      canvas.width = vw;
      canvas.height = vh;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }, [settings.detectionArea]);

  const runScanner = async () => {
    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) return;

    setIsScanning(true);
    isScanningRef.current = true;
    
    const duration = video.duration;
    const step = settings.scanSpeed; 
    let currentTime = video.currentTime;

    if (currentTime >= duration - 1) currentTime = 0;

    try {
      while (currentTime < duration && isScanningRef.current) {
        video.currentTime = currentTime;
        
        await new Promise((resolve) => {
          const onSeek = () => {
            video.removeEventListener('seeked', onSeek);
            resolve(true);
          };
          video.addEventListener('seeked', onSeek);
          setTimeout(resolve, 2000);
        });

        const base64Crop = captureFrame(true);
        if (base64Crop) {
          const result = await analyzeFrame(base64Crop);
          
          const shouldAdd = 
            result.event !== EventType.NONE && 
            result.confidence > 0.65 &&
            (currentTime - lastDetectionTimeRef.current > 8) && 
            ((result.event === EventType.SIX && settings.detectSix) ||
             (result.event === EventType.FOUR && settings.detectFour) ||
             (result.event === EventType.WICKET && settings.detectWicket) ||
             (result.event === EventType.OVER_END_UPDATE && settings.detectOverEnd));

          if (shouldAdd) {
            const fullThumbnail = captureFrame(false);
            const newHighlight: Highlight = {
              id: Math.random().toString(36).substr(2, 9),
              type: result.event,
              timestamp: currentTime,
              thumbnail: `data:image/jpeg;base64,${fullThumbnail}`,
              label: `${result.event} @ ${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(0).padStart(2, '0')}`,
              included: true,
            };
            setHighlights(prev => [...prev, newHighlight]);
            lastDetectionTimeRef.current = currentTime;
          }
        }

        currentTime += step;
        setScanProgress((currentTime / duration) * 100);
        await new Promise(r => setTimeout(r, 60));
      }
    } finally {
      setIsScanning(false);
      isScanningRef.current = false;
    }
  };

  const toggleScan = () => {
    if (isScanningRef.current) {
      isScanningRef.current = false;
      setIsScanning(false);
    } else {
      runScanner();
    }
  };

  const deleteHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  const jumpToHighlight = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, timestamp - settings.preRoll);
      videoRef.current.play();
    }
  };

  const exportCombinedVideo = async () => {
    const activeHighlights = highlights.filter(h => h.included);
    if (activeHighlights.length === 0 || !videoRef.current) return;
    
    setIsExporting(true);
    setExportProgress(0);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Audio Capture setup
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(video);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    source.connect(audioCtx.destination); // Let user hear what's being recorded

    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, { 
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 6000000 
    });
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const recordingEnded = new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CricketHighlights_${Date.now()}.webm`;
        a.click();
        resolve(true);
      };
    });

    recorder.start();

    let count = 0;
    for (const h of activeHighlights) {
      const start = Math.max(0, h.timestamp - settings.preRoll);
      const end = Math.min(video.duration, h.timestamp + (settings.clipDuration - settings.preRoll));
      
      video.currentTime = start;
      await new Promise(r => {
        const onSeek = () => { video.removeEventListener('seeked', onSeek); r(true); };
        video.addEventListener('seeked', onSeek);
      });

      await video.play();
      
      const segmentDuration = end - start;
      const startTime = Date.now();
      
      // Draw frames during playback
      while ((Date.now() - startTime) / 1000 < segmentDuration) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        await new Promise(r => requestAnimationFrame(r));
      }
      
      video.pause();
      count++;
      setExportProgress((count / activeHighlights.length) * 100);
    }

    recorder.stop();
    await recordingEnded;

    // Cleanup
    setIsExporting(false);
    source.disconnect();
    audioCtx.close();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
      <Header />
      
      <main className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-slate-700 bg-slate-800 flex flex-col">
          <HighlightList 
            highlights={highlights} 
            onDelete={deleteHighlight} 
            onJump={jumpToHighlight}
            isScanning={isScanning}
          />
        </div>

        <div className="flex-1 flex flex-col bg-black relative">
          <VideoArea 
            videoUrl={videoUrl}
            videoRef={videoRef}
            onUpload={handleFileUpload}
            isScanning={isScanning}
            scanProgress={scanProgress}
            detectionArea={settings.detectionArea}
            onAreaChange={(area) => setSettings(prev => ({ ...prev, detectionArea: area }))}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="w-80 border-l border-slate-700 bg-slate-800 p-6 flex flex-col">
          <SettingsPanel 
            settings={settings}
            setSettings={setSettings}
            onScanToggle={toggleScan}
            isScanning={isScanning}
            onExport={exportCombinedVideo}
            isExporting={isExporting}
            exportProgress={exportProgress}
            hasHighlights={highlights.length > 0}
            hasVideo={!!videoUrl}
          />
        </div>
      </main>

      {isExporting && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-10 backdrop-blur-sm">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/50">
               <svg className="w-10 h-10 text-emerald-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-emerald-400">Exporting Highlights</h2>
            <p className="text-slate-400 mb-8">Generating your combined WebM clip at 30fps native resolution...</p>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs font-mono text-slate-500">
              <span>PROCESSED: {Math.round(exportProgress)}%</span>
              <span>EST. TIME: ~{Math.round((100 - exportProgress) * 0.5)}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;