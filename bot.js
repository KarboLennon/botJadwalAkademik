const { Client, LocalAuth } = require('whatsapp-web.js');
const { initializeClient } = require('./src/config/client');
const { saveAssignments, loadAssignments, scheduleTaskReminders, scheduleMotivationalQuotes } = require('./src/reminders/reminders');
const { getWeather } = require('./src/commands/handlers');
const { scheduleClassReminders } = require('./src/reminders/jadwal');
const { checkForUpdates } = require('./src/commands/KalenderAkademik');

class WhatsAppBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth()
        });

        this.assignments = [];
        this.courses = [
            'Struktur Data',
            'Algoritma dan Pemrograman 2',
            'Aljabar Linier dan Matriks',
            'Graph Terapan',
            'Jaringan Komputer',
            'Statistika dan Probabilitas',
            'Matematika Diskrit',
            'Sistem Berkas',
            'Info Penting'
        ];
        this.userStates = {};

        initializeClient(this.client, this);

        // Mulai pengecekan pembaruan setiap 10 menit
        setInterval(() => {
            try {
                checkForUpdates(this); // Pastikan 'this' merujuk pada botInstance yang benar
            } catch (error) {
                console.error('Error during update check:', error.message);
            }
        }, 10 * 60 * 1000); // 10 menit
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
