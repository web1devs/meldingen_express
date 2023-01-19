const express = require('express');
const { fetchPartnerBlogs, partnerBlogDetails,recentPartnerBlogs } = require('../Controller/partnerBlogsController')
const router = express.Router();

router.route('/')
    .get(fetchPartnerBlogs);

    router.route('/recent-partner-blogs/:id')
        .get(recentPartnerBlogs)

router.route('/:id')
    .get(partnerBlogDetails)

module.exports = router;