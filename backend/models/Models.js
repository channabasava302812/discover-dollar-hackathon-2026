const mongoose = require('mongoose');

// 1. System Config (For the Simulated Clock)
const systemSchema = new mongoose.Schema({
  currentClock: { type: Date, required: true }
});

// 2. Donor
const donorSchema = new mongoose.Schema({
  id: String,
  name: String,
  zone: String
});

// 3. Volunteer
const volunteerSchema = new mongoose.Schema({
  id: String,
  name: String,
  capacity_kg: Number,
  zones: [String]
});

// 4. Donation
const donationSchema = new mongoose.Schema({
  id: String,
  donor_id: String,
  description: String,
  quantity_kg: Number,
  pickup_from: Date,
  pickup_until: Date,
  isCancelled: { type: Boolean, default: false }
});

// 5. Claim
const claimSchema = new mongoose.Schema({
  donation_id: String,
  volunteer_id: String,
  kg: Number,
  pickup_time: Date,
  status: { 
    type: String, 
    enum: ['ACTIVE', 'COLLECTED', 'CANCELLED', 'MISSED'], 
    default: 'ACTIVE' 
  }
});

module.exports = {
  System: mongoose.model('System', systemSchema),
  Donor: mongoose.model('Donor', donorSchema),
  Volunteer: mongoose.model('Volunteer', volunteerSchema),
  Donation: mongoose.model('Donation', donationSchema),
  Claim: mongoose.model('Claim', claimSchema)
};