const { Client, LocalAuth } = require('whatsapp-web.js');
const { initializeClient } = require('./src/config/client');
const { saveAssignments, loadAssignments, scheduleTaskReminders, scheduleMotivationalQuotes, startAssignmentDeadlineCheck } = require('./src/reminders/reminders');
const { getWeather, handleMessage } = require('./src/commands/handlers');
const { scheduleClassReminders } = require('./src/reminders/jadwal');
const { checkForUpdates } = require('./src/commands/KalenderAkademik');


class WhatsAppBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth()
        });

        this.assignments = [];
        this.courses = [
            '🖥️ Struktur Data',
            '💻 Algoritma dan Pemrograman 2',
            '📐 Aljabar Linier dan Matriks',
            '📊 Graph Terapan',
            '🌐 Jaringan Komputer',
            '📈 Statistika dan Probabilitas',
            '🧮 Matematika Diskrit',
            '📁 Sistem Berkas',
            '🔔 Info Penting'
        ];

        this.userStates = {};
        initializeClient(this.client, this);
 

        // Memuat tugas yang tersimpan
        this.loadAssignments();

        // Memulai pengecekan deadline
        startAssignmentDeadlineCheck(this);

        // Memulai pengingat motivasi
        this.scheduleMotivationalQuotes();

        // Memulai pengecekan pembaruan setiap 10 menit
        setInterval(() => {
            try {
                checkForUpdates(this); // Pastikan 'this' merujuk pada botInstance yang benar
            } catch (error) {
                console.error('Error during update check:', error.message);
            }
        }, 1200000); // cek 20 menit sekali
    }

    saveAssignments() {
        saveAssignments(this);
    }

    loadAssignments() {
        loadAssignments(this);
    }

    scheduleTaskReminders() {
        scheduleTaskReminders(this);
    }

    scheduleMotivationalQuotes() {
        scheduleMotivationalQuotes(this);
    }

    getWeather() {
        getWeather(this);
    }

    scheduleClassReminders() {
        scheduleClassReminders(this);
    }
}

// Mulai bot
new WhatsAppBot();
