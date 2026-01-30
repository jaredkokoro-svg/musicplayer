import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json([]);

  try {
    // Usamos la API de Saavn (mucho más rápida y sin bloqueos de IP)
    const res = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=20`);
    
    if (!res.ok) throw new Error('Error en Saavn API');

    const data = await res.json();
    
    // Si no hay resultados
    if (!data.data || !data.data.results) {
      return NextResponse.json([]);
    }

    // Mapeamos los datos para que tu reproductor los entienda
    const items = data.data.results.map((song: any) => ({
      type: 'stream',
      // Usamos el ID de Saavn
      url: `/watch?v=${song.id}`, 
      title: song.name, // El nombre de la canción se llama "name" aquí
      // Buscamos la imagen de mejor calidad (la última del array)
      thumbnail: song.image[2]?.url || song.image[1]?.url || song.image[0]?.url,
      uploaderName: song.primaryArtists, // El artista
      duration: convertTime(song.duration), // Convertimos segundos a texto
      views: song.playCount || '0'
    }));

    return NextResponse.json(items);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Fallo al buscar en Saavn' }, { status: 500 });
  }
}

// Función auxiliar para convertir segundos (ej: 180) a "3:00"
function convertTime(seconds: number) {
  if (!seconds) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}