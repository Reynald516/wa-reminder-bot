const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const cron = require('node-cron');
const fs = require('fs');

// 🔒 Simpan sesi login otomatis
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// 🔁 Simpan QR terbaru agar bisa ditampilkan di browser
let latestQR = null;

client.on('qr', (qr) => {
  latestQR = qr;
  console.log('📱 QR code tersedia di /qr');
});

// ✅ Tampilkan QR di browser lewat route /qr
app.get('/qr', async (req, res) => {
  if (!latestQR) return res.send('❌ QR belum tersedia atau sudah login.');
  const qrImage = await qrcode.toDataURL(latestQR);
  res.send(`
    <html>
      <body>
        <h2>📱 Scan QR WhatsApp</h2>
        <img src="${qrImage}" />
      </body>
    </html>
  `);
});

// 🌐 Jalanin server web
app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Server aktif! Akses QR di: /qr');
});

// 📅 Cegah spam & kirim pesan sesuai tanggal
let sudahDikirim = new Set();
let tanggalTerkirim = null;

// ✅ Saat bot sudah siap
client.on('ready', () => {
  console.log('✅ Bot siap digunakan!');

  // ⏰ Kirim pesan otomatis setiap tanggal 2 jam 19:07
  cron.schedule('7 19 2 * *', () => {
    const today = new Date();
    const tanggalHariIni = today.getDate();
    const jam = today.getHours();
    const menit = today.getMinutes();
    console.log(`⏰ Cek otomatis jam ${jam}:${menit}, tanggal ${tanggalHariIni}`);

    // Reset anti-spam kalau tanggal berubah
    if (tanggalTerkirim !== tanggalHariIni) {
      sudahDikirim = new Set();
      tanggalTerkirim = tanggalHariIni;
    }

    // Baca data klien
    fs.readFile('klien.json', 'utf8', (err, jsonString) => {
      if (err) {
        console.error('❌ Gagal baca file klien:', err);
        return;
      }

      const dataKlien = JSON.parse(jsonString);
      dataKlien.forEach((klien) => {
        if (klien.tanggal === tanggalHariIni && !sudahDikirim.has(klien.nomor)) {
          const nomorTujuan = `${klien.nomor}@c.us`;
          const pesan = `Halo ${klien.nama}, ini pengingat bahwa tagihan WiFi kamu jatuh tempo HARI INI (${tanggalHariIni}). Mohon segera dibayarkan ya 🙏`;

          client.sendMessage(nomorTujuan, pesan)
            .then(() => {
              console.log(`📤 Pesan terkirim ke ${klien.nama}`);
              sudahDikirim.add(klien.nomor);
            })
            .catch(err => console.error(`❌ Gagal kirim ke ${klien.nama}:`, err));
        }
      });
    });
  });
});

// 🚀 Mulai bot WhatsApp
client.initialize();
