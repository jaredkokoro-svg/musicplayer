import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  try {
    // Pedimos a saavn.me
    const res = await fetch(`https://saavn.me/songs?id=${id}`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Wget/1.21.2',
        'Accept': '*/*'
      }
    });

    if (!res.ok) throw new Error('Fetch failed');

    const json = await res.json();
    const song = json.data?.[0] || json.data;

    if (!song) throw new Error('No song data');

    // Extraer link de descarga
    let downloadUrl = '';
    const links = song.downloadUrl || song.download_links;
    
    if (Array.isArray(links)) {
      // Preferimos calidad media (160kbps) para que cargue rápido y no pese mucho
      const medium = links.find((l: any) => l.quality === '160kbps' || l.bitrate === 160) || links[links.length-1];
      downloadUrl = medium.url || medium.link || medium;
    } else {
      downloadUrl = links;
    }

    return NextResponse.json({
      url: downloadUrl,
      title: song.name,
      uploader: song.primaryArtists
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}