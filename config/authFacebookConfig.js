const passport = require('passport');
const mysql = require('../connection');
const facebookStrategy = require('passport-facebook');
const { sign } = require('jsonwebtoken');

const strategy = new facebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/redirect",
    profileFields: ['id', 'displayName', 'photos', 'email']
}, async (accessToken, refreshToken, profile, cb) => {

    const email = JSON.stringify(profile._json.email);
    const name = JSON.stringify(profile._json.name);
    const image = JSON.stringify(profile._json.picture.data.url);
    const user = await findUser(email);

    if (user.length === 0) {
        let sql = `insert into users (name,email,role,profile_pic,status) values (${name},${email},0,${image},1)`;
        mysql.query(sql, async (error, results, fields) => {
            if (!error) {
                let data = await findUser(email)
                const jwt = sign({
                    email: data[0].email,
                    name: data[0].name,
                    id: data[0].id,
                }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" })
                const response = {
                    email: data[0].email,
                    name: data[0].name,
                    id: data[0].id,
                    token: jwt
                }
                cb(null, response)

            } else {
                console.log(error);
            }
        })
    } else {
        const jwt = sign({
            email: user[0].email,
            id: user[0].id,
            name: user[0].name,
        }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" })
        const response = {
            email: user[0].email,
            id: user[0].id,
            name: user[0].name,
            token: jwt
        }
        cb(null, response)
    }




    cb(null, profile)
});

const findUser = (email) => {
    return new Promise((resolve, reject) => {
        let sql = `select * from users where email= ${email}`;
        mysql.query(sql, (email), (error, rows, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(rows))))
        })
    })
}

passport.use(strategy)