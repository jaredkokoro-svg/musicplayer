// app/lib/music.ts

export async function searchMusic(query: string) {
  try {
    // Llamamos a NUESTRO puente (Next.js API Route)
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error buscando:", e);
    return [];
  }
}

export async function getAudioUrl(id: string) {
  try {
    // Llamamos a NUESTRO puente de audio
    const res = await fetch(`/api/audio?id=${id}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Error obteniendo audio:", e);
    return null;
  }
}