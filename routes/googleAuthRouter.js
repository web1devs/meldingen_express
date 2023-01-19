const router = require('express').Router();
const passport  = require('passport');
require('../config/authGoogleConfig');

router.route('/')
    .get(passport.authenticate('google', { scope: ['profile','email'] }));

router.route('/redirect').get( passport.authenticate('google', { failureRedirect: '/login',session:false }),(req, res)=> {
    if(req.user.status === 400){
        res.redirect('http://localhost:8080/login?error=' + req.user.status);
    }else{
        res.redirect('http://localhost:8080/login?token=' + req.user.token);
    }
});

module.exports = router;