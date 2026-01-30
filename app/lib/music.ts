// app/lib/music.ts

/**
 * Función para buscar música.
 * Conecta con TU API interna (/api/search) para que el tráfico
 * parezca una petición normal a tu servidor de trabajo.
 */
export async function searchMusic(query: string) {
  try {
    // Usamos la ruta relativa "/api/search".
    // Esto asegura que la petición pase por Vercel y no salga directa a internet
    // evitando el firewall de la empresa.
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    
    if (!res.ok) {
      console.warn("Error en la respuesta del servidor");
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error conectando con el backend:", e);
    return [];
  }
}

/**
 * Función para obtener el link de audio.
 * Conecta con TU API interna (/api/audio).
 */
export async function getAudioUrl(id: string) {
  try {
    const res = await fetch(`/api/audio?id=${id}`);
    
    if (!res.ok) {
      console.warn("No se pudo resolver el audio");
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("Error obteniendo stream:", e);
    return null;
  }
}