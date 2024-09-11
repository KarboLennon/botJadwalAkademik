const moment = require('moment-timezone');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const sharp = require('sharp');
const { MessageMedia } = require('whatsapp-web.js');
const { kataMotivasi, nama, kataKakGem } = require('../commands/kata');

function loadAssignments(botInstance) {
    const filePath = 'tugas.json';
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        botInstance.assignments = JSON.parse(data);
    } else {
        botInstance.assignments = []; // Mulai dengan daftar kosong jika file tidak ada
    }
}

function saveAssignments(botInstance) {
    fs.writeFileSync('tugas.json', JSON.stringify(botInstance.assignments, null, 2), 'utf-8');
}

async function notifyOverdueAssignment(botInstance, assignment) {
    try {
        const groupId = '120363153297388849@g.us';
        await botInstance.client.sendMessage(groupId, `${assignment.subject}: ${assignment.name} udah lewat deadline bos, mampus yang belom ngerjain.`);
    } catch (error) {
        console.error(`Failed to send message for overdue task ${assignment.name}:`, error.message);
    }
}

function startAssignmentDeadlineCheck(botInstance) {
    setInterval(() => {
        removeOverdueTasks(botInstance);
    }, 60 * 1000); // Cek setiap menit
}

function removeOverdueTasks(botInstance) {
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
}

let intervalId;

function scheduleMotivationalQuotes(botInstance) {
    if (intervalId) {
        clearInterval(intervalId); // Hentikan interval yang berjalan
    }

    intervalId = setInterval(async () => {
        const groupId = '120363153297388849@g.us';
        const randomName = nama[Math.floor(Math.random() * nama.length)];
        const randomQuote = kataMotivasi[Math.floor(Math.random() * kataMotivasi.length)].replace('{nama}', randomName);

        try {
            await botInstance.client.sendMessage(groupId, randomQuote);
            await sendSticker(groupId, botInstance);

            console.log(`[${moment().format('HH:mm:ss')}] Kata motivasi - sukses`);
        } catch (error) {
            console.error("Failed to send motivational quote or sticker:", error.message);
        }
    }, 6 * 60 * 60 * 1000); // Setiap 6 jam
}


async function sendSticker(groupId, botInstance) {
    const imagePath = path.join(__dirname, '../assets/stiker.png');
    const webpPath = path.join(__dirname, '../assets/stiker.webp');

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

async function sendMotivationWithSticker(botInstance) {
    try {
        const randomQuote = kataKakGem[Math.floor(Math.random() * kataKakGem.length)];
        const groupId = '120363153297388849@g.us'; // Ganti dengan ID grup yang sesuai

        await botInstance.client.sendMessage(groupId, randomQuote);
        await sendSticker(groupId, botInstance);

        console.log(`[${moment().format('HH:mm:ss')}] Kata motivasi dengan stiker - sukses`);
    } catch (error) {
        console.error("Failed to send motivational quote with sticker:", error.message);
    }
}

async function sendTopParticipants(botInstance) {
    const groupId = '120363153297388849@g.us'; // Sesuaikan dengan ID grup

    // Urutkan berdasarkan jumlah chat
    const sortedUsers = Object.entries(botInstance.chatCounter)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Ambil 5 teratas

    let message = "TOP 5 Mahasiswa Terbacot\n";
    sortedUsers.forEach((user, index) => {
        message += `${index + 1}. @${user[0].split('@')[0]} ngetik sebanyak ${user[1]} kali\n`;
    });

    // Kirim pesan dan tag nomor mahasiswa
    await botInstance.client.sendMessage(groupId, message, {
        mentions: sortedUsers.map(user => user[0])
    });

    // Reset counter setelah leaderboard dikirim
    botInstance.chatCounter = {};
}

// Menjalankan setiap hari pada jam 9 malam
function scheduleDailyLeaderboard(botInstance) {
    const now = moment().tz('Asia/Jakarta');
    const ninePM = moment().tz('Asia/Jakarta').set({ hour: 21, minute: 0, second: 0 });

    const delay = ninePM.diff(now); // Berapa lama lagi sampai jam 9 malam

    setTimeout(() => {
        sendTopParticipants(botInstance);

        // Ulangi setiap 24 jam
        setInterval(() => {
            sendTopParticipants(botInstance);
        }, 86400000);
    }, delay > 0 ? delay : 86400000 + delay); // Jika sekarang sudah lewat jam 9 malam, jalankan besok
}


module.exports = {
    loadAssignments,
    saveAssignments,
    scheduleMotivationalQuotes,
    startAssignmentDeadlineCheck,
    scheduleTaskReminders,
    notifyOverdueAssignment,
    removeOverdueTasks,
    sendMotivationWithSticker,
	scheduleDailyLeaderboard
};
