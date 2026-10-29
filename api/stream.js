export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Parameter URL diperlukan' });
  }

  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (e) {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  try {
    // Lakukan fetch ke video asli dengan header agar terbaca sebagai browser
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': decodedUrl
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Gagal mengambil video dari sumber asli' });
    }

    // Teruskan header Content-Type & Content-Length
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Izinkan CORS agar bisa diputar di domain web Anda
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // Streaming data video ke client
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    console.error('Proxy Error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server proxy' });
  }
}
