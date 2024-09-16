const qrcode = require('qrcode-terminal');
const CFonts = require('cfonts');
const { handleMessage } = require('../commands/handlers');
const {
    saveAssignments,
    loadAssignments,
    scheduleTaskReminders,
    scheduleMotivationalQuotes
} = require('../reminders/reminders');

function initializeClient(client, botInstance) {
    // Tampilkan teks 3D saat program dimulai
    CFonts.say('Kak GEM BrOT', {
        font: 'block',        // font yang digunakan
        align: 'center',      // perataan teks
        colors: ['cyan'],     // warna teks
        background: 'black',  // warna latar belakang
        letterSpacing: 1,     // jarak antar huruf
        lineHeight: 1,        // jarak antar baris
        space: true,          // tambahkan spasi di sekitar teks
        maxLength: '0',       // wrap ke baris berikutnya jika terlalu panjang
        gradient: ['blue', 'yellow'], // efek gradasi
        independentGradient: true,   // gradien independen per baris
        transitionGradient: true,    // transisi gradien
        env: 'node'           // tentukan lingkungan (node atau browser)
    });

    // Menampilkan QR Code untuk login
    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
        console.log('QR Code ditampilkan, silakan scan dengan aplikasi WhatsApp.');
    });

    // Saat client siap
    client.on('ready', () => {
        console.log('Bot Kak GEM sudah berjalan, PAHAM!...');
        botInstance.loadAssignments();
        botInstance.scheduleTaskReminders();
        botInstance.scheduleMotivationalQuotes();
    });

    // Saat client terputus
    client.on('disconnected', (reason) => {
        console.log(`Client disconnected. Reason: ${reason}`);
        console.log('Attempting to reconnect...');
        client.initialize();
    });

    // Mendeteksi pesan masuk tanpa ID grup
    client.on('message', async (message) => {
        try {
            const chat = await message.getChat();
            
            // Cek apakah pesan berasal dari grup, tanpa menampilkan ID grup
            if (chat.isGroup) {
                console.log('Pesan diterima dari grup:', chat.name);  // Menampilkan nama grup di console
            } else {
                console.log('Pesan diterima dari kontak pribadi.');
            }
        } catch (error) {
            console.error('Error saat mencoba mendapatkan informasi chat:', error);
        }

        // Panggil handler pesan
        handleMessage(message, botInstance);
    });

    client.initialize(); // Inisialisasi client
}

module.exports = { initializeClient };
