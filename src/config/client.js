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

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('Bot Kak GEM sudah berjalan, PAHAM!...');
        botInstance.loadAssignments();
        botInstance.scheduleTaskReminders();
        botInstance.scheduleMotivationalQuotes();
    });

    client.on('disconnected', () => {
        console.log('Client disconnected. Attempting to reconnect...');
        client.initialize();
    });

    client.on('message', message => handleMessage(message, botInstance));

    client.initialize();
}

module.exports = { initializeClient };
