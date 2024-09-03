# Bot Pengingat Akademik WhatsApp

## Gambaran Umum
Bot WhatsApp ini dirancang untuk membantu mahasiswa dan ketua kelas dalam mengelola jadwal akademik, tugas, dan pengingat secara efektif. Bot ini secara otomatis mengirimkan pengingat untuk kelas yang akan datang, tenggat waktu tugas, waktu sholat, dan kutipan motivasi. Selain itu, bot ini dapat menangani berbagai tugas seperti membuat pembagian kelompok dan mengirimkan stiker untuk membuat percakapan lebih menarik.

## Fitur

### 1. Pengingat Jadwal Kelas
Bot secara otomatis mengirimkan pengingat untuk kelas yang akan datang berdasarkan jadwal yang disediakan. Pengingat dikirimkan 6 jam sebelum kelas dimulai. Jika ada beberapa kelas yang dijadwalkan pada hari yang sama, bot akan mencantumkan semuanya dalam satu pesan pengingat.

### 2. Manajemen Tugas
- **Tambah Tugas:** Pengguna dapat menambahkan tugas dengan tanggal jatuh tempo.
- **Daftar Tugas:** Bot dapat menampilkan semua tugas yang belum selesai beserta tanggal jatuh temponya.
- **Hapus Tugas:** Pengguna dapat menghapus tugas dengan memberikan nomor tugasnya.
- **Pemeriksaan Tenggat Waktu Otomatis:** Bot memeriksa tugas yang sudah lewat tenggat waktu setiap menit dan menghapusnya dari daftar, serta memberi tahu grup.

### 3. Kutipan Motivasi dengan Stiker
Setiap 12 jam, bot mengirimkan kutipan motivasi acak yang dipersonalisasi dengan nama pengguna secara acak. Selain kutipan, bot juga mengirimkan stiker khusus untuk menjaga suasana obrolan tetap hidup.

### 4. Notifikasi Waktu Sholat
Bot mengambil waktu sholat harian untuk Jakarta dan mengirimkan notifikasi untuk mengingatkan grup ketika waktu sholat tiba.

### 5. Pembagian Kelompok Acak
Bot dapat membagi mahasiswa menjadi kelompok secara acak berdasarkan input pengguna. Pengguna memberikan jumlah peserta dan jumlah kelompok, dan bot akan mendistribusikan peserta sesuai dengan itu.

### 6. Jadwal Kelas yang Dapat Disesuaikan
Pengguna dapat memperbarui jadwal kelas bot dengan mengedit file `jadwal.js`. Jadwal disimpan sebagai array objek, masing-masing mewakili satu kelas dengan detail sebagai berikut:
- Mata Kuliah
- Hari
- Waktu
- Tanggal Mulai
- Tanggal Akhir

## Penggunaan

### Perintah
- **!add**: Memulai proses untuk menambahkan tugas baru.
- **!list**: Menampilkan semua tugas yang belum selesai.
- **!delete <nomor>**: Menghapus tugas berdasarkan nomornya.
- **!cuaca**: Mendapatkan cuaca saat ini untuk lokasi tertentu.
- **!paham**: Mengirim kutipan motivasi dari kak gem acak dengan stiker.
- **!kelompok**: Membuat pembagian kelompok secara acak.
- **!jadwal**: Menampilkan jadwal untuk hari ini.

### Kustomisasi
- **Stiker**: Anda dapat mengganti stiker dengan mengganti file `stiker.png` di direktori proyek.
- **Kutipan**: Edit file `kata.js` untuk menambah atau memodifikasi kutipan motivasi dan nama yang digunakan oleh bot.
- **Jadwal Kelas**: Perbarui file `jadwal.js` untuk mengubah jadwal kelas.

### Instalasi
1. Clone repository ini.
2. Instal dependensi yang diperlukan:
    ```bash
    npm install
    ```
3. Jalankan bot:
    ```bash
    node bot.js
    ```

### Konfigurasi
- **Autentikasi WhatsApp**: Bot menggunakan `whatsapp-web.js` dan `LocalAuth` untuk autentikasi. Pastikan untuk memindai kode QR yang muncul pada saat pertama kali dijalankan.
- **Jadwal**: Pengingat jadwal menggunakan zona waktu `Asia/Jakarta`. Sesuaikan jika Anda berada di zona waktu yang berbeda.

### Dependensi
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [moment-timezone](https://momentjs.com/timezone/)
- [sharp](https://sharp.pixelplumbing.com/)
- [axios](https://github.com/axios/axios)
- [chalk](https://github.com/chalk/chalk)

## Lisensi
Proyek ini dilisensikan di bawah Lisensi MIT.

## Penulis
Dibuat oleh Muchtar Ali Anwar. Jangan ragu untuk menghubungi untuk saran atau perbaikan.
