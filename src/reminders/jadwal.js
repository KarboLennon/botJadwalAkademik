const moment = require('moment-timezone');

// Jadwal kelas
const schedule = [
    {
        subject: 'Struktur Data',
        day: 'Monday',
        time: '18:20 - 20:00',
        startDate: '2024-09-09',
        endDate: '2025-01-03',
    },
    {
        subject: 'Statistika dan Probabilitas',
        day: 'Monday',
        time: '20:00 - 21:40',
        startDate: '2024-09-09',
        endDate: '2025-01-03',
    },
    {
        subject: 'Jaringan Komputer',
        day: 'Tuesday',
        time: '18:20 - 20:00',
        startDate: '2024-09-09',
        endDate: '2025-01-03',
    },
    {
        subject: 'Graph Terapan',
        day: 'Tuesday',
        time: '20:00 - 21:40',
        startDate: '2024-09-09',
        endDate: '2025-01-03',
    },
    {
        subject: 'Sistem Berkas',
        day: 'Wednesday',
        time: '18:20 - 20:00',
        startDate: '2024-09-09',
        endDate: '2025-01-03',
    },
    {
        subject: 'Aljabar Linier dan Matriks',
        day: 'Thursday',
        time: '18:20 - 20:00',
        startDate: '2024-09-09',
        endDate: '2025-01-03',
    },
    {
        subject: 'Algoritma dan Pemrograman II',
        day: 'Thursday',
        time: '20:00 - 21:40',
        startDate: '2024-09-09',
        endDate: '2025-01-03',
    },
    {
        subject: 'Matematika Diskrit',
        day: 'Friday',
        time: '18:20 - 20:00',
        startDate: '2024-09-09',
        endDate: '2025-01-03',
    },
];

// Fungsi untuk menjadwalkan pengingat kelas
async function scheduleClassReminders(botInstance) {
    // Grouping jadwal berdasarkan hari
    const groupedSchedule = {};
    schedule.forEach(classInfo => {
        if (!groupedSchedule[classInfo.day]) {
            groupedSchedule[classInfo.day] = [];
        }
        groupedSchedule[classInfo.day].push(classInfo);
    });

    // Penjadwalan pengingat untuk setiap hari
    Object.keys(groupedSchedule).forEach(day => {
        const classes = groupedSchedule[day];

        // Ambil timezone dan waktu sekarang
        const now = moment.tz('Asia/Jakarta');

        // Jadwalkan pengingat untuk setiap kelas
        classes.forEach(classInfo => {
            const classStartTime = moment.tz(`${classInfo.startDate} ${classInfo.time.split(' - ')[0]}`, 'YYYY-MM-DD HH:mm', 'Asia/Jakarta');
            
            // Mengecek apakah kelas sudah berakhir
            const classEndDate = moment.tz(classInfo.endDate, 'YYYY-MM-DD', 'Asia/Jakarta');
            if (now.isAfter(classEndDate)) {
                return; // Lewati kelas jika sudah berakhir
            }

            // Pengingat dikirimkan 6 jam sebelum kelas dimulai
            const reminderTime = classStartTime.clone().subtract(6, 'hours');
            const delay = reminderTime.diff(now);

            // Jika reminderTime setelah waktu saat ini, jadwalkan pengiriman pesan
            if (delay > 0) {
                setTimeout(async () => {
                    try {
                        const groupId = '120363153297388849@g.us'; // Ganti dengan ID grup yang benar
                        let message = `Jadwal mata kuliah hari ini:\n`;

                        // Loop setiap kelas pada hari tersebut dan tambahkan ke pesan
                        classes.forEach(classDetail => {
                            message += `\n- ${classDetail.subject}: pukul ${classDetail.time}`;
                        });

                        // Kirim pesan ke grup
                        await botInstance.client.sendMessage(groupId, message);
                        console.log(`[${moment().format('HH:mm:ss')}] Reminder for classes on ${day} - sukses`);
                    } catch (error) {
                        console.error(`Failed to send reminder for classes on ${day}:`, error.message);
                    }
                }, delay);
            }
        });
    });
}

module.exports = { scheduleClassReminders };
