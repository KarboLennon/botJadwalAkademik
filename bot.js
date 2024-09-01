const { Client, LocalAuth } = require('whatsapp-web.js');
const { initializeClient } = require('./src/config/client');
const { saveAssignments, loadAssignments, scheduleTaskReminders, scheduleMotivationalQuotes } = require('./src/reminders/reminders');
const { getWeather } = require('./src/commands/handlers');
const axios = require('axios');
const { scheduleClassReminders } = require('./src/reminders/jadwal');

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
		scheduleClassReminders(this)
	}
	sendAcademicCalendar(){
		sendAcademicCalendar(this)
	}
	 
}

new WhatsAppBot();
