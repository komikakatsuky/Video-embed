// api/proxy.js (Backend Vercel - Node.js)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  try {
    const targetUrl = decodeURIComponent(url);

    // Melakukan fetch ke video target dari server Vercel dengan menyamar sebagai browser desktop
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.blogger.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil sumber video: ${response.statusText}`);
    }

    // Teruskan tipe konten (misal: video/mp4 atau text/html) ke client
    const contentType = response.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', contentType);

    // Ambil data buffer/stream dari video dan kirimkan ke frontend
    const buffer = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
