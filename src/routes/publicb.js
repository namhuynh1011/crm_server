'use strict';

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicb');

// Public lookup: GET /api/publicb/contracts/lookup
router.get('/contracts/lookup', publicController.lookupContract);

module.exports = router;