const express = require('express');
const router = express.Router();
const { getUserDetails, updateProfile } = require('../Controller/profileController');
const auth = require('../middlewares/authorization');


router.route('/get-profile')
    .get(auth, getUserDetails)

router.route('/update-profile')
    .post(auth, updateProfile)

module.exports = router;