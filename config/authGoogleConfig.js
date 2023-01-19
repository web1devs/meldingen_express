const passport = require('passport');
const mysql = require('../connection');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const { sign } = require('jsonwebtoken');

const strategy = new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/redirect"

}, async (accessToken, refreshToken, profile, cb) => {
    const googleEmail = JSON.stringify(profile._json.email);
    const user = await findUser(googleEmail);
    const name = JSON.stringify(profile._json.name);
    const profile_pic = JSON.stringify(profile._json.picture);

    if (user.length === 0) {
        let sql = `insert into users (name,email,role,profile_pic,status) values (${name},${googleEmail},0,${profile_pic},1)`;
        mysql.query(sql, async (error, results, fields) => {
            if (!error) {
                let data = await findUser(googleEmail)
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

passport.use(strategy);