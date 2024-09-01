const axios = require('axios');
const cheerio = require('cheerio');

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

module.exports = { getAcademicCalendar };
