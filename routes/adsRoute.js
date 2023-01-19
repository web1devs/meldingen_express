const express = require('express');
const router = express.Router();

const {getHomePageAds,meldingenDetailsAds,newsAds,newsDetails,partnerBlogs,blogs} = require('../Controller/adsController');

router.route('/home').get(getHomePageAds)
router.route('/meldingenDetails').get(meldingenDetailsAds);
router.route('/news').get(newsAds);
router.route('/newsDetails').get(newsDetails);
router.route('/partnerBlogs').get(partnerBlogs);
router.route('/blogs').get(blogs);

module.exports = router