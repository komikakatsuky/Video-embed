// Contoh sederhana Vercel Serverless Function (Node.js)
export default async function handler(req, res) {
  // Izinkan CORS agar bisa diakses dari domain Blogger Anda
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL video tidak ditemukan' });
  }

  try {
    // Di sini Anda bisa menambahkan logika backend untuk:
    // 1. Mengubah URL YouTube/Blogger menjadi link stream langsung (menggunakan pustaka eksternal atau API pihak ketiga).
    // 2. Atau melakukan fetch dengan header spoofing (User-Agent) jika itu adalah direct link dari Blogger.

    // Contoh jika ingin meneruskan/memproksi data langsung dari token Blogger:
    const targetUrl = decodeURIComponent(url);
    
    // Contoh response balik berupa link direct atau data stream
    return res.status(200).json({
      success: true,
      directUrl: targetUrl // Atau hasil ekstrak link mp4 asli
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
