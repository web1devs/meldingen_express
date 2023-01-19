const express = require('express');
const router = express.Router();

const {getPrivacy,getCookie} = require('../Controller/privacyController')

router.route('/privacy').get(getPrivacy);
router.route('/cookie').get(getCookie);

module.exports = router;