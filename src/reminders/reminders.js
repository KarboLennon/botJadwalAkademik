const moment = require('moment-timezone');
const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');
const path = require('path');
const sharp = require('sharp');
const { MessageMedia } = require('whatsapp-web.js');
const { kataMotivasi, nama } = require('../commands/kata');

function loadAssignments(botInstance) {
    const filePath = 'tugas.json';
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        botInstance.assignments = JSON.parse(data);
    }
}

function saveAssignments(botInstance) {
    fs.writeFileSync('tugas.json', JSON.stringify(botInstance.assignments, null, 2), 'utf-8');
}

async function getPrayerTimes() {
    try {
        const response = await axios.get('http://api.aladhan.com/v1/timingsByCity', {
            params: {
                city: 'Jakarta',
                country: 'Indonesia',
                method: 2,
            },
        });
        return response.data.data.timings;
    } catch (error) {
        console.error('Failed to get prayer times:', error.message);
    }
}

async function schedulePrayerNotifications(botInstance) {
    try {
        const timings = await getPrayerTimes();
        const prayerMap = {
            Fajr: 'Subuh',
            Dhuhr: 'Dzuhur',
            Asr: 'Ashar',
            Maghrib: 'Maghrib',
            Isha: 'Isya',
        };
        const currentDate = moment.tz('Asia/Jakarta');

        for (const [key, prayerTime] of Object.entries(prayerMap)) {
            const [hour, minute] = timings[key].split(':');
            const prayerMoment = moment.tz(`${hour}:${minute}`, 'HH:mm', 'Asia/Jakarta');
            const delay = prayerMoment.diff(currentDate);

            if (delay > 0) {
                setTimeout(async () => {
                    try {
                        const groupId = '120363153297388849@g.us';
                        await botInstance.client.sendMessage(groupId, `Waktu shalat ${prayerTime} telah tiba, sesibuk apapun kalian, jangan tinggalkan shalat 5 waktu`);
                    } catch (error) {
                        console.error(`Failed to send message for ${prayerTime}:`, error.message);
                    }
                }, delay);
            }
        }
    } catch (error) {
        console.error('Failed to schedule prayer notifications:', error.message);
    }
}

function startAssignmentDeadlineCheck(botInstance) {
    setInterval(() => {
        const now = moment.tz('Asia/Jakarta');
        botInstance.assignments = botInstance.assignments.filter(assignment => {
            const deadline = moment(assignment.deadline);
            if (deadline.isSameOrBefore(now)) {
                notifyOverdueAssignment(botInstance, assignment);
                return false;
            }
            return true;
        });
        saveAssignments(botInstance);
    }, 60 * 1000); // Cek setiap menit
}

async function notifyOverdueAssignment(botInstance, assignment) {
    try {
        const groupId = '120363153297388849@g.us';
        await botInstance.client.sendMessage(groupId, `${assignment.subject}: ${assignment.name} telah melewati deadline dan telah dihapus.`);
    } catch (error) {
        console.error(`Failed to send message for overdue task ${assignment.name}:`, error.message);
    }
}

function scheduleMotivationalQuotes(botInstance) {
    setInterval(async () => {
        const groupId = '120363153297388849@g.us';
        const randomName = nama[Math.floor(Math.random() * nama.length)];
        const randomQuote = kataMotivasi[Math.floor(Math.random() * kataMotivasi.length)].replace('{nama}', randomName);

        try {
            await botInstance.client.sendMessage(groupId, randomQuote);
            await sendSticker(groupId, botInstance);

            console.log(chalk.green(`[${moment().format('HH:mm:ss')}] Kata motivasi - sukses`));
        } catch (error) {
            console.error("Failed to send motivational quote or sticker:", error.message);
        }
    }, 12 * 60 * 60 * 1000); // Setiap 12 jam
}

async function sendSticker(groupId, botInstance) {
    const imagePath = path.join(__dirname, '../assets/stiker.png');
    const webpPath = path.join(__dirname, '../assets/sstiker.webp');

    try {
        await sharp(imagePath)
            .resize(512, 512)
            .toFormat('webp')
            .toFile(webpPath);

        const media = MessageMedia.fromFilePath(webpPath);
        await botInstance.client.sendMessage(groupId, media, { sendMediaAsSticker: true });

        fs.unlinkSync(webpPath);
    } catch (error) {
        console.error("Failed to send sticker:", error.message);
    }
}

function scheduleTaskReminders(botInstance) {
    clearExistingIntervals();

    botInstance.assignments.forEach(assignment => {
        const deadline = moment(assignment.deadline);
        const now = moment.tz('Asia/Jakarta');
        const daysUntilDeadline = deadline.diff(now, 'days');

        if (daysUntilDeadline > 0) {
            for (let i = 1; i <= daysUntilDeadline; i++) {
                const reminderTime = deadline.clone().subtract(i, 'days');
                const reminderDelay = reminderTime.diff(now);

                if (reminderDelay > 0) {
                    if (reminderDelay > 0x7FFFFFFF) {
                        scheduleLongTimeout(() => sendTaskReminder(botInstance, assignment, i), reminderDelay);
                    } else {
                        setTimeout(() => sendTaskReminder(botInstance, assignment, i), reminderDelay);
                    }
                }
            }
        }
    });
}

function scheduleLongTimeout(callback, delay) {
    if (delay > 0x7FFFFFFF) {
        setTimeout(() => {
            scheduleLongTimeout(callback, delay - 0x7FFFFFFF);
        }, 0x7FFFFFFF);
    } else {
        setTimeout(callback, delay);
    }
}

async function sendTaskReminder(botInstance, assignment, daysBeforeDeadline) {
    try {
        const groupId = '120363153297388849@g.us';
        const daysMessage = daysBeforeDeadline === 1 ? 'besok' : `${daysBeforeDeadline} hari lagi`;
        await botInstance.client.sendMessage(groupId, `Pengingat: Tugas ${assignment.subject} - ${assignment.name} akan segera ditutup pada ${moment(assignment.deadline).format('DD-MM-YYYY HH:mm')} (${daysMessage}).`);
    } catch (error) {
        console.error(`Failed to send reminder for task ${assignment.name}:`, error.message);
    }
}

function clearExistingIntervals() {
    for (let i = 1; i < 10000; i++) {
        clearInterval(i);
    }
}

function handleTaskDeletion(message, botInstance) {
    const taskNumber = parseInt(message.body.slice(8)) - 1;
    if (!isNaN(taskNumber) && taskNumber >= 0 && taskNumber < botInstance.assignments.length) {
        const deletedTask = botInstance.assignments.splice(taskNumber, 1);
        message.reply(`Tugas dihapus: ${deletedTask[0].name}`);
        saveAssignments(botInstance);
        scheduleTaskReminders(botInstance);
    } else {
        message.reply('Nomor tugas tidak valid.');
    }
}

module.exports = {
    handleTaskDeletion,
    loadAssignments,
    saveAssignments,
    schedulePrayerNotifications,
    scheduleMotivationalQuotes,
    startAssignmentDeadlineCheck,
    scheduleTaskReminders,
    notifyOverdueAssignment,
};
