const moment = require('moment-timezone');
const { parseDate, translateWeatherCondition } = require('../utils/utils');
const { notifyOverdueAssignment, sendMotivationWithSticker, removeOverdueTasks, loadAssignments, saveAssignments } = require('../reminders/reminders');
const { getAcademicCalendar } = require('../commands/KalenderAkademik');
const axios = require('axios');
<<<<<<< HEAD
const { kataJorok } = require('../commands/kata');

async function handleMessage(message, botInstance) {
	const startTime = Date.now();
=======

async function handleMessage(message, botInstance) {
>>>>>>> a7728c0f2b860168002751faa763ecafc73aec24
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
<<<<<<< HEAD
	const endTime = Date.now(); // Catat waktu setelah command selesai diproses
    const responseTime = endTime - startTime; // Hitung waktu respon dalam ms

    console.log(`Command processed in ${responseTime}ms`); // Tampilkan waktu respon di console
	// ngapus kata jorok
     if (containsBadWord(message.body)) {
        await botInstance.client.sendMessage(chatId, 'gak boleh kasar ya sayangku, nanti kak GEM cium nih😘 ah ah ah');
        console.log(`[${moment().format('HH:mm:ss')}] Teguran dikirim karena kata tidak pantas.`);

        // Hapus pesan yang mengandung kata jorok
        try {
            await message.delete(true); // Menghapus pesan dari semua anggota grup
            console.log(`[${moment().format('HH:mm:ss')}] Pesan dihapus karena mengandung kata tidak pantas.`);
        } catch (error) {
            console.error("Gagal menghapus pesan:", error.message);
        }
    }
=======
>>>>>>> a7728c0f2b860168002751faa763ecafc73aec24
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
        case '!akademik':
            await sendAcademicCalendar(message, botInstance);
            break;
    }
}

async function handleTaskDeletion(message, botInstance) {
    const input = message.body.trim(); // Menghapus spasi ekstra
    const command = "!delete";
<<<<<<< HEAD
=======
    
    // Pastikan input dimulai dengan perintah '!delete'
    if (input.startsWith(command)) {
        const taskNumber = parseInt(input.slice(command.length).trim()) - 1; // Ambil angka setelah '!delete' dan konversi ke indeks
        if (!isNaN(taskNumber) && taskNumber >= 0 && taskNumber < botInstance.assignments.length) {
            const deletedTask = botInstance.assignments.splice(taskNumber, 1);
            message.reply(`Tugas berhasil dihapus: ${deletedTask[0].name}`);
            botInstance.saveAssignments(); 
            botInstance.scheduleTaskReminders(); 
        } else {
            message.reply('Nomor tugas tidak valid.');
        }
    }
>>>>>>> a7728c0f2b860168002751faa763ecafc73aec24
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
        if (input <= 0 || input > 36) {
            message.reply('Jumlah peserta kebanyakan.');
            botInstance.userStates[message.from] = { stage: 0, data: {} }; // stop proses
            return;
        }
        userState.data.participants = input;
        message.reply('Masukkan jumlah kelompok:');
    } else if (!userState.data.groups) {
        if (input <= 0 || input > 20 || input > userState.data.participants) {
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
            '🦒', '🦓', '🦔', '🦦', '🦧', '🦥'
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

// mengacak array menggunakan algoritma Fisher-Yates
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function listAssignments(botInstance, message) {
    if (botInstance.assignments.length === 0) {
        message.reply('Tidak ada tugas yang terdaftar.');
    } else {
        let response = '📋 Daftar Tugas:\n\n';
        botInstance.assignments.forEach((assignment, index) => {
            const deadline = moment(assignment.deadline).tz('Asia/Jakarta'); // Pastikan timezone benar
            response += `${index + 1}. ${assignment.subject}\n   - Nama: ${assignment.name}\n   - Deadline: ${deadline.format('DD-MM-YYYY HH:mm')}\n\n`;
        });
        message.reply(response);
    }
}

async function sendAcademicCalendar(message, botInstance) {
    const events = await getAcademicCalendar();

    if (events.length > 0) {
        let response = '📅 Jadwal Akademik:\n\n';
        events.forEach(event => {
            response += `📌 ${event.kegiatan}\n🗓 ${event.tanggalAwal} - ${event.tanggalAkhir}\n📚 Semester: ${event.semester}\n👥 Penugasan: ${event.penugasan}\n\n`;
        });
        await botInstance.client.sendMessage(message.from, response);
    } else {
        await botInstance.client.sendMessage(message.from, 'Tidak ada data jadwal akademik yang tersedia.');
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
<<<<<<< HEAD
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
=======
>>>>>>> a7728c0f2b860168002751faa763ecafc73aec24

module.exports = { handleMessage, sendMotivationWithSticker, listAssignments, removeOverdueTasks, getWeather };
