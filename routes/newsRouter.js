const express = require('express');
const { getAllNews, newsDetails, recentNews, filteredNews, getOtherNews, getMoreOtherNews,recentMeldingens,fetchRegios } = require('../Controller/newsController');
const router = express.Router();



router.route('/')
    .get(getAllNews)
router.route('/:id')
    .get(newsDetails)

router.route('/recent/news')
    .get(recentNews)

router.route('/other/news')
    .get(getOtherNews)

router.route('/getMoreOtherNews/:page')
    .get(getMoreOtherNews)


router.route('/filter-news/:region/:page')
    .get(filteredNews)

    router.route('/fetch/regios')
    .get(fetchRegios)

    router.route('/recent/meldingen')
    .get(recentMeldingens)



module.exports = router;