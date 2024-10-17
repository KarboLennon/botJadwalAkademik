const moment = require('moment-timezone');
const { parseDate, translateWeatherCondition } = require('../utils/utils');
const { notifyOverdueAssignment, sendMotivationWithSticker, removeOverdueTasks, loadAssignments, saveAssignments } = require('../reminders/reminders');
const axios = require('axios');
const { kataJorok } = require('../commands/kata');

async function handleMessage(message, botInstance) {
    const chatId = message.from;

    // Initialize user state if not already initialized
    if (!botInstance.userStates[chatId]) {
        botInstance.userStates[chatId] = { stage: 0, data: {} };
    }

    const userState = botInstance.userStates[chatId];
    const messageBody = message.body.trim();

    // Handle !delete command separately
    if (messageBody.startsWith('!delete')) {
        await handleTaskDeletion(message, botInstance);
        return;
    }
	
    trackParticipation(botInstance, message);

    switch (userState.stage) {
        case 0:
            await handleInitialStage(message, userState, botInstance);
            break;
        case 1:
            await handleCourseSelection(message, userState, botInstance);
            break;
        case 2:
            await handleTaskName(message, userState, botInstance);
            break;
        case 3:
            await handleDeadline(message, userState, botInstance);
            break;
        case 4:
            await handleKelompokInput(message, userState, botInstance);
            break;
        default:
            botInstance.userStates[chatId] = { stage: 0, data: {} };
            message.reply('Terjadi kesalahan. Mulai dari awal dengan mengetikkan !add');
            break;
    }

    // Cek apakah ada kata jorok
    if (containsBadWord(message.body)) {
        const response = getRandomResponse(); // Ambil respons secara acak
        await botInstance.client.sendMessage(chatId, response);

        // Hapus pesan yang mengandung kata jorok
        try {
            await message.delete(true); // Menghapus pesan dari semua anggota grup
        } catch (error) {
            console.error("Gagal menghapus pesan:", error.message);
        }
    }
}

// Fungsi untuk mengecek apakah pesan dikirim antara jam 7 pagi sampai jam 9 malam
function isWithinParticipationTime() {
    const now = moment().tz('Asia/Jakarta');
    const startTime = moment().tz('Asia/Jakarta').set({ hour: 7, minute: 0, second: 0 });
    const endTime = moment().tz('Asia/Jakarta').set({ hour: 21, minute: 0, second: 0 });
    return now.isBetween(startTime, endTime);
}

function trackParticipation(botInstance, message) {
    const userId = message.author || message.from;
    const botNumber = botInstance.client.info.wid._serialized;
    const groupId = '120363153297388849@g.us'; 

    if (userId !== botNumber && message.from === groupId && isWithinParticipationTime()) {
        if (!botInstance.chatCounter[userId]) {
            botInstance.chatCounter[userId] = 1;
        } else {
            botInstance.chatCounter[userId] += 1;
        }
    }
}

// Handle the initial stage of user input
async function handleInitialStage(message, userState, botInstance) {
    switch (message.body.trim()) {
        case '!add':
            const courseList = botInstance.courses.map((course, index) => `${index + 1}. ${course}`).join('\n');
            message.reply(`Mata kuliah nomor berapa yang ingin anda tambahkan?\n0. Batalkan\n${courseList}`);
            userState.stage = 1;
            break;
        case '!list':
            await listAssignments(botInstance, message);
            break;
        case '!cuaca':
            const weather = await getWeather();
            message.reply(weather);
            break;
        case '!paham':
            await sendMotivationWithSticker(message, botInstance);
            break;
        case '!kelompok':
            message.reply('Masukkan jumlah peserta :');
            userState.stage = 4;
            userState.data = {}; // Reset data
            break;
        case '!menu': // Menambahkan case untuk command !menu
            message.reply(getRandomMenuResponse());
            break;
    }
}

