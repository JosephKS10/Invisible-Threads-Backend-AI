const express = require('express');
const { generateConclusion } = require('../controllers/conclusionController');
const router = express.Router();

router.post("/", generateConclusion);
module.exports = router;