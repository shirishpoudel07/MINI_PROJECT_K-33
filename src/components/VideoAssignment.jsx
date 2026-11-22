import React, { useState, useRef, useMemo } from 'react';
import { 
  PlayCircle, 
  PauseCircle, 
  Plus, 
  CheckCircle2, 
  FileVideo, 
  Edit3, 
  Maximize2, 
  Minimize2,
  X, 
  Volume2, 
  VolumeX, 
  Dumbbell, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  Check, 
  Layers,
  Bell
} from 'lucide-react';
import { availableVideos } from '../data/mockData';
import { sounds } from '../utils/soundEffects';

export default function VideoAssignment({ 
  patient, 
  onAssignVideo, 
  _onToggleCollapse = null,
  isExpanded = true,
  onToggleExpand = null,
  onUpdatePatient = null,
  onSwitchToChat = null
}) {
  const [selectedActiveId, setSelectedActiveId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeSubView, setActiveSubView] = useState('routine'); // 'routine' | 'catalog' | 'custom'
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [catalogSearch, setCatalogSearch] = useState('');
  
  // Modal & Toast States
  const [isMaximized, setIsMaximized] = useState(false);
  const [modalVideo, setModalVideo] = useState(null);
  const [isModalPlaying, setIsModalPlaying] = useState(false);
  const [prescribingVideo, setPrescribingVideo] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [customSets, setCustomSets] = useState(3);
  const [customReps, setCustomReps] = useState(10);
  const [customNotes, setCustomNotes] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [actionToast, setActionToast] = useState('');
  
  const videoRef = useRef(null);
  const modalVideoRef = useRef(null);

  const activeVideos = patient?.activeVideos || [];

  // Determine current active video index and object
  const activeVideoId = (selectedActiveId && activeVideos.some(v => v.id === selectedActiveId))
    ? selectedActiveId
    : activeVideos[0]?.id || availableVideos[0].id;

  const currentIndex = activeVideos.findIndex(v => v.id === activeVideoId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentVideo = activeVideos[safeIndex] || availableVideos[0];
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < activeVideos.length - 1;

  // Notification toast helper
  const showToast = (msg) => {
    setActionToast(msg);
    try { sounds.playSend(); } catch {}
    setTimeout(() => setActionToast(''), 3500);
  };

  // Stepping through exercises in exact order
  const handleSelectStep = (videoId) => {
    setSelectedActiveId(videoId);
    setIsPlaying(true);
    try { sounds.playSend(); } catch {}
  };

  // Reorder exercises: Move earlier or later in routine sequence
  const handleMoveStep = (idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= activeVideos.length) return;
    
    const newVideos = [...activeVideos];
    const temp = newVideos[idx];
    newVideos[idx] = newVideos[targetIdx];
    newVideos[targetIdx] = temp;
    
    if (onUpdatePatient) {
      onUpdatePatient({ ...patient, activeVideos: newVideos });
    }
    showToast(`Reordered: "${temp.title}" moved to Step ${targetIdx + 1}`);
  };

  // Remove exercise from patient routine
  const handleRemoveStep = (videoId, title) => {
    if (!window.confirm(`Remove "${title}" from ${patient.name}'s recovery routine?`)) return;
    const newVideos = activeVideos.filter(v => v.id !== videoId);
    if (onUpdatePatient) {
      onUpdatePatient({ ...patient, activeVideos: newVideos });
    }
    if (activeVideoId === videoId && newVideos.length > 0) {
      setSelectedActiveId(newVideos[0].id);
    }
    showToast(`Removed "${title}" from routine.`);
  };

  // Open dosage editor for existing routine
  const handleStartEdit = (video) => {
    setEditingVideo(video);
    setCustomTitle(video.title);
    setCustomSets(video.sets || 3);
    setCustomReps(video.reps || 10);
    setCustomNotes(video.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingVideo) return;
    const newVideos = activeVideos.map(v => {
      if (v.id === editingVideo.id) {
        return {
          ...v,
          title: customTitle.trim() || v.title,
          sets: Number(customSets) || 3,
          reps: Number(customReps) || 10,
          notes: customNotes.trim() || v.notes
        };
      }
      return v;
    });
    if (onUpdatePatient) {
      onUpdatePatient({ ...patient, activeVideos: newVideos });
    }
    setEditingVideo(null);
    showToast(`Updated dosage for "${customTitle || editingVideo.title}"!`);
  };

  // Open prescription modal from video catalog
  const handleStartPrescribe = (video) => {
    setPrescribingVideo(video);
    setCustomTitle(video.title);
    setCustomSets(3);
    setCustomReps(10);
    setCustomNotes('Perform controlled repetitions with steady breathing and 3s hold at peak flexion.');
  };

  const handleConfirmPrescribe = () => {
    if (!prescribingVideo) return;
    const assignedObj = {
      ...prescribingVideo,
      title: customTitle.trim() || prescribingVideo.title,
      sets: Number(customSets) || 3,
      reps: Number(customReps) || 10,
      notes: customNotes.trim() || 'Perform steady repetitions in pain-free range.'
    };
    onAssignVideo(patient.id, assignedObj);
    setSelectedActiveId(prescribingVideo.id);
    setPrescribingVideo(null);
    setActiveSubView('routine');
    showToast(`🔔 Plan updated! Notification with "${assignedObj.title}" thumbnail sent to ${patient.name}`);
  };

  // Explicitly dispatch care plan notification with first video thumbnail to patient
  const handleNotifyPatientPlan = () => {
    const firstVideo = activeVideos[0] || availableVideos[0];
    if (!firstVideo || !patient?.id) return;
    onAssignVideo(patient.id, {
      ...firstVideo,
      title: firstVideo.title,
      sets: firstVideo.sets || 3,
      reps: firstVideo.reps || 10,
      notes: firstVideo.notes || 'Perform controlled repetitions within comfort range.'
    });
    showToast(`🔔 Sent care plan notification with "${firstVideo.title}" thumbnail to ${patient.name}!`);
  };

  // Video catalog categories dynamically derived from catalog
  const categories = useMemo(() => {
    const cats = new Set(['All']);
    availableVideos.forEach(v => {
      if (v.category) cats.add(v.category);
    });
    return Array.from(cats);
  }, []);

  const filteredCatalogVideos = useMemo(() => {
    return availableVideos.filter(v => {
      const matchCat = catalogCategory === 'All' || v.category === catalogCategory;
      const matchSearch = !catalogSearch.trim() || 
        v.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        v.category.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [catalogCategory, catalogSearch]);

  const toggleSpeed = () => {
    const next = playbackSpeed === 1 ? 0.75 : playbackSpeed === 0.75 ? 0.5 : 1;
    setPlaybackSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in relative bg-slate-50/50">
      
      {/* Toast Notification */}
      {actionToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-slide-down">
          <CheckCircle2 size={15} className="text-sky-400" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. CLEAN TOP CARE PLAN STUDIO HEADER                           */}
      {/* ============================================================== */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 shrink-0 shadow-2xs z-10">
        <div className="flex items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
              <Layers size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                  Care Plan Studio
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  {activeVideos.length} Prescribed Routines
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Physical therapy protocol for <strong className="text-slate-700">{patient?.name || 'Patient'}</strong>
              </p>
            </div>
          </div>

          {/* Right quick actions: Notify Patient / Chat / Maximize */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={handleNotifyPatientPlan}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="Send plan notification with first video thumbnail to patient"
            >
              <Bell size={13} className="text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">Notify Patient</span>
            </button>

            {onSwitchToChat && (
              <button
                type="button"
                onClick={onSwitchToChat}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title={`Chat with ${patient.name}`}
              >
                <MessageSquare size={12} />
                <span>Chat</span>
              </button>
            )}

            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="hidden sm:flex w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 items-center justify-center text-slate-600 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
                title={isExpanded ? "Restore Side-by-Side (Chat + Plan Aside)" : "Maximize Exercise Plan Studio"}
              >
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN SCROLLABLE STUDIO AREA                                 */}
      {/* ============================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 lg:p-4 space-y-4 scrollbar-thin overscroll-contain">
        
        {/* ============================================================ */}
        {/* HERO CLINICAL THEATER & DOSAGE CENTER (ADAPTIVE CARD ROW)    */}
        {/* ============================================================ */}
        <div className={`grid grid-cols-1 ${isExpanded ? 'xl:grid-cols-12' : 'grid-cols-1'} gap-5`}>
          
          {/* Hero Video Player (Spacious Theater) */}
          <div className={`${isExpanded ? 'xl:col-span-7' : 'w-full'} bg-slate-950 rounded-2xl overflow-hidden shadow-md border border-slate-800 flex flex-col`}>
            
            {/* Top Video Header */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white text-xs">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider shrink-0">
                  Step {safeIndex + 1} of {activeVideos.length}
                </span>
                <span className="font-extrabold text-sm truncate text-white">
                  {currentVideo?.title}
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isPlaying ? 'bg-sky-950 text-sky-300 border border-sky-500/30' : 'bg-slate-800 text-slate-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isPlaying ? 'bg-sky-400 animate-pulse' : 'bg-blue-400'}`}></span>
                  {isPlaying ? 'PLAYING' : 'READY'}
                </span>
              </div>
            </div>

            {/* Video Canvas */}
            <div className="relative aspect-video max-h-[360px] w-full bg-black flex items-center justify-center overflow-hidden group select-none">
              {isPlaying ? (
                currentVideo?.youtubeId ? (
                  <iframe
                    className="w-full aspect-video rounded-xl shadow-sm"
                    src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                    title={currentVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    key={currentVideo?.videoUrl || currentVideo?.id}
                    src={currentVideo?.videoUrl || '/videos/heel-slides.mp4'}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    controls
                    className="w-full h-full object-cover animate-fade-in"
                  />
                )
              ) : (
                <div 
                  onClick={() => setIsPlaying(true)}
                  className="relative w-full h-full cursor-pointer overflow-hidden group/hero flex items-center justify-center"
                >
                  {currentVideo?.thumbnail ? (
                    <img
                      src={currentVideo.thumbnail}
                      alt={currentVideo.title}
                      className="w-full h-full object-cover group-hover/hero:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <FileVideo size={48} className="text-slate-600" />
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30 group-hover/hero:via-black/15 transition-all flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl group-hover/hero:scale-110 group-hover/hero:bg-blue-500 transition-all border-2 border-white/60">
                      <PlayCircle size={32} className="text-white fill-white/20 ml-0.5" />
                    </div>
                    <span className="mt-2 text-xs font-bold text-white tracking-wide uppercase bg-black/80 px-3 py-1 rounded-full border border-white/20 shadow-md">
                      Play Clinical Video
                    </span>
                  </div>
                </div>
              )}

              {/* Top overlay pills */}
              <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 pointer-events-none z-10">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 backdrop-blur-md text-white border border-white/10 shadow">
                  {currentVideo?.duration || '2:00'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600/90 text-white shadow truncate max-w-[180px]">
                  {currentVideo?.category || 'Clinical Protocol'}
                </span>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="px-3.5 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  {isPlaying ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                <button
                  type="button"
                  onClick={toggleSpeed}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono font-bold transition-colors cursor-pointer"
                  title="Slow motion review (0.75x / 0.5x / 1.0x)"
                >
                  {playbackSpeed}x Speed
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMaximized(true);
                    setIsModalPlaying(false);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Open 2×2 Multi-Video Review"
                >
                  <Maximize2 size={13} />
                  <span>2×2 View</span>
                </button>
              </div>
            </div>

          </div>

          {/* Clinical Dosage & Guidance Panel */}
          <div className={`${isExpanded ? 'xl:col-span-5' : 'w-full'} bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xs">
                    {safeIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                      Prescription & Guidance
                    </h3>
                    <p className="text-[11px] text-slate-500">Therapeutic dosage for {patient.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartEdit(currentVideo)}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={12} />
                  <span>Edit Dosage</span>
                </button>
              </div>

              {/* Title & Target */}
              <div className="mb-3">
                <h4 className="text-sm font-bold text-gray-900">{currentVideo?.title}</h4>
                <p className="text-xs text-blue-700 font-semibold mt-0.5">{patient.condition}</p>
              </div>

              {/* Dosage Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3.5">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Prescribed Sets</span>
                  <span className="text-lg font-black text-slate-900">{currentVideo?.sets || 3}</span>
                  <span className="text-[10px] text-slate-500 font-medium ml-1">Sets / Day</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Prescribed Reps</span>
                  <span className="text-lg font-black text-slate-900">{currentVideo?.reps || 10}</span>
                  <span className="text-[10px] text-slate-500 font-medium ml-1">Reps / Set</span>
                </div>
              </div>

              {/* Clinical Instructions */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 mb-3">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wide block mb-1">
                  Physician Form Instructions
                </span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                  "{currentVideo?.notes || 'Perform controlled repetitions within comfort range. Maintain steady breathing.'}"
                </p>
              </div>
            </div>

            {/* Sequence Order Adjuster buttons */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-semibold text-[11px]">Reorder Routine Sequence:</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleMoveStep(safeIndex, 'up')}
                  disabled={!hasPrev}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                    hasPrev ? 'bg-white hover:bg-slate-100 text-slate-700 border-gray-200 cursor-pointer shadow-2xs' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  }`}
                  title="Move earlier in routine"
                >
                  <ArrowUp size={12} />
                  <span>Earlier</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveStep(safeIndex, 'down')}
                  disabled={!hasNext}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                    hasNext ? 'bg-white hover:bg-slate-100 text-slate-700 border-gray-200 cursor-pointer shadow-2xs' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  }`}
                  title="Move later in routine"
                >
                  <ArrowDown size={12} />
                  <span>Later</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ============================================================ */}
        {/* LOWER SECTION: TABS FOR ORDERED PLAYLIST & VIDEO CATALOG     */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Sub Navigation Bar */}
          <div className="px-4 py-2.5 border-b border-gray-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setActiveSubView('routine')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubView === 'routine'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Layers size={13} />
                <span>Prescribed Routine ({activeVideos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubView('catalog')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubView === 'catalog'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Sparkles size={13} />
                <span>Clinical Video Library ({availableVideos.length})</span>
              </button>
            </div>

            {/* Quick Prescribe button */}
            {activeSubView !== 'catalog' && (
              <button
                type="button"
                onClick={() => setActiveSubView('catalog')}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Plus size={13} />
                <span>+ Prescribe from Library</span>
              </button>
            )}
          </div>

          {/* VIEW 1: PRESCRIBED ROUTINE (IN ORDER) */}
          {activeSubView === 'routine' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
                  Sequential Exercise Order (Step 1 to {activeVideos.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Use ▲ / ▼ to reorder • Click card to play in theater
                </span>
              </div>

              {activeVideos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm font-semibold">No exercises prescribed yet.</p>
                  <button
                    type="button"
                    onClick={() => setActiveSubView('catalog')}
                    className="text-xs font-bold text-blue-600 hover:underline mt-2 inline-block cursor-pointer"
                  >
                    + Open video library to prescribe
                  </button>
                </div>
              ) : (
                <div className={`grid grid-cols-1 ${isExpanded ? 'md:grid-cols-2' : 'grid-cols-1'} gap-3.5`}>
                  {activeVideos.map((video, idx) => {
                    const isSelected = video.id === activeVideoId;
                    return (
                      <div
                        key={`routine-card-${video.id}-${idx}`}
                        className={`p-3 rounded-xl border transition-all flex items-start gap-3 bg-white shadow-2xs ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-gray-200 hover:border-blue-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Step Pill & Thumbnail */}
                        <div 
                          onClick={() => handleSelectStep(video.id)}
                          className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-900 cursor-pointer group shadow-inner"
                        >
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-1 left-1 bg-black/80 text-white w-4 h-4 rounded text-[9px] font-black flex items-center justify-center z-10 shadow">
                            {idx + 1}
                          </div>
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <PlayCircle size={22} className="text-white drop-shadow" />
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.2 rounded font-mono font-semibold">
                            {video.duration || '2:00'}
                          </div>
                        </div>

                        {/* Exercise Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                                Step {idx + 1}
                              </span>
                              <h4 
                                onClick={() => handleSelectStep(video.id)}
                                className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors truncate cursor-pointer"
                              >
                                {video.title}
                              </h4>
                            </div>

                            {/* Reorder Buttons */}
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveStep(idx, 'up')}
                                disabled={idx === 0}
                                className={`w-5 h-5 rounded flex items-center justify-center border ${
                                  idx === 0 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 hover:text-blue-600 border-gray-200 hover:bg-slate-100 cursor-pointer'
                                }`}
                                title="Move Earlier"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveStep(idx, 'down')}
                                disabled={idx === activeVideos.length - 1}
                                className={`w-5 h-5 rounded flex items-center justify-center border ${
                                  idx === activeVideos.length - 1 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 hover:text-blue-600 border-gray-200 hover:bg-slate-100 cursor-pointer'
                                }`}
                                title="Move Later"
                              >
                                <ArrowDown size={11} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                              {video.sets || 3} Sets × {video.reps || 10} Reps
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                            "{video.notes || 'Steady controlled movement.'}"
                          </p>

                          <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-gray-100 text-xs">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(video)}
                              className="text-[11px] font-bold text-slate-600 hover:text-blue-600 cursor-pointer"
                            >
                              Edit Dosage
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveStep(video.id, video.title)}
                              className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={11} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: CLINICAL VIDEO LIBRARY (ORGANIZED BY CATEGORY) */}
          {activeSubView === 'catalog' && (
            <div className="p-4 space-y-3.5">
              
              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatalogCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                        catalogCategory === cat
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[200px]">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search exercise catalog..."
                    className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                  />
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Grid of Catalog Videos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCatalogVideos.map((video) => {
                  const isAlreadyPrescribed = activeVideos.some(v => v.id === video.id || v.title === video.title);
                  return (
                    <div
                      key={`cat-${video.id}`}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Video Thumbnail */}
                        <div className="relative w-full aspect-video bg-slate-900 overflow-hidden group">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                            {video.duration}
                          </div>
                          <span className="absolute top-1.5 left-1.5 bg-blue-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                            {video.category}
                          </span>
                        </div>

                        {/* Title & Details */}
                        <div className="p-3">
                          <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{video.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Clinical Therapy Protocol</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="px-3 pb-3 pt-1 flex items-center justify-between border-t border-gray-100 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedActiveId(video.id);
                            setIsPlaying(true);
                            showToast(`Loaded "${video.title}" into Hero Theater!`);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <PlayCircle size={12} />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartPrescribe(video)}
                          className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            isAlreadyPrescribed
                              ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          }`}
                        >
                          <Plus size={12} />
                          <span>{isAlreadyPrescribed ? '+ Add Another' : 'Prescribe'}</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. PRESCRIBE / EDIT DOSAGE MODAL DIALOG                        */}
      {/* ============================================================== */}
      {(prescribingVideo || editingVideo) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPrescribingVideo(null);
              setEditingVideo(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-slide-up">
            
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <Dumbbell size={16} className="text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editingVideo ? 'Edit Routine Dosage' : 'Prescribe Exercise to Routine'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPrescribingVideo(null);
                  setEditingVideo(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Exercise Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Prescribed Sets</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={customSets}
                    onChange={(e) => setCustomSets(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Prescribed Reps</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customReps}
                    onChange={(e) => setCustomReps(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Physician Form Guidance</label>
                <textarea
                  rows="3"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Clinical instructions for form, tempo, and breathing..."
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setPrescribingVideo(null);
                    setEditingVideo(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={editingVideo ? handleSaveEdit : handleConfirmPrescribe}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{editingVideo ? 'Save Dosage' : 'Add to Patient Routine'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MAXIMIZED REVIEW MODAL (2×2 GRID OF ACTIVE EXERCISES)        */}
      {/* ============================================================== */}
      {isMaximized && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMaximized(false);
              setModalVideo(null);
              setIsModalPlaying(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[86vh] max-h-[86vh] flex flex-col overflow-hidden border border-gray-200 animate-slide-up relative">
            <div className="px-4 py-2.5 sm:px-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 z-10 shadow-2xs">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900">Therapy Review & Video Player</h2>
                <p className="text-[11px] text-gray-500">Comprehensive plan for <strong className="text-gray-800">{patient.name}</strong> • 2×2 Prescribed Routines</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsMaximized(false);
                  setModalVideo(null);
                  setIsModalPlaying(false);
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-lg font-extrabold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer group"
              >
                <X size={15} strokeWidth={2.6} className="group-hover:rotate-90 transition-transform duration-200" />
                <span>Close</span>
              </button>
            </div>
            
            <div className="p-3 sm:p-4 overflow-y-auto bg-slate-50/70 flex-1 min-h-0 space-y-3.5 scrollbar-thin overscroll-contain">
              <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
                <div className="relative aspect-video max-h-44 sm:max-h-48 w-full bg-black flex items-center justify-center">
                  {isModalPlaying ? (
                    (modalVideo?.youtubeId || currentVideo?.youtubeId) ? (
                      <iframe
                        className="w-full aspect-video rounded-xl shadow-sm"
                        src={`https://www.youtube.com/embed/${modalVideo?.youtubeId || currentVideo?.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                        title={modalVideo?.title || currentVideo?.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        ref={modalVideoRef}
                        key={modalVideo?.videoUrl || currentVideo?.videoUrl}
                        src={modalVideo?.videoUrl || currentVideo?.videoUrl || '/videos/heel-slides.mp4'}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        controls
                        className="w-full h-full object-contain bg-black"
                      />
                    )
                  ) : (
                    <div 
                      onClick={() => setIsModalPlaying(true)}
                      className="relative w-full h-full cursor-pointer group/modal select-none flex items-center justify-center overflow-hidden"
                    >
                      <img 
                        src={(modalVideo || currentVideo)?.thumbnail}
                        alt={(modalVideo || currentVideo)?.title}
                        className="w-full h-full object-cover group-hover/modal:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/35 flex flex-col items-center justify-center transition-all">
                        <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl group-hover/modal:scale-110 group-hover/modal:bg-blue-500 transition-all border border-white/50">
                          <PlayCircle size={26} className="text-white fill-white/20 ml-0.5" />
                        </div>
                        <span className="mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 text-white border border-white/20 shadow">
                          Click to Play Exercise Video
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2x2 Grid of videos */}
              <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
                  <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                    Patient Routines ({activeVideos.length} Videos)
                  </h3>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Click to Play
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {activeVideos.map((video, idx) => {
                    const isSelected = (modalVideo?.id || currentVideo?.id) === video.id;
                    return (
                      <div 
                        key={`max-${video.id}-${idx}`} 
                        onClick={() => {
                          setModalVideo(video);
                          setSelectedActiveId(video.id);
                          setIsModalPlaying(true);
                        }}
                        className={`p-2.5 rounded-xl border transition-all group cursor-pointer flex items-center gap-2.5 shadow-2xs ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 hover:shadow-xs bg-white'
                        }`}
                      >
                        <div className="relative w-24 h-18 rounded-lg bg-gray-900 overflow-hidden shrink-0 border border-gray-200 shadow-2xs">
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute top-1 left-1 bg-black/80 text-white w-4 h-4 rounded text-[9px] font-black flex items-center justify-center shadow-xs z-10">
                            #{idx + 1}
                          </div>
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <PlayCircle size={20} className="text-white drop-shadow-md" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{video.title}</h4>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mt-1">
                            {video.sets || 3} Sets × {video.reps || 10} Reps
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
