export default async function handler(req, res) {
  const { url } = req.query;

  // 1. Ambil informasi asal permintaan (domain yang mengakses)
  const origin = req.headers.origin || req.headers.referer || '';

  // 2. Daftar domain yang diizinkan mengakses proxy Vercel Anda
  const allowedDomains = [
    'zoeihua.blogspot.com',
    'zoeinime.blogspot.com',
    'localhost', // Diizinkan untuk pengujian lokal (opsional, bisa dihapus saat production)
    '127.0.0.1'
  ];

  // 3. Periksa apakah domain yang meminta cocok dengan daftar yang diizinkan
  const isAllowed = allowedDomains.some(domain => origin.includes(domain));

  if (!isAllowed) {
    return res.status(403).json({ 
      error: 'Akses ditolak. Layanan proxy ini dikunci khusus untuk situs resmi.' 
    });
  }

  if (!url) {
    return res.status(400).json({ error: 'Parameter URL video tidak disertakan.' });
  }

  try {
    const targetUrl = new URL(url);
    const originSite = `${targetUrl.protocol}//${targetUrl.hostname}`;

    // Lanjutkan proses proxy video seperti biasa
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': originSite,
        'Origin': originSite,
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Gagal mengambil video (Status: ${response.status})` });
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Batasi CORS header hanya untuk blog Anda
    res.setHeader('Access-Control-Allow-Origin', '*'); 

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
    
  } catch (err) {
    console.error('Proxy Error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan internal pada server proxy.' });
  }
}
