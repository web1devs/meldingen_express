const express = require('express');
const router = express.Router();
const { getBlogs, blogDetails, recentBlogs,category,filteredBlogs } = require('../Controller/blogController');

router.route('/')
    .get(getBlogs);

router.route('/recent-blogs/:id')
    .get(recentBlogs)

    router.route('/filtered-blogs/:id')
            .get(filteredBlogs)

router.route('/category')
    .get(category)

router.route('/:id')
    .get(blogDetails)

module.exports = router;