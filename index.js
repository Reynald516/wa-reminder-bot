const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require('fs');

// Inisialisasi client WA
const client = new Client();

// Tampilkan QR code
client.on('qr', (qr) => {
  console.log('📱 Scan QR ini pakai WhatsApp kamu:\n');
  qrcode.generate(qr, { small: true });
});

// Tambahan: untuk mencegah pengiriman berulang
let sudahDikirim = new Set();
let tanggalTerkirim = null;

// Saat WA ready
client.on('ready', () => {
  console.log('✅ Bot siap!');

  // Jadwalkan cek otomatis SETIAP MENIT (buat testing, nanti bisa ubah ke jam tertentu)
  cron.schedule('7 19 2 * *', () => {
    const today = new Date();
    const tanggalHariIni = today.getDate(); // contoh: 2
    const jam = today.getHours();
    const menit = today.getMinutes();
    console.log(`⏰ Cek otomatis jam ${jam}:${menit}, tanggal ${tanggalHariIni}`);

    // Reset pengiriman setiap tanggal baru
    if (tanggalTerkirim !== tanggalHariIni) {
      sudahDikirim = new Set();
      tanggalTerkirim = tanggalHariIni;
    }

    // Baca file klien
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
              sudahDikirim.add(klien.nomor); // tandai bahwa sudah dikirim
            })
            .catch(err => console.error(`❌ Gagal kirim ke ${klien.nama}:`, err));
        }
      });
    });
  });
});

client.initialize();
