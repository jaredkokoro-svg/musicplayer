'use client';

import { useState, useRef } from 'react';
import { searchMusic, getAudioUrl } from './lib/music';
import { Search, Play, Pause, Volume2, Disc, Activity } from 'lucide-react';

export default function MusicPlayer() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado del Reproductor
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    const music = await searchMusic(query);
    setResults(music);
    setLoading(false);
  };

  const playSong = async (item: any) => {
    // 1. Ponemos la info visual inmediatamente (UI optimista)
    setCurrentTrack(item);
    setIsPlaying(false); // Pausa momentánea mientras carga
    
    // 2. Extraemos el ID del video
    const videoId = item.url.split('v=')[1];
    
    // 3. Pedimos el link de audio puro al servidor
    const trackData = await getAudioUrl(videoId);
    
    if (trackData && trackData.url) {
      setStreamUrl(trackData.url);
      // Pequeño timeout para asegurar que el audio tag recargó
      setTimeout(() => {
        audioRef.current?.play();
        setIsPlaying(true);
      }, 100);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-300 font-sans flex flex-col">
      
      {/* 1. HEADER / BUSCADOR (Estilo Minimalista) */}
      <div className="p-6 border-b border-white/5 bg-[#181818]">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-500 font-bold tracking-wider">
            <Activity size={24} />
            <span className="hidden md:inline">FOCUS FLOW</span>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar audio..."
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50 text-sm transition"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-600" size={16} />
          </form>
        </div>
      </div>

      {/* 2. LISTA DE RESULTADOS */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-2">
          {loading && <div className="text-center py-10 text-xs text-gray-600 animate-pulse">Sincronizando streams...</div>}
          
          {results.map((item) => (
            <div 
              key={item.url}
              onClick={() => playSong(item)}
              className={`
                flex items-center gap-4 p-3 rounded-md cursor-pointer transition group
                ${currentTrack?.url === item.url ? 'bg-white/10 border-l-2 border-emerald-500' : 'hover:bg-white/5 border-l-2 border-transparent'}
              `}
            >
              {/* Imagen pequeña (Thumbnail) */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded bg-gray-800 overflow-hidden relative flex-shrink-0">
                <img src={item.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                  <Play size={16} fill="white" className="text-white" />
                </div>
              </div>
              
              {/* Info Texto */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium truncate ${currentTrack?.url === item.url ? 'text-emerald-400' : 'text-gray-200'}`}>
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 truncate">{item.uploaderName} • {item.duration}</p>
              </div>

              {/* Animación si está sonando */}
              {currentTrack?.url === item.url && isPlaying && (
                <div className="flex gap-0.5 items-end h-4">
                  <span className="w-1 bg-emerald-500 animate-[bounce_1s_infinite] h-2"></span>
                  <span className="w-1 bg-emerald-500 animate-[bounce_1.2s_infinite] h-3"></span>
                  <span className="w-1 bg-emerald-500 animate-[bounce_0.8s_infinite] h-1.5"></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. REPRODUCTOR FIJO ABAJO (Estilo Spotify/Youtube Music) */}
      {currentTrack && (
        <div className="h-20 bg-[#181818] border-t border-white/5 px-4 md:px-8 flex items-center justify-between z-50 shadow-2xl">
          
          {/* Info Canción */}
          <div className="flex items-center gap-3 w-1/3">
            <div className={`w-12 h-12 rounded overflow-hidden ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
               {/* Usamos el icono de disco si no carga la imagen rápido */}
               <img src={currentTrack.thumbnail} className="w-full h-full object-cover" /> 
            </div>
            <div className="hidden md:block">
              <h4 className="text-sm text-white font-bold line-clamp-1">{currentTrack.title}</h4>
              <p className="text-xs text-gray-500 line-clamp-1">{currentTrack.uploaderName || currentTrack.uploader}</p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-6 justify-center w-1/3">
            <button 
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-110 transition shadow-lg shadow-emerald-500/20"
            >
              {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
            </button>
          </div>

          {/* Volumen / Extra */}
          <div className="flex items-center justify-end gap-2 w-1/3 text-gray-500">
             <Volume2 size={18} />
             <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
               <div className="w-3/4 h-full bg-gray-400"></div>
             </div>
          </div>

          {/* ELEMENTO INVISIBLE DE AUDIO HTML5 */}
          <audio 
            ref={audioRef} 
            src={streamUrl} 
            onEnded={() => setIsPlaying(false)}
            onError={(e) => console.log("Error de audio", e)}
          />
        </div>
      )}

    </div>
  );
}