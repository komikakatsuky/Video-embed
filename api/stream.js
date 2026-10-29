export default async function handler(req, res) {
  const { url } = req.query;

  // 1. Ambil informasi asal permintaan (domain yang memutar video)
  const origin = req.headers.origin || req.headers.referer || '';

  // 2. Daftar domain yang diizinkan menggunakan proxy ini (Domain Lock)
  const allowedDomains = [
    'zoeihua.blogspot.com',
    'zoeinime.blogspot.com',
    'localhost', // Untuk uji coba lokal
    '127.0.0.1'
  ];

  // 3. Validasi domain
  const isAllowed = allowedDomains.some(domain => origin.includes(domain));
  if (!isAllowed) {
    return res.status(403).json({ 
      error: 'Akses ditolak. Layanan proxy video ini dikunci khusus untuk situs resmi.' 
    });
  }

  if (!url) {
    return res.status(400).json({ error: 'Parameter URL video tidak disertakan.' });
  }

  try {
    // 4. Header penyamaran tingkat lanjut agar lolos deteksi bot Google
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      'Referer': 'https://www.blogger.com/',
      'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
    };

    // Teruskan header Range jika ada (untuk fitur video seeking)
    if (req.headers.range) {
      fetchHeaders['Range'] = req.headers.range;
    }

    // PENTING: Gunakan 'redirect: follow' karena link video Blogger/Google 
    // biasanya melempar beberapa kali pengalihan (redirect) ke server CDN googlevideo.com
    const response = await fetch(url, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).json({ 
        error: `Gagal mengambil video dari server asli (Status: ${response.status})` 
      });
    }

    res.status(response.status);

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');

    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 5. Alirkan (streaming) data ke browser
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();

  } catch (err) {
    console.error('Vercel Proxy Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Terjadi kesalahan internal pada server proxy.' });
    }
  }
}
