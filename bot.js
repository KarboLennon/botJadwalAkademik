const { Client, LocalAuth } = require('whatsapp-web.js');
const { initializeClient } = require('./src/config/client');
const { saveAssignments, loadAssignments, scheduleTaskReminders, scheduleMotivationalQuotes, startAssignmentDeadlineCheck, scheduleDailyLeaderboard, scheduleEarthquakeCheck } = require('./src/reminders/reminders');
const { getWeather, handleMessage } = require('./src/commands/handlers');
const { scheduleClassReminders } = require('./src/reminders/jadwal');

class WhatsAppBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth()
        });

        this.assignments = [];
        this.courses = [
            '👨‍💻 Struktur Data',
            '📈 Statistika dan Probabilitas',
            '🌐 Jaringan Komputer',
            '📊 Graph Terapan',
            '📁 Sistem Berkas',
            '📐 Aljabar Linier dan Matriks',
            '💻 Algoritma dan Pemrograman 2',
            '🧮 Matematika Diskrit',
            '🔔 Info Penting'
        ];

        this.userStates = {};
        this.chatCounter = {}; // Inisialisasi counter chat di sini, dalam constructor

        initializeClient(this.client, this);

        // Memuat tugas yang tersimpan
        this.loadAssignments();

        // Memulai pengecekan deadline
        startAssignmentDeadlineCheck(this);

        // Memulai pengingat motivasi
        this.scheduleMotivationalQuotes();

        // Jadwalkan leaderboard harian
        this.scheduleDailyLeaderboard();

        // Jadwalkan pengecekan gempa
        this.scheduleEarthquakeCheck(); // Tambahkan pemanggilan ini
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

    scheduleDailyLeaderboard() {
        scheduleDailyLeaderboard(this);
    }

    scheduleEarthquakeCheck() {
        scheduleEarthquakeCheck(this);
    }
}

// Mulai bot
new WhatsAppBot();