// Fungsi untuk menghasilkan balasan menu secara acak
function getRandomMenuResponse() {
    const menuResponses = [
        '📋 *Menu Utama Kakak:*\n\n1. `!add` – Nambah tugas dan deadline baru.\n2. `!list` – Liat tugas-tugas yang belum kelar.\n3. `!delete` – Hapus tugas yang gak dibutuhin.\n4. `!kelompok` – Bagi kelompok random! Siap-siap jadi team solid.\n5. `!cuaca` – Cek cuaca di UNPAM, biar gak salah kostum.\n6. `!paham` – Kak GEM hadir buat kasih semangat!',
        '🌟 *Ada apa hari ini?* 🌟\n\n1. `!add` – Mau tambahin tugas? Ini dia!\n2. `!list` – List tugas menanti kamu.\n3. `!delete` – Tugas sudah beres? Hapus dong.\n4. `!kelompok` – Randomize kelompok dengan seru.\n5. `!cuaca` – Info cuaca terkini di UNPAM, jangan sampe kehujanan.\n6. `!paham` – Dapet semangat dari Kak GEM!',
        '🎯 *Perintah Yang Bisa Dilakukan:* 🎯\n\n1. `!add` – Tambah tugas plus deadline.\n2. `!list` – Cek daftar tugas yang ada.\n3. `!delete` – Hapus tugas yang udah selesai.\n4. `!kelompok` – Bagi kelompok secara random!\n5. `!cuaca` – Cek cuaca UNPAM.\n6. `!paham` – Dengerin Kak GEM kasih motivasi!',
        '🔔 *Ini Daftar Perintah Kamu!* 🔔\n\n1. `!add` – Tambah tugas dengan deadline.\n2. `!list` – Liat daftar tugas kamu.\n3. `!delete` – Hapus tugas yang udah gak dibutuhin.\n4. `!kelompok` – Bagi kelompok secara acak.\n5. `!cuaca` – Cek kondisi cuaca di UNPAM.\n6. `!paham` – Mendapatkan dukungan penuh dari Kak GEM!',
        '🚀 *Pilihan Aksi untuk Kamu!* 🚀\n\n1. `!add` – Tambah tugas baru.\n2. `!list` – Lihat daftar tugas.\n3. `!delete` – Hapus tugas lama.\n4. `!kelompok` – Bagi kelompok random!\n5. `!cuaca` – Cek cuaca di UNPAM.\n6. `!paham` – Dapet dukungan manis dari Kak GEM!'
    ];

    const randomIndex = Math.floor(Math.random() * menuResponses.length);
    return menuResponses[randomIndex];
}


async function handleTaskDeletion(message, botInstance) {
    const input = message.body.trim();
    const taskIndex = parseInt(input.replace('!delete', '').trim()) - 1;

    if (isNaN(taskIndex) || taskIndex < 0 || taskIndex >= botInstance.assignments.length) {
        message.reply('Nomor tugas tidak valid. Silakan coba lagi.');
        return;
    }

    const removedTask = botInstance.assignments.splice(taskIndex, 1);
    saveAssignments(botInstance);
    message.reply(`🔔 ${removedTask[0].name} telah dihapus.`);
}

// Function to handle course selection
async function handleCourseSelection(message, userState, botInstance) {
    const courseIndex = parseInt(message.body) - 1;

    if (message.body === '0') {
        message.reply('Proses penambahan tugas dibatalkan.');
        botInstance.userStates[message.from] = { stage: 0, data: {} }; // Reset state
        return;
    }

    if (!isNaN(courseIndex) && courseIndex >= 0 && courseIndex < botInstance.courses.length) {
        userState.data.subject = botInstance.courses[courseIndex];
        message.reply('Masukan nama tugas\n0. Batalkan');
        userState.stage = 2;
    } else {
        message.reply('Nomor mata kuliah tidak valid. Silakan coba lagi.');
    }
}

