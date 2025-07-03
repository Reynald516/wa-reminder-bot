const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require('fs');

// Inisialisasi client WA pakai penyimpanan sesi otomatis
const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Tampilkan QR code hanya jika belum login
client.on('qr', (qr) => {
  console.log('📱 Scan QR ini pakai WhatsApp kamu:\n');
  qrcode.generate(qr, { small: true });
});

// Tambahan: anti spam & deteksi tanggal baru
let sudahDikirim = new Set();
let tanggalTerkirim = null;

// Saat WA ready
client.on('ready', () => {
  console.log('✅ Bot siap!');

  // Jadwal kirim pesan: jam 19:07 tanggal 2 setiap bulan
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

client.initialize();
