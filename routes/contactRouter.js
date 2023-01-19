const express = require('express');
const { sendContactEmail } = require('../Controller/contactController')
const router = express.Router();


router.route('/')
    .post(sendContactEmail)

module.exports = router;