// Handle task name input
async function handleTaskName(message, userState) {
    if (message.body === '0') {
        message.reply('Proses penambahan tugas dibatalkan.');
        userState.stage = 0;
    } else {
        userState.data.name = message.body;
        message.reply('Masukan tanggal deadline (format: DD-MM-YYYY HH:MM)\n0. Batalkan');
        userState.stage = 3;
    }
}

// Handle deadline input and final task creation
async function handleDeadline(message, userState, botInstance) {
    if (message.body === '0') {
        message.reply('Proses penambahan tugas dibatalkan.');
        userState.stage = 0;
    } else {
        const deadline = parseDate(message.body);
        if (deadline) {
            userState.data.deadline = deadline.toISOString(); // Simpan sebagai string ISO
            botInstance.assignments.push(userState.data);
            message.reply(`Tugas ${userState.data.subject} berhasil ditambahkan: ${userState.data.name} (Deadline: ${deadline.format('DD-MM-YYYY HH:mm')})`);
            botInstance.userStates[message.from] = { stage: 0, data: {} }; // Reset state
            botInstance.saveAssignments();
            botInstance.scheduleTaskReminders();
        } else {
            message.reply('Format tanggal tidak valid. Silakan masukkan tanggal deadline (format: DD-MM-YYYY HH:MM)\n0. Batalkan');
        }
    }
}

// Handle input for group creation
async function handleKelompokInput(message, userState, botInstance) {
    const input = parseInt(message.body);

    if (isNaN(input)) {
        message.reply('Input tidak valid. Harap masukkan angka yang benar.');
        botInstance.userStates[message.from] = { stage: 0, data: {} }; // Reset state and stop process
        return;
    }

    if (!userState.data.participants) {
        if (input <= 0 || input > 50) {
            message.reply('Jumlah peserta kebanyakan.');
            botInstance.userStates[message.from] = { stage: 0, data: {} }; // stop proses
            return;
        }
        userState.data.participants = input;
        message.reply('Masukkan jumlah kelompok:');
    } else if (!userState.data.groups) {
        if (input <= 0 || input > 25 || input > userState.data.participants) {
            message.reply('Jumlah kelompok tidak masuk akal, silahkan ulangi.');
            botInstance.userStates[message.from] = { stage: 0, data: {} }; // Reset state and stop process
            return;
        }
        userState.data.groups = input;

        const groupAssignments = createGroups(userState.data.participants, userState.data.groups);
       const icons = [
    '🐱', '🐶', '🦁', '🐯', '🐰', '🐸', '🐼', '🐻', '🐷', '🐨',
    '🦄', '🐥', '🐉', '🐳', '🐙', '🐊', '🐧', '🦋', '🐢', '🐍',
    '🐸', '🐲', '🐎', '🐏', '🐑', '🐪', '🐫', '🐘', '🦏', '🦍',
    '🦒', '🦓', '🦔', '🦦', '🦧', '🦥', '🦘', '🦨', '🦩', '🦇',
    '🦅', '🦆', '🦉', '🦢', '🦡', '🦈', '🦑', '🐙', '🐡', '🐠'
];


        // Randomize icon assignment
        shuffleArray(icons);

        let response = 'Pembagian kelompok:\n\n';
        let iconIndex = 0;

        groupAssignments.forEach((group, index) => {
            response += `Kelompok ${index + 1}\n`;
            group.forEach((participant) => {
                const icon = icons[iconIndex++ % icons.length]; // Pastikan ikon berbeda untuk setiap peserta
                response += `${icon} Absen Nomor urut ${participant}\n`;
            });
            response += '\n';
        });

        message.reply(response);

        botInstance.userStates[message.from] = { stage: 0, data: {} }; 
    }
}

// Create random groups from participants
function createGroups(participants, groups) {
    const participantNumbers = Array.from({ length: participants }, (_, i) => i + 1);
    shuffleArray(participantNumbers);

    const groupAssignments = Array.from({ length: groups }, () => []);

    participantNumbers.forEach((participant, index) => {
        const groupIndex = index % groups;
        groupAssignments[groupIndex].push(participant);
    });

    return groupAssignments;
}

