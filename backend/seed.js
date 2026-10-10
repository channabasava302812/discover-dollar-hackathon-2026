const mongoose = require('mongoose');
const { System, Donor, Volunteer, Donation } = require('./models/Models');
const fs = require('fs');

const DB_URL = 'mongodb+srv://bchanna2004_db_user:Shs1xy0aAYjgEhrN@vendorinvoicedashboard.55isqb9.mongodb.net/surplus_link';

mongoose.connect(DB_URL);

const runSeed = async () => {
  const data = JSON.parse(fs.readFileSync('./seed.json', 'utf-8'));

  await System.deleteMany({});
  await Donor.deleteMany({});
  await Volunteer.deleteMany({});
  await Donation.deleteMany({});

  await new System({ currentClock: new Date(data.clock) }).save();
  await Donor.insertMany(data.donors);
  await Volunteer.insertMany(data.volunteers);
  await Donation.insertMany(data.donations.map(d => ({
    ...d,
    pickup_from: new Date(d.pickup_from),
    pickup_until: new Date(d.pickup_until)
  })));

  console.log("✅ Seed Data Loaded!");
  process.exit();
};

runSeed();