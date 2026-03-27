const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors()); // Mengizinkan frontend mengambil data
app.use(express.json()); // Agar bisa membaca data JSON yang dikirim frontend

// Endpoint 1: Mengambil semua data (GET)
app.get('/api/data', (req, res) => {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json({}); // Jika belum ada data, kirim objek kosong
        }
    } catch (error) {
        res.status(500).json({ message: "Gagal membaca database" });
    }
});

// Endpoint 2: Menyimpan data (POST)
app.post('/api/data', (req, res) => {
    try {
        const newData = req.body;
        // Tulis data ke file database.json
        fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2));
        res.status(200).json({ message: "Data berhasil disimpan ke Server!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menyimpan data" });
    }
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di http://localhost:${PORT}`);
});