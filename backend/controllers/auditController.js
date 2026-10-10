const mongoose = require('mongoose');
const { System, Donation, Claim, Volunteer, Donor } = require('../models/Models');
const Log = require('../models/Log');

exports.getDashboard = async (req, res) => {
  try {
    const sys = await System.findOne();
    const now = sys.currentClock;
    const donations = await Donation.find({ isCancelled: false });
    const claims = await Claim.find();
    const donors = await Donor.find();
    const volunteers = await Volunteer.find();

    let metrics = { listed: 0, collected: 0, missed: 0, wasted: 0, inProgress: 0, stillOpen: 0 };
    
    const donorStats = donors.map(d => ({ name: d.name, collected: 0 }));
    const volunteerStats = volunteers.map(v => ({ name: v.name, collected: 0, missed: 0 }));

    for (const d of donations) {
      metrics.listed += d.quantity_kg;
      const dClaims = claims.filter(c => c.donation_id === d.id && c.status !== 'CANCELLED');
      const totalClaimedKg = dClaims.reduce((sum, c) => sum + c.kg, 0);
      const remaining = d.quantity_kg - totalClaimedKg;
      const isExpired = now > d.pickup_until;

      dClaims.forEach(c => {
        if (c.status === 'COLLECTED') {
          metrics.collected += c.kg;
          const dStat = donorStats.find(ds => ds.name === donors.find(donor => donor.id === d.donor_id)?.name);
          if (dStat) dStat.collected += c.kg;
          const vStat = volunteerStats.find(vs => vs.name === volunteers.find(vol => vol.id === c.volunteer_id)?.name);
          if (vStat) vStat.collected += c.kg;
        }
        if (c.status === 'MISSED') {
          metrics.missed += c.kg;
          const vStat = volunteerStats.find(vs => vs.name === volunteers.find(vol => vol.id === c.volunteer_id)?.name);
          if (vStat) vStat.missed += 1;
        }
        if (c.status === 'ACTIVE') metrics.inProgress += c.kg;
      });

      if (isExpired) metrics.wasted += remaining;
      else metrics.stillOpen += remaining;
    }

    const sumCheck = metrics.listed === (metrics.collected + metrics.missed + metrics.wasted + metrics.inProgress + metrics.stillOpen);
    res.json({ ...metrics, donorStats, volunteerStats, sumCheck, clock: now });
  } catch (err) { res.status(500).send(err.message); }
};

exports.createClaim = async (req, res) => {
  try {
    const { volunteer_id, donation_id, kg, pickup_time } = req.body;
    const sys = await System.findOne();
    const now = sys.currentClock;
    const T = new Date(pickup_time);

    const donation = await Donation.findOne({ id: donation_id });
    const volunteer = await Volunteer.findOne({ id: volunteer_id });
    const existingClaims = await Claim.find({ donation_id, status: { $ne: 'CANCELLED' } });
    const vOtherClaims = await Claim.find({ volunteer_id, status: { $in: ['ACTIVE', 'COLLECTED'] } });

    const errors = [];
    if (!Number.isInteger(Number(kg)) || kg < 1) errors.push("Quantity must be a whole number (at least 1).");

    const totalClaimedKg = existingClaims.reduce((s, c) => s + c.kg, 0);
    const remaining = donation.quantity_kg - totalClaimedKg;

    if (donation.isCancelled || now > donation.pickup_until) errors.push("The donation is not CANCELLED or EXPIRED.");
    if (kg > volunteer.capacity_kg) errors.push(`kg is at most V's capacity (${volunteer.capacity_kg}kg).`);
    if (kg > remaining) errors.push(`kg is at most the donation's remaining kg (${remaining}kg).`);
    
    const donor = await Donor.findOne({ id: donation.donor_id });
    if (!volunteer.zones.includes(donor.zone)) errors.push("The donation's zone is one of V's zones.");
    if (T < new Date(donation.pickup_from) || T > new Date(donation.pickup_until)) errors.push("T is between pickup_from and pickup_until.");
    if (T < now) errors.push("T is not before now.");
    
    const isTooClose = vOtherClaims.some(c => Math.abs(new Date(c.pickup_time) - T) < 3600000);
    if (isTooClose) errors.push("T is at least 60 minutes from every other claim of V.");

    if (errors.length > 0) return res.status(400).json({ errors });

    const newClaim = new Claim({ donation_id, volunteer_id, kg, pickup_time: T, status: 'ACTIVE' });
    await newClaim.save();

    // AUDIT LOG: Claim Created
    await new Log({ 
      event: "CLAIM_CREATED", 
      details: `Volunteer ${volunteer.name} claimed ${kg}kg from ${donation.description}` 
    }).save();

    res.json(newClaim);
  } catch (err) { res.status(500).send(err.message); }
};

