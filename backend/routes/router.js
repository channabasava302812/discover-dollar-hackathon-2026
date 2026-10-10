const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditController');
const { Donor, Volunteer, Donation } = require('../models/Models');

router.get('/dashboard', ctrl.getDashboard);
router.post('/claims', ctrl.createClaim);
router.post('/clock', ctrl.updateClock);

// Helpers for UI
router.get('/donors', async (req, res) => res.json(await Donor.find()));
router.get('/volunteers', async (req, res) => res.json(await Volunteer.find()));
router.get('/donations', async (req, res) => res.json(await Donation.find()));
// New logic routes
router.post('/donations', ctrl.postDonation);
router.put('/claims/:claimId/collect', ctrl.collectClaim);
router.put('/donations/:dnId/cancel', ctrl.cancelDonation);
router.get('/logs', ctrl.getLogs);

module.exports = router;