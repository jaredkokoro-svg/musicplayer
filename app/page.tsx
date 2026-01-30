'use client';

import { useState, useRef } from 'react';
import { searchMusic, getAudioUrl } from './lib/music';
import { Play, Pause, Square, Activity, Terminal } from 'lucide-react';

export default function AudioDebugger() {
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<string[]>(['> System initialized.', '> Waiting for input...']);
  const [results, setResults] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const addLog = (msg: string) => setLogs(prev => [`> ${msg}`, ...prev.slice(0, 5)]);

  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (!query) return;
    addLog(`Fetching data for query: "${query}"...`);
    const music = await searchMusic(query);
    setResults(music);
    addLog(`Received ${music.length} data points.`);
  };

  const playTest = async (item: any) => {
    addLog(`Buffer requested for ID: ${item.url.split('v=')[1]}`);
    setCurrentTrack(item);
    setIsPlaying(false); 
    
    try {
      const videoId = item.url.split('v=')[1];
      const trackData = await getAudioUrl(videoId);
      
      if (trackData && trackData.url) {
        addLog(`Stream URL resolved. Starting playback test.`);
        if (audioRef.current) {
          audioRef.current.src = trackData.url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        addLog(`Error: Stream connection refused.`);
      }
    } catch (e) {
      addLog(`Critical Error: ${e}`);
    }
  };

  const toggleTest = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      addLog('Process paused.');
    } else {
      audioRef.current?.play();
      addLog('Process resumed.');
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-400 font-mono text-sm p-4 flex flex-col md:flex-row gap-4">
      
      {/* PANEL IZQUIERDO: CONTROLES */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="border border-gray-700 rounded p-4 bg-[#161b22]">
          <div className="flex items-center gap-2 mb-4 text-blue-400 font-bold border-b border-gray-700 pb-2">
            <Terminal size={16} />
            <span>DEV_AUDIO_TEST_SUITE</span>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search_Parameter..."
              className="w-full bg-[#0d1117] border border-gray-700 p-2 text-white focus:outline-none focus:border-blue-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 text-white rounded">EXEC</button>
          </form>

          {/* Consola de Logs (Para que parezca trabajo) */}
          <div className="bg-black p-2 rounded h-32 overflow-hidden text-xs text-green-500 font-mono">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        </div>

        {/* Reproductor "Técnico" */}
        {currentTrack && (
          <div className="border border-gray-700 rounded p-4 bg-[#161b22]">
             <div className="text-xs text-gray-500 mb-2">ACTIVE_STREAM_ID: {currentTrack.uploaderName}</div>
             <div className="text-white font-bold mb-4 truncate">{currentTrack.title}</div>
             
             <div className="flex items-center gap-4">
               <button onClick={toggleTest} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded">
                 {isPlaying ? <Pause size={16} /> : <Play size={16} />}
               </button>
               <div className="flex-1 h-1 bg-gray-700 rounded">
                 <div className={`h-full bg-blue-500 ${isPlaying ? 'animate-pulse' : ''}`} style={{width: '60%'}}></div>
               </div>
               <Activity size={16} className={isPlaying ? "text-green-500 animate-pulse" : "text-gray-600"} />
             </div>
             <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
          </div>
        )}
      </div>

      {/* PANEL DERECHO: DATOS (RESULTADOS) */}
      <div className="flex-1 border border-gray-700 rounded bg-[#161b22] overflow-hidden flex flex-col">
        <div className="p-2 bg-gray-800 text-xs font-bold text-gray-300 border-b border-gray-700">
          DATA_OUTPUT_TABLE
        </div>
        <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-700">
                <th className="p-2">STATUS</th>
                <th className="p-2">RESOURCE_NAME</th>
                <th className="p-2">ORIGIN</th>
                <th className="p-2">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition text-xs">
                  <td className="p-2 text-green-500">[200 OK]</td>
                  <td className="p-2 text-white">{item.title}</td>
                  <td className="p-2 text-gray-500">{item.uploaderName}</td>
                  <td className="p-2">
                    <button 
                      onClick={() => playTest(item)}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Load_Buffer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}