const moment = require('moment-timezone');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const sharp = require('sharp');
const { MessageMedia } = require('whatsapp-web.js');
const { kataMotivasi, nama, kataKakGem, emotBinatang } = require('../commands/kata');

// Map untuk melacak reminder yang sudah dijadwalkan
const scheduledReminders = new Map();
const sentReminders = new Map();
let intervalId; // Variabel global untuk interval motivasi
let reminderIntervalId; // Variabel global untuk interval pengingat

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

// Fungsi untuk mengirim pengingat tugas yang sudah lewat deadline
async function notifyOverdueAssignments(botInstance, overdueAssignments) {
    try {
        const groupIds = [
            '120363153297388849@g.us', // Grup 1
            '120363173834437383@g.us'  // Grup 2
        ];

        let overdueMessage = `🚨 *Kak GEM kasih tahu* 🚨\nTugas berikut sudah melewati deadline:\n\n`;

        overdueAssignments.forEach(assignment => {
            const deadlineFormatted = moment(assignment.deadline).format('DD-MM-YYYY HH:mm');
            overdueMessage += `- ${assignment.subject}: ${assignment.name}\n⏰ Deadline: ${deadlineFormatted}\n`;
        });

        overdueMessage += `\nPAHAM!!! 👁👄👁🖐🏻`;

        // Kirim pesan ke setiap grup
        for (const groupId of groupIds) {
            await botInstance.client.sendMessage(groupId, overdueMessage);
        }

    } catch (error) {
        console.error(`Failed to send message for overdue tasks:`, error.message);
    }
}

function startAssignmentDeadlineCheck(botInstance) {
    setInterval(() => {
        removeOverdueTasks(botInstance);
    }, 60 * 1000); // Cek setiap menit
}

function removeOverdueTasks(botInstance) {
    const now = moment.tz('Asia/Jakarta');
    const overdueAssignments = [];

    botInstance.assignments = botInstance.assignments.filter(assignment => {
        const deadline = moment(assignment.deadline);
        if (deadline.isSameOrBefore(now)) {
            overdueAssignments.push(assignment); // Simpan ke dalam array tugas yang sudah lewat deadline
            return false; // Hapus dari daftar tugas aktif
        }
        return true; // Pertahankan tugas yang belum lewat deadline
    });

    if (overdueAssignments.length > 0) {
        notifyOverdueAssignments(botInstance, overdueAssignments);
    }

    saveAssignments(botInstance); // Simpan daftar tugas yang diperbarui
}

// Mengatur pengingat tugas
function scheduleTaskReminders(botInstance) {
    clearExistingIntervals(); // Pastikan interval sebelumnya dihapus

    const groupedTasks = {};

    botInstance.assignments.forEach(assignment => {
        const deadline = moment(assignment.deadline).format('YYYY-MM-DD HH:mm');
        if (!groupedTasks[deadline]) {
            groupedTasks[deadline] = [];
        }
        groupedTasks[deadline].push(assignment);
    });

    // Kirim satu pengingat untuk semua tugas dengan deadline yang sama
    for (const [deadline, tasks] of Object.entries(groupedTasks)) {
        const deadlineMoment = moment(deadline);
        const now = moment.tz('Asia/Jakarta');
        const daysUntilDeadline = deadlineMoment.diff(now, 'days');

        if (daysUntilDeadline > 0) {
            for (let i = 1; i <= daysUntilDeadline; i++) {
                const reminderTime = deadlineMoment.clone().subtract(i, 'days');
                const reminderDelay = reminderTime.diff(now);

                if (reminderDelay > 0) {
                    const reminderKey = `${deadline}-${i}`; // Buat key unik untuk setiap pengingat

                    // Hanya kirim pengingat jika belum dikirim
                    if (!sentReminders.has(reminderKey)) {
                        if (reminderDelay > 0x7FFFFFFF) {
                            scheduleLongTimeout(() => {
                                sendGroupedTaskReminder(botInstance, tasks, i, deadlineMoment);
                                sentReminders.set(reminderKey, true); // Tandai pengingat sudah dikirim
                            }, reminderDelay);
                        } else {
                            setTimeout(() => {
                                sendGroupedTaskReminder(botInstance, tasks, i, deadlineMoment);
                                sentReminders.set(reminderKey, true); // Tandai pengingat sudah dikirim
                            }, reminderDelay);
                        }
                    }
                }
            }
            scheduledReminders.set(deadline, true); // Tandai tugas sudah dijadwalkan
        }
    }
}

// Fungsi untuk pengaturan timeout panjang
function scheduleLongTimeout(callback, delay) {
    if (delay > 0x7FFFFFFF) {
        setTimeout(() => {
            scheduleLongTimeout(callback, delay - 0x7FFFFFFF);
        }, 0x7FFFFFFF);
    } else {
        setTimeout(callback, delay);
    }
}

// Fungsi untuk mengirimkan pengingat tugas
async function sendGroupedTaskReminder(botInstance, tasks, daysBeforeDeadline, deadlineMoment) {
    try {
        const groupIds = [
            '120363153297388849@g.us', // Grup 1
            '120363173834437383@g.us'  // Grup 2
        ];

        // Setel locale ke bahasa Indonesia untuk nama hari
        moment.locale('id');

        const daysMessage = daysBeforeDeadline === 1 ? 'besok' : `${daysBeforeDeadline} hari lagi`;
        const deadlineFormatted = deadlineMoment.format('dddd, DD-MM-YYYY HH:mm'); // Format hari dalam bahasa Indonesia

        let taskList = `🚨 *Kak GEM kasih ingat* 🚨\nJangan lupa kerjain tugasnya:\n\n`;

        tasks.forEach(task => {
            taskList += `- ${task.subject}: ${task.name}\n`;
        });

        taskList += `\n⏰ Deadline : *${deadlineFormatted} (${daysMessage})* ⏰\nPAHAM!!! 👁👄👁🖐🏻`;

        for (const groupId of groupIds) {
            await botInstance.client.sendMessage(groupId, taskList);
        }

    } catch (error) {
        console.error(`Failed to send reminder for tasks:`, error.message);
    }
}


