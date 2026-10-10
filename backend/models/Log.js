const mongoose = require('mongoose');
const logSchema = new mongoose.Schema({
    event: String,
    details: String,
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Log', logSchema);