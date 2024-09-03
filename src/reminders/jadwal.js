const moment = require('moment-timezone');

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

async function scheduleClassReminders(botInstance) {
    const groupedSchedule = {};

    // Group classes by day
    schedule.forEach(classInfo => {
        if (!groupedSchedule[classInfo.day]) {
            groupedSchedule[classInfo.day] = [];
        }
        groupedSchedule[classInfo.day].push(classInfo);
    });

    // Schedule reminders for each day
    Object.keys(groupedSchedule).forEach(day => {
        const classes = groupedSchedule[day];
        const startDate = moment.tz(classes[0].startDate, 'YYYY-MM-DD', 'Asia/Jakarta');
        const endDate = moment.tz(classes[0].endDate, 'YYYY-MM-DD', 'Asia/Jakarta');

        while (startDate.isBefore(endDate)) {
            const reminderTime = moment.tz(`${day} ${classes[0].time.split(' - ')[0]}`, 'dddd HH:mm', 'Asia/Jakarta').subtract(6, 'hours');
            const now = moment.tz('Asia/Jakarta');

            if (reminderTime.isAfter(now)) {
                const delay = reminderTime.diff(now);

                setTimeout(async () => {
                    try {
                        const groupId = '120363153297388849@g.us';
                        let message = `jadwal mata kuliah hari ini :\n`;

                        classes.forEach(classInfo => {
                            message += `\n- ${classInfo.subject}: pukul ${classInfo.time}`;
                        });

                        await botInstance.client.sendMessage(groupId, message);
                        console.log(`[${moment().format('HH:mm:ss')}] Reminder for classes on ${day} - sukses`);
                    } catch (error) {
                        console.error(`Failed to send reminder for classes on ${day}:`, error.message);
                    }
                }, delay);
            }

            // Move to the next week
            startDate.add(1, 'week');
        }
    });
}

module.exports = { scheduleClassReminders };
