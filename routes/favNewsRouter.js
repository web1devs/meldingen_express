const express = require('express');
const router = express.Router();


const{likeNews,unLikeNews,getStatus,getMyNews} = require('../Controller/favNewsController');
const authorization = require('../middlewares/authorization');

router.route('/like').post(authorization,likeNews)
router.route('/unLike').post(authorization,unLikeNews)
router.route('/checkStatus/:news/:user').get(getStatus)
router.route('/myNews/:user').get(authorization,getMyNews)


module.exports = router;