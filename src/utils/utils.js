const moment = require('moment-timezone');

function parseDate(dateString) {
    const dateFormat = 'DD-MM-YYYY HH:mm';
    const timezone = 'Asia/Jakarta';
    const date = moment.tz(dateString, dateFormat, timezone);
    return date.isValid() ? date : null;
}

function translateWeatherCondition(condition) {
    const translations = {
        'Sunny': 'Cerah',
        'Clear': 'Cerah',
        'Partly Cloudy': 'Sebagian berawan',
        'Partly cloudy': 'Sebagian berawan',
        'Cloudy': 'Berawan',
        'Overcast': 'Mendung',
        'Mist': 'Berkabut',
        'Patchy rain nearby': 'Hujan merata disekitar',
        'Patchy rain possible': 'Hujan lokal mungkin terjadi',
        'Patchy snow possible': 'Salju lokal mungkin terjadi',
        'Patchy sleet possible': 'Hujan es lokal mungkin terjadi',
        'Patchy freezing drizzle possible': 'Gerimis beku lokal mungkin terjadi',
        'Thundery outbreaks possible': 'Badai petir mungkin terjadi',
        'Blowing snow': 'Salju yang tertiup angin',
        'Blizzard': 'Badai salju',
        'Fog': 'Kabut',
        'Freezing fog': 'Kabut beku',
        'Patchy light drizzle': 'Gerimis ringan lokal',
        'Light drizzle': 'Gerimis ringan',
        'Freezing drizzle': 'Gerimis beku',
        'Heavy freezing drizzle': 'Gerimis beku berat',
        'Patchy light rain': 'Hujan ringan lokal',
        'Light rain': 'Hujan ringan',
        'Moderate rain at times': 'Hujan sedang kadang-kadang',
        'Moderate rain': 'Hujan sedang',
        'Heavy rain at times': 'Hujan lebat kadang-kadang',
        'Heavy rain': 'Hujan lebat',
        'Light freezing rain': 'Hujan beku ringan',
        'Moderate or heavy freezing rain': 'Hujan beku sedang atau berat',
        'Light sleet': 'Hujan es ringan',
        'Moderate or heavy sleet': 'Hujan es sedang atau berat',
        'Patchy light snow': 'Salju ringan lokal',
        'Light snow': 'Salju ringan',
        'Patchy moderate snow': 'Salju sedang lokal',
        'Moderate snow': 'Salju sedang',
        'Patchy heavy snow': 'Salju lebat lokal',
        'Heavy snow': 'Salju lebat',
        'Ice pellets': 'Butiran es',
        'Light rain shower': 'Hujan ringan sesaat',
        'Moderate or heavy rain shower': 'Hujan sedang atau lebat sesaat',
        'Torrential rain shower': 'Hujan deras sesaat',
        'Light sleet showers': 'Hujan es ringan sesaat',
        'Moderate or heavy sleet showers': 'Hujan es sedang atau lebat sesaat',
        'Light snow showers': 'Salju ringan sesaat',
        'Moderate or heavy snow showers': 'Salju sedang atau lebat sesaat',
        'Light showers of ice pellets': 'Butiran es ringan sesaat',
        'Moderate or heavy showers of ice pellets': 'Butiran es sedang atau lebat sesaat',
        'Patchy light rain with thunder': 'Hujan ringan lokal dengan petir',
        'Moderate or heavy rain with thunder': 'Hujan sedang atau lebat dengan petir',
        'Patchy light snow with thunder': 'Salju ringan lokal dengan petir',
        'Moderate or heavy snow with thunder': 'Salju sedang atau lebat dengan petir'
    };

    if (!translations[condition]) {
        console.warn(`Kondisi cuaca "${condition}" tidak dikenali. Menggunakan teks asli.`);
    }

    return translations[condition] || condition;
}

module.exports = { 
    parseDate, 
    translateWeatherCondition 
};
