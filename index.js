const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('📱 Scan QR berikut:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp bot sudah siap!');

  cron.schedule('7 19 2 * *', () => {
    const now = new Date();
    const hari = now.getDate();

    fs.readFile('klien.json', 'utf8', (err, jsonString) => {
      if (err) {
        console.error('❌ Gagal baca file klien:', err);
        return;
      }

      const dataKlien = JSON.parse(jsonString);
      dataKlien.forEach((klien) => {
        if (klien.tanggal === hari) {
          const nomor = `${klien.nomor}@c.us`;
          const pesan = `Halo ${klien.nama}, ini pengingat tagihan WiFi kamu jatuh tempo HARI INI (${hari}). Mohon segera dibayarkan 🙏`;

          client.sendMessage(nomor, pesan)
            .then(() => console.log(`📤 Terkirim ke ${klien.nama}`))
            .catch(err => console.error(`❌ Gagal kirim ke ${klien.nama}`, err));
        }
      });
    });
  });
});

client.initialize();

app.get('/', (_, res) => {
  res.send('Bot WA Reminder Aktif 🚀');
});

app.listen(PORT, () => {
  console.log(`🌐 Server jalan di http://localhost:${PORT}`);
});