// Mengacak array menggunakan algoritma Fisher-Yates
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Fungsi untuk mengecek apakah ada kata jorok
function containsBadWord(message) {
    const lowercasedMessage = message.toLowerCase();
    return kataJorok.some(badWord => {
        // Membuat regex dengan pelindung kata dan fleksibilitas yang lebih tinggi untuk huruf yang berulang
        const pattern = '\\b' + badWord
            .split('')
            .map(char => `${char}+[^a-zA-Z0-9]*`)
            .join('') + '\\b';
        const regex = new RegExp(pattern, 'gi');
        return regex.test(lowercasedMessage);
    });
}

// Tambahkan array respons untuk kata jorok
const responses = [
    'gak boleh kasar ya sayangku, nanti kak GEM cium nih😘 ah ah ah',
    'Jangan ngomong kasar ya, nanti kena peluk manja dari kak GEM! 🤗',
    'Di ajarin adab ga? Nanti kak GEM cubit sayang nih 🤭',
    'Bahasa kasarmu bikin kak GEM sedih, coba lebih sopan ya! 😘',
    'Sayang, jangan kasar ya 😘 nanti kak GEM cubit pipi kamu!',
];

// Pilih respons secara acak
function getRandomResponse() {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

async function listAssignments(botInstance, message) {
    if (botInstance.assignments.length === 0) {
        message.reply('Alhamdulillah ga ada tugas.');
    } else {
        moment.locale('id');
        
        // Mengurutkan tugas berdasarkan deadline terdekat
        const sortedAssignments = botInstance.assignments.sort((a, b) => {
            const deadlineA = moment(a.deadline).tz('Asia/Jakarta');
            const deadlineB = moment(b.deadline).tz('Asia/Jakarta');
            return deadlineA.diff(deadlineB); // Urutkan dari terdekat ke terjauh
        });

        let response = '📋 Daftar Tugas :\n\n';
        sortedAssignments.forEach((assignment, index) => {
            const deadline = moment(assignment.deadline).tz('Asia/Jakarta');
            const today = moment().tz('Asia/Jakarta');
            const daysDifference = deadline.diff(today, 'days');

            let deadlineDescription = deadline.format('dddd, DD-MM-YYYY HH:mm'); // Nama hari + format tanggal

            if (daysDifference === 0) {
                deadlineDescription += ' (hari ini)';
            } else if (daysDifference === 1) {
                deadlineDescription += ' (besok)';
            } else if (daysDifference > 1) {
                deadlineDescription += ` (${daysDifference} hari lagi)`;
            }

            response += `${index + 1}. ${assignment.subject}\n   - Nama: ${assignment.name}\n   - Deadline: ${deadlineDescription}\n\n`;
        });
        message.reply(response);
    }
}




async function getWeather() {
    try {
        const apiKey = '317457e05859404c814170051243007'; 
        const lat = '-6.346497102263792';
        const lon = '106.69157422953396';
        const response = await axios.get('http://api.weatherapi.com/v1/current.json', {
            params: {
                key: apiKey,
                q: `${lat},${lon}`,
                lang: 'id'
            }
        });
        const weather = response.data;
        const weatherCondition = translateWeatherCondition(weather.current.condition.text); // Perbaikan pada penggunaan `this`
        return `Cuaca di UNPAM saat ini : ${weatherCondition}\nSuhu: ${weather.current.temp_c}°C\nKelembapan: ${weather.current.humidity}%\nKecepatan Angin: ${weather.current.wind_kph} kph`;
    } catch (error) {
        console.error('Failed to get weather data:', error.message);
        return 'Gagal mendapatkan data cuaca.';
    }
}

module.exports = { handleMessage, sendMotivationWithSticker, listAssignments, removeOverdueTasks, getWeather };
