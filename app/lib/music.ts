// app/lib/music.ts

// LISTA DE ORO: Instancias que suelen PERMITIR CORS (Conexión directa desde navegador)
// Si una falla o está bloqueada por tu empresa, el código saltará a la siguiente.
const CORS_INSTANCES = [
  'https://invidious.drgns.space',
  'https://inv.tux.pizza',
  'https://invidious.fdn.fr',      // Francia (Muy robusto)
  'https://vid.puffyan.us',
  'https://invidious.perennialte.ch',
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de'
];

export async function searchMusic(query: string) {
  // Probamos servidor por servidor hasta que uno responda
  for (const domain of CORS_INSTANCES) {
    try {
      // Invidious API v1 Search
      const res = await fetch(`${domain}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
        method: 'GET',
        // No ponemos headers complejos para evitar bloqueos de CORS
      });

      if (!res.ok) continue;

      const data = await res.json();
      
      // Mapeamos los resultados
      return data.map((item: any) => ({
        type: 'stream',
        url: `/watch?v=${item.videoId}`,
        title: item.title,
        thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
        uploaderName: item.author,
        duration: formatDuration(item.lengthSeconds),
        views: item.viewCount
      }));

    } catch (e) {
      console.warn(`Falló ${domain}, probando siguiente...`);
      continue;
    }
  }
  return [];
}

export async function getAudioUrl(id: string) {
  for (const domain of CORS_INSTANCES) {
    try {
      const res = await fetch(`${domain}/api/v1/videos/${id}`, { method: 'GET' });
      
      if (!res.ok) continue;

      const data = await res.json();
      
      // Buscamos el mejor audio (m4a es mejor para web)
      // adaptiveFormats suele tener el audio separado
      const adaptive = data.adaptiveFormats || [];
      const audioOnly = adaptive.find((s: any) => s.type.includes('audio/mp4')) 
                     || adaptive.find((s: any) => s.type.includes('audio'));
      
      let finalUrl = audioOnly?.url;

      // Si no hay audio separado, buscamos en los streams combinados (video+audio)
      if (!finalUrl && data.formatStreams) {
         finalUrl = data.formatStreams[data.formatStreams.length - 1].url;
      }

      if (finalUrl) {
        return {
          url: finalUrl,
          title: data.title,
          uploader: data.author,
          thumbnail: data.videoThumbnails?.[0]?.url
        };
      }

    } catch (e) {
      console.warn(`Falló audio en ${domain}`);
      continue;
    }
  }
  return null;
}

// Ayuda para formato de tiempo
function formatDuration(seconds: number) {
  if (!seconds) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}