// Fungsi untuk mengirim motivasi dengan stiker
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

// Mengirim stiker
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

// Mengatur pengingat motivasi berkala
function scheduleMotivationalQuotes(botInstance) {
    if (intervalId) {
        clearInterval(intervalId); // Hentikan interval yang berjalan
    }

    intervalId = setInterval(async () => {
        const groupId = '120363153297388849@g.us'; // Pastikan ID grup ditulis lengkap

        const randomName = nama[Math.floor(Math.random() * nama.length)];
        const randomQuote = kataMotivasi[Math.floor(Math.random() * kataMotivasi.length)].replace('{nama}', randomName);
        const randomEmot = emotBinatang[Math.floor(Math.random() * emotBinatang.length)];
        const fullMessage = `${randomQuote}\n\nbtw rupamu kaya ${randomEmot}`;

        try {
            await botInstance.client.sendMessage(groupId, fullMessage);
            await sendSticker(groupId, botInstance);

            console.log(`[${moment().format('HH:mm:ss')}] Kata motivasi dan penutup - sukses`);
        } catch (error) {
            console.error("Failed to send motivational quote or sticker:", error.message);
        }
    }, 6 * 60 * 60 * 1000); // Setiap 6 jam
}

// Mengatur leaderboard partisipasi
async function sendTopParticipants(botInstance) {
    const groupId = '120363153297388849@g.us'; // Sesuaikan dengan ID grup

    const sortedUsers = Object.entries(botInstance.chatCounter)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Ambil 5 teratas

    let message = "TOP 5 Mahasiswa Terbacot\n";
    sortedUsers.forEach((user, index) => {
        message += `${index + 1}. @${user[0].split('@')[0]} ngetik sebanyak ${user[1]} kali\n`;
    });

    await botInstance.client.sendMessage(groupId, message, {
        mentions: sortedUsers.map(user => user[0])
    });

    botInstance.chatCounter = {}; // Reset counter
}

// Mengatur pengiriman leaderboard harian
function scheduleDailyLeaderboard(botInstance) {
    const now = moment().tz('Asia/Jakarta');
    const ninePM = moment().tz('Asia/Jakarta').set({ hour: 21, minute: 0, second: 0 });

    const delay = ninePM.diff(now);

    setTimeout(() => {
        sendTopParticipants(botInstance);

        setInterval(() => {
            sendTopParticipants(botInstance);
        }, 86400000); // Ulangi setiap 24 jam
    }, delay > 0 ? delay : 86400000 + delay);
}

// Mengirim notifikasi gempa
async function sendEarthquakeNotification(botInstance) {
    const groupId = '120363153297388849@g.us'; // Ganti dengan ID grup yang sesuai
    const earthquake = await fetchLatestEarthquake();

    if (earthquake) {
        if (parseFloat(earthquake.magnitude) >= 4.5) {
            const message = `
🌍 *BMKGEM Melaporkan!* 🌍
Tanggal: ${earthquake.date}
Waktu: ${earthquake.time} WIB
Magnitude: ${earthquake.magnitude}
Kedalaman: ${earthquake.depth}
Lokasi: ${earthquake.location}
Potensi: ${earthquake.potential || 'Tidak ada'}
            `;

            try {
                console.log(`Mengirim notifikasi gempa ke grup ${groupId}`);
                await botInstance.client.sendMessage(groupId, message);

                const imageUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${earthquake.id}`;
                const imagePath = path.join(__dirname, '../assets/shakemap.jpg');

                const response = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'stream',
                });

                response.data.pipe(fs.createWriteStream(imagePath));

                await new Promise((resolve, reject) => {
                    response.data.on('end', resolve);
                    response.data.on('error', reject);
                });

                const media = MessageMedia.fromFilePath(imagePath);
                await botInstance.client.sendMessage(groupId, media);

                fs.unlinkSync(imagePath);
                console.log(`[${moment().format('HH:mm:ss')}] Notifikasi gempa dan gambar terkirim`);
            } catch (error) {
                console.error('Gagal mengirim notifikasi gempa atau gambar:', error.message);
            }
        } else {
            console.log(`Gempa terdeteksi dengan magnitudo ${earthquake.magnitude}, tidak memenuhi syarat untuk pengiriman notifikasi (>= 4.5).`);
        }
    } else {
        console.log('Tidak ada gempa baru yang terdeteksi.');
    }
}

// Mengecek gempa setiap 5 menit
function scheduleEarthquakeCheck(botInstance) {
    setInterval(() => {
        sendEarthquakeNotification(botInstance);
    }, 2 * 60 * 1000); // Cek setiap 5 menit
}

// Menghapus interval pengingat sebelumnya
function clearExistingIntervals() {
    if (reminderIntervalId) {
        clearInterval(reminderIntervalId);
        reminderIntervalId = null; // Pastikan interval direset
    }
    scheduledReminders.clear(); // Hapus semua pengingat yang dijadwalkan sebelumnya
}

// Ekspor fungsi
module.exports = {
    loadAssignments,
    saveAssignments,
    scheduleTaskReminders,
    startAssignmentDeadlineCheck,
    removeOverdueTasks,
    notifyOverdueAssignments,
    scheduleMotivationalQuotes,
    sendMotivationWithSticker,
    scheduleDailyLeaderboard,
    scheduleEarthquakeCheck
};