exports.updateClock = async (req, res) => {
  try {
    const { newTime } = req.body;
    const sys = await System.findOne();
    const nextTime = new Date(newTime);
    if (nextTime < sys.currentClock) return res.status(400).send("Clock cannot go backward.");
    
    sys.currentClock = nextTime;
    await sys.save();

    // AUDIT LOG: Clock Jumped
    await new Log({ event: "CLOCK_JUMP", details: `System time moved to ${newTime}` }).save();

    const activeClaims = await Claim.find({ status: 'ACTIVE' });
    for (const c of activeClaims) {
      const d = await Donation.findOne({ id: c.donation_id });
      if (nextTime > d.pickup_until) {
          c.status = 'MISSED';
          await c.save();
          await new Log({ event: "CLAIM_MISSED", details: `Claim for ${d.description} automatically marked MISSED due to clock jump.` }).save();
      }
    }
    res.json(sys);
  } catch (err) { res.status(500).send(err.message); }
};

exports.postDonation = async (req, res) => {
  try {
    const { donor_id, description, quantity_kg, pickup_from, pickup_until } = req.body;
    const sys = await System.findOne();
    const from = new Date(pickup_from);
    const until = new Date(pickup_until);

    if (from >= until) return res.status(400).send("Error: Pickup FROM must be before UNTIL.");
    if (until < sys.currentClock) return res.status(400).send("Error: Pickup window cannot be in the past.");

    const newDn = new Donation({
      id: `DN-${Date.now()}`,
      donor_id, description, quantity_kg,
      pickup_from: from, pickup_until: until
    });
    
    await newDn.save();
    await new Log({ event: "DONATION_POSTED", details: `New surplus: ${description} (${quantity_kg}kg) available until ${until.toLocaleTimeString()}` }).save();
    res.json(newDn);
  } catch (err) { res.status(500).send(err.message); }
};

exports.collectClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const sys = await System.findOne();
    const claim = await Claim.findById(claimId);
    const dn = await Donation.findOne({ id: claim.donation_id });

    if (sys.currentClock < dn.pickup_from || sys.currentClock > dn.pickup_until) {
      return res.status(400).send("Error: You can only collect during the pickup window.");
    }

    claim.status = 'COLLECTED';
    await claim.save();

    // AUDIT LOG: Food Collected
    await new Log({ event: "COLLECTION", details: `Inventory successfully collected for Donation ID: ${dn.id}` }).save();
    
    res.json(claim);
  } catch (err) { res.status(500).send(err.message); }
};

exports.cancelDonation = async (req, res) => {
  try {
    const { dnId } = req.params;
    const activeClaims = await Claim.find({ donation_id: dnId, status: { $in: ['ACTIVE', 'COLLECTED'] } });

    if (activeClaims.length > 0) {
      return res.status(400).send("Error: Cannot cancel. Active claims already exist.");
    }

    await Donation.findOneAndUpdate({ id: dnId }, { isCancelled: true });
    await new Log({ event: "DONATION_CANCELLED", details: `Inventory record ${dnId} was withdrawn by the donor.` }).save();
    res.send("Cancelled");
  } catch (err) { res.status(500).send(err.message); }
};

// NEW: FETCH ACTIVITY LOGS
exports.getLogs = async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(10);
    res.json(logs);
  } catch (err) { res.status(500).send(err.message); }
};