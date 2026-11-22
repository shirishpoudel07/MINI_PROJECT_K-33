import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  PlayCircle, 
  PauseCircle, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Dumbbell, 
  Calendar, 
  X, 
  CheckCircle2, 
  FileVideo, 
  Layers, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function PlanOfVideosModal({ 
  isOpen, 
  onClose, 
  patient, 
  initialVideo = null, 
  onOpenCarePlanStudio = null 
}) {
  const [userSelectedVideoId, setUserSelectedVideoId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const activeVideoRef = useRef(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Derive all active videos safely
  const allPlanVideos = useMemo(() => patient?.activeVideos || [], [patient?.activeVideos]);

  // Derived active playing video (avoids setState in effect)
  const playingVideoId = userSelectedVideoId !== null
    ? userSelectedVideoId
    : (initialVideo?.id || allPlanVideos[0]?.id || null);

  if (!isOpen || !patient) return null;

  const handleTogglePlay = (videoId) => {
    if (playingVideoId === videoId) {
      setUserSelectedVideoId('');
    } else {
      setUserSelectedVideoId(videoId);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* 2x2 Video Suite Container Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-slide-up relative">
        
        {/* ============================================================== */}
        {/* MODAL HEADER: Clinical Bar with High-Contrast Close Cross      */}
        {/* ============================================================== */}
        <div className="px-4 py-3 sm:px-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 z-20 shadow-2xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Dumbbell size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  Prescribed Exercise Plan & Video Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {allPlanVideos.length} Videos • 2×2 Main Grid
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Active Protocol for <strong className="text-slate-800">{patient.name}</strong> • <span className="text-blue-700 font-semibold">{patient.condition}</span>
              </p>
            </div>
          </div>

          {/* Action buttons: Care Plan Studio + Close Cross */}
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            {onOpenCarePlanStudio && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCarePlanStudio();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Open in full Care Plan Studio"
              >
                <ExternalLink size={13} />
                <span>Care Plan Studio</span>
              </button>
            )}

            {/* High-Contrast Close Cross Button */}
            <button 
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 group"
              title="Close Exercise Plan (Esc)"
              id="close-plan-of-videos-modal"
            >
              <X size={16} strokeWidth={2.6} className="group-hover:rotate-90 transition-transform duration-200" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODAL BODY: 2×2 Video Grid (2 videos per row, 2 rows)          */}
        {/* ============================================================== */}
        <div className="p-3.5 sm:p-5 overflow-y-auto bg-slate-50/70 flex-1 min-h-0 space-y-3.5 scrollbar-thin overscroll-contain">
          
          {/* Top Quick-Filter & Audio Control Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 px-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center">
                <Layers size={11} />
              </div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                All Prescribed Exercise Videos (2×2 Grid)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                  isMuted 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-white text-slate-700 border-gray-200 hover:bg-slate-50'
                }`}
                title={isMuted ? "Unmute all videos" : "Mute all videos"}
              >
                {isMuted ? <VolumeX size={13} className="text-amber-600" /> : <Volume2 size={13} className="text-blue-600" />}
                <span>{isMuted ? 'Muted' : 'Sound On'}</span>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2×2 GRID OF VIDEO PLAYERS (2 IN TOP ROW, 2 IN BOTTOM ROW)   */}
          {/* ============================================================ */}
          {allPlanVideos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-gray-200">
              <p className="text-sm font-semibold">No exercises currently in this patient plan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {allPlanVideos.map((video, idx) => {
                const isPlaying = playingVideoId === video.id;
                const sets = video.sets || 3;
                const reps = video.reps || 10;
                const notes = video.notes || 'Perform controlled repetitions with steady breathing.';

                return (
                  <div
                    key={`video-card-${video.id || idx}`}
                    className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs h-full bg-white group ${
                      isPlaying 
                        ? 'border-blue-500 ring-2 ring-blue-500/25 shadow-md bg-white' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Card Top Header: Number, Title & Dosage */}
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0 bg-white">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          #{idx + 1}
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={video.title}>
                          {video.title}
                        </h3>
                      </div>
                      
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 shrink-0 font-mono">
                        {sets}×{reps}
                      </span>
                    </div>

                    {/* Interactive Video Player Box in each 2x2 Cell */}
                    <div className="relative aspect-video max-h-40 sm:max-h-44 w-full bg-slate-950 overflow-hidden shrink-0 border-b border-gray-100">
                      {isPlaying ? (
                        video.youtubeId ? (
                          <iframe
                            className="w-full aspect-video rounded-xl shadow-sm"
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            ref={activeVideoRef}
                            key={`player-${video.id}`}
                            src={video.localVideoUrl || video.videoUrl || '/videos/shoulder-abduction.mp4'}
                            autoPlay
                            loop
                            muted={isMuted}
                            playsInline
                            controls
                            className="w-full h-full object-contain bg-black animate-fade-in"
                          />
                        )
                      ) : (
                        <div 
                          onClick={() => handleTogglePlay(video.id)}
                          className="relative w-full h-full cursor-pointer group/card select-none flex items-center justify-center overflow-hidden"
                          title={`Click to play ${video.title}`}
                        >
                          {video.thumbnail ? (
                            <img 
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                              <FileVideo size={36} className="text-slate-600" />
                            </div>
                          )}

                          {/* Hover Play Prompt */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/25 group-hover/card:via-black/15 flex flex-col items-center justify-center transition-all">
                            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover/card:scale-110 group-hover/card:bg-blue-500 transition-all border border-white/50">
                              <PlayCircle size={26} className="text-white fill-white/20 ml-0.5" />
                            </div>
                            <span className="mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 text-white border border-white/20 shadow">
                              Click to Play Video
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Top status pills inside video box */}
                      <div className="absolute top-2 left-2 flex items-center space-x-1.5 z-10 pointer-events-none">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold backdrop-blur-md text-white border border-white/10 flex items-center shadow-sm ${
                          isPlaying ? 'bg-sky-950/80 border-sky-500/40' : 'bg-black/80'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isPlaying ? 'bg-sky-400 animate-pulse' : 'bg-blue-400'}`}></span>
                          {isPlaying ? 'PLAYING LIVE' : 'PREVIEW'}
                        </span>
                      </div>

                      <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md text-white text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 z-10 pointer-events-none">
                        {video.duration || '1:45'}
                      </div>
                    </div>

                    {/* Sub-bar below video in each cell */}
                    <div className="px-3 py-1.5 bg-slate-900 flex items-center justify-between text-white text-xs shrink-0">
                      <div className="flex items-center space-x-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(video.id)}
                          className="text-white hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
                          title={isPlaying ? "Pause video" : "Play video"}
                        >
                          {isPlaying ? (
                            <>
                              <PauseCircle size={14} className="text-amber-400" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <PlayCircle size={14} className="text-blue-400" />
                              <span>Run Video</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isPlaying && (
                          <button
                            type="button"
                            onClick={() => setUserSelectedVideoId('')}
                            className="text-[10px] text-slate-300 hover:text-white flex items-center bg-slate-800 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            title="Return to thumbnail"
                          >
                            <RotateCcw size={10} className="mr-1" />
                            Thumbnail
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">{video.duration || '1:45'}</span>
                      </div>
                    </div>

                    {/* Clinical Details & Notes */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Clinical Guidance & Notes
                        </span>
                        <p className="text-[11px] text-slate-800 italic leading-relaxed line-clamp-2">
                          "{notes}"
                        </p>
                      </div>

                      {/* Card Footer: Date & Sync Badge */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center text-slate-500">
                          <Calendar size={11} className="mr-1 text-slate-400" />
                          {video.dateAssigned || 'Assigned Protocol'}
                        </span>
                        <span className="flex items-center gap-1 text-sky-700 font-bold text-[10px]">
                          <CheckCircle2 size={11} className="text-sky-600" />
                          <span>Active Protocol</span>
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* ============================================================== */}
        {/* COMPACT MODAL FOOTER                                           */}
        {/* ============================================================== */}
        <div className="px-4 py-2.5 bg-white border-t border-gray-200 flex items-center justify-between shrink-0 z-20">
          <p className="text-xs text-slate-500 truncate mr-2">
            Prescribed by <strong className="text-slate-800">{patient.assignedDoctor || 'Attending Physician'}</strong> • Virtual Physical Therapy Clinic
          </p>
          <div className="flex items-center space-x-2 shrink-0">
            {onOpenCarePlanStudio && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCarePlanStudio();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
              >
                <Sparkles size={12} />
                <span>Care Plan Studio</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
