import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idRaw = searchParams.get('id');

  if (!idRaw) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  // CASO ITUNES (Preview 30s)
  if (idRaw.startsWith('itunes:')) {
    // ... (Mismo código de antes para iTunes) ...
    const realId = idRaw.split(':')[1];
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${realId}`);
      const json = await res.json();
      const song = json.results?.[0];
      return NextResponse.json({
        url: song.previewUrl,
        title: song.trackName,
        uploader: song.artistName,
        thumbnail: song.artworkUrl100
      });
    } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
  }

  // CASO SOUNDCLOUD (Canción Completa)
  if (idRaw.startsWith('sc:')) {
    const trackId = idRaw.split(':')[1];
    
    try {
      // 1. Conseguir Client ID de nuevo (Vital para que no falle)
      const homeRes = await fetch('https://soundcloud.com', { headers: { 'User-Agent': 'Mozilla/5.0' }});
      const html = await homeRes.text();
      const scriptSrc = html.match(/<script crossorigin src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)">/)?.[1];
      let clientId = '7K3O2f5l36p98r34a85b9';
      if (scriptSrc) {
        const jsRes = await fetch(scriptSrc);
        const jsText = await jsRes.text();
        const match = jsText.match(/client_id:"([^"]+)"/);
        if (match) clientId = match[1];
      }

      // 2. Obtener Info del Track
      const trackRes = await fetch(`https://api-v2.soundcloud.com/tracks?ids=${trackId}&client_id=${clientId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const trackJson = await trackRes.json();
      const track = trackJson[0];

      if (!track) throw new Error('Track no encontrado');

      // 3. Buscar el stream MP3 (Progressive)
      // SoundCloud devuelve HLS y Progressive. Progressive es más fácil.
      const transcoding = track.media.transcodings.find((t: any) => t.format.protocol === 'progressive');
      
      if (transcoding) {
        const urlRes = await fetch(`${transcoding.url}?client_id=${clientId}`, {
           headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const urlJson = await urlRes.json();
        
        return NextResponse.json({
          url: urlJson.url, // ¡AQUÍ ESTÁ EL MP3!
          title: track.title,
          uploader: track.user.username,
          thumbnail: track.artwork_url ? track.artwork_url.replace('large', 't500x500') : ''
        });
      }

    } catch (e) {
      console.error(e);
    }
  }

  return NextResponse.json({ error: 'Audio no encontrado' }, { status: 500 });
}