const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const router = require('./routes/router'); // Make sure this path is correct

const app = express();
app.use(cors()); // CRITICAL for the frontend to talk to backend
app.use(express.json());

const DB_URL = 'mongodb+srv://bchanna2004_db_user:Shs1xy0aAYjgEhrN@vendorinvoicedashboard.55isqb9.mongodb.net/surplus_link';

mongoose.connect(DB_URL)
    .then(() => console.log("✅ Database Connected"))
    .catch(err => console.error("❌ DB Connection Error:", err));

app.use('/api', router); // This mounts your dashboard routes

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend Server running on port ${PORT}`);
});