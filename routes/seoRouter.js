const router = require('express').Router();
const {seoData} = require('../Controller/seoController')

router.route('/:pageName').get(seoData)

module.exports = router;