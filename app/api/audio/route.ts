import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  try {
    // Pedimos los detalles de la canción por ID
    const res = await fetch(`https://saavn.dev/api/songs/${id}`);
    
    if (!res.ok) throw new Error('Error fetch song');

    const json = await res.json();
    
    // A veces la API devuelve un array o un objeto data
    const song = json.data ? json.data[0] : null;

    if (!song) throw new Error('Canción no encontrada');

    // Buscamos la calidad más alta de descarga (Download Url)
    // El array suele ser [12kbps, 48kbps, 96kbps, 160kbps, 320kbps]
    // Tomamos el último (mejor calidad)
    const downloadLinks = song.downloadUrl;
    const bestQuality = downloadLinks[downloadLinks.length - 1]?.url || downloadLinks[0]?.url;

    if (!bestQuality) throw new Error('No hay link de audio');

    return NextResponse.json({
      url: bestQuality,
      title: song.name,
      uploader: song.primaryArtists,
      thumbnail: song.image[2]?.url || song.image[0]?.url
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Fallo al obtener audio' }, { status: 500 });
  }
}