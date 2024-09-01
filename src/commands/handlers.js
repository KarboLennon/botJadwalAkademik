const moment = require('moment-timezone');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const sharp = require('sharp');
const { MessageMedia } = require('whatsapp-web.js');
const { parseDate, translateWeatherCondition } = require('../utils/utils');
const { handleTaskDeletion, notifyOverdueAssignment } = require('../reminders/reminders');
const { kataKakGem } = require('../commands/kata'); 
const { getAcademicCalendar } = require('../commands/KalenderAkademik');

async function handleMessage(message, botInstance) {
    const chatId = message.from;

    // Initialize user state if not already initialized
    if (!botInstance.userStates[chatId]) {
        botInstance.userStates[chatId] = { stage: 0, data: {} };
    }

    const userState = botInstance.userStates[chatId];

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
}

// Handle the initial stage of user input
async function handleInitialStage(message, userState, botInstance) {
    switch (message.body) {
        case '!add':
            const courseList = botInstance.courses.map((course, index) => `${index + 1}. ${course}`).join('\n');
            message.reply(`Mata kuliah nomor berapa yang ingin anda tambahkan?\n0. Batalkan\n${courseList}`);
            userState.stage = 1;
            break;
        case '!list':
            await listAssignments(botInstance, message);
            break;
        case '!delete ':
            await handleTaskDeletion(message, botInstance);
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

// Handle course selection input
async function handleCourseSelection(message, userState, botInstance) {
    const courseIndex = parseInt(message.body) - 1;
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
            userState.data.deadline = deadline;
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
        if (input <= 0 || input > 40) {
            message.reply('Jumlah peserta maksimal adalah 40.');
            botInstance.userStates[message.from] = { stage: 0, data: {} }; // stop proses
            return;
        }
        userState.data.participants = input;
        message.reply('Masukkan jumlah kelompok :');
    } else if (!userState.data.groups) {
        if (input <= 0 || input > 20 || input > userState.data.participants) {
            message.reply('jumlah kelompok ngga masuk akal, silahkan ulangi.');
            botInstance.userStates[message.from] = { stage: 0, data: {} }; // Reset state and stop process
            return;
        }
        userState.data.groups = input;

        const groupAssignments = createGroups(userState.data.participants, userState.data.groups);
        let response = 'Pembagian kelompok:\n\n';
        groupAssignments.forEach((group, index) => {
            response += `Kelompok ${index + 1}\n`;
            group.forEach(participant => {
                response += `Absen Nomor urut ${participant}\n`;
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

// mengacak kelompok menggunakan algoritma Fisher-Yates
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Send a motivational message along with a sticker
async function sendMotivationWithSticker(message, botInstance) {
    const chatId = message.from;

    // Select a random motivational phrase
    const randomIndex = Math.floor(Math.random() * kataKakGem.length);
    const selectedMotivation = kataKakGem[randomIndex];

    // Send the motivational message
    await botInstance.client.sendMessage(chatId, selectedMotivation);

    // Path to the image to be converted into a sticker
    const imagePath = path.join(__dirname, '../assets/stiker.png');
    const webpPath = path.join(__dirname, '../assets/stiker.webp');

    // Convert the image to webp using sharp
    await sharp(imagePath)
        .resize(512, 512) 
        .toFormat('webp')
        .toFile(webpPath);

    const media = MessageMedia.fromFilePath(webpPath);

    // Send the sticker
    await botInstance.client.sendMessage(chatId, media, { sendMediaAsSticker: true });

    // Delete the temporary file after sending
    fs.unlinkSync(webpPath);
}

// Retrieve the current weather
async function getWeather() {
    try {
        const apiKey = '317457e05859404c814170051243007'; // Replace with your API key
        const lat = '-6.346053';
        const lon = '106.691657';
        const response = await axios.get(`http://api.weatherapi.com/v1/forecast.json`, {
            params: {
                key: apiKey,
                q: `${lat},${lon}`,
                lang: 'id',
            }
        });

        const currentWeather = response.data.current;

        // Translate the weather condition to the local language
        const currentCondition = translateWeatherCondition(currentWeather.condition.text);

        console.log(`Kondisi saat ini: ${currentWeather.condition.text}`);
        console.log("Terjemahan kondisi saat ini:\n", currentCondition);

        return `Cuaca di UNPAM saat ini: ${currentCondition}\nSuhu: ${currentWeather.temp_c}°C\nKelembapan: ${currentWeather.humidity}%\nKecepatan Angin: ${currentWeather.wind_kph} kph\nPAHAM!`;
    } catch (error) {
        console.error('Failed to get weather data:', error.message);
        return 'Gagal mendapatkan data cuaca.';
    }
}
// handle kalender akademik
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

module.exports = { handleMessage, sendMotivationWithSticker };
