const axios = require('axios');
const cheerio = require('cheerio');
const { Client, LocalAuth } = require('whatsapp-web.js');

let previousEvents = [];

async function getAcademicCalendar() {
    try {
        const { data } = await axios.get('https://ftiunpam.com/kalender');
        const $ = cheerio.load(data);

        let events = [];
        $('#datatable-default tbody tr').each((index, element) => {
            const tanggalAwal = $(element).find('td').eq(1).text().trim();
            const tanggalAkhir = $(element).find('td').eq(2).text().trim();
            const kegiatan = $(element).find('td').eq(3).text().trim();
            const semester = $(element).find('td').eq(4).text().trim();
            const penugasan = $(element).find('td').eq(5).text().trim();

            events.push({
                tanggalAwal,
                tanggalAkhir,
                kegiatan,
                semester,
                penugasan
            });
        });

        return events;
    } catch (error) {
        console.error('Error fetching academic calendar:', error.message);
        return [];
    }
}

async function checkForUpdates(botInstance) {
    const currentEvents = await getAcademicCalendar();
    const newEvents = currentEvents.filter(event => !previousEvents.some(prevEvent => 
        prevEvent.tanggalAwal === event.tanggalAwal && 
        prevEvent.tanggalAkhir === event.tanggalAkhir && 
        prevEvent.kegiatan === event.kegiatan &&
        prevEvent.semester === event.semester &&
        prevEvent.penugasan === event.penugasan
    ));

    if (newEvents.length > 0) {
        previousEvents = currentEvents; // Update the previous events
        let message = '📅 *Update baru pada Kalender Akademik:*\n\n';
        const icons = ['📌', '🎓', '📘', '📅', '🔔', '📖']; // Beberapa ikon yang dapat digunakan

        newEvents.forEach((event, index) => {
            const icon = icons[index % icons.length]; // Gunakan ikon yang berbeda untuk setiap acara
            message += `${icon} *${event.kegiatan}* (${event.tanggalAwal} - ${event.tanggalAkhir})\n\n`;
        });

        // Kirim pesan ke grup WhatsApp
        const groupId = '120363153297388849@g.us'; // Ganti dengan ID grup Anda
        botInstance.client.sendMessage(groupId, message);
    }
}


module.exports = { getAcademicCalendar , checkForUpdates  };
