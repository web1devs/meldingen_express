const bcrypt = require('bcrypt');
const mySqlConnection = require('../connection')
const { sign } = require('jsonwebtoken');
const { stringify } = require('flatted');
const e = require('cors');
const crypto = require('crypto');
const nodeMailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
var moment = require('moment')

module.exports.signUp = async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const findUser = mySqlConnection.query('select * from users where email = ? LIMIT 1', [email], (error, rows, fields) => {
    if (rows.length === 1) {
      return res.status(400).send('user already exists')
    } else {

      mySqlConnection.query('INSERT into users (name,email,password) values(?,?,?)', [name, email, hashPassword], (error, rows, fields) => {
        if (!error) {
          return res.send("user created successfully")
        }
      })
    }
  })


}

module.exports.signIn = (req, res) => {
  let rows = []
  const email = req.body.email;
  const password = req.body.password;
  const findUser = mySqlConnection.query('select * from users where email = ?', [email], (error, row, fields) => {
    if (row.length === 0) {
      return res.status(404).send('user not found in database');
    } else {
      if (row[0].password !== null) {
        let passwordCompare = bcrypt.compareSync(req.body.password, row[0].password);
        if (passwordCompare) {
          const jwt = sign({
            id: row[0].id,
            name: row[0].name,
            email: row[0].email,

          }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });

          return res.send({
            access_token: jwt
          });
        } else {
          return res.status(400).send("incorrect password")
        }
      } else {
        return res.status(400).send("please Check your credentials")
      };

    }







  })
}

module.exports.userInfo = (req, res) => {
  const id = req.params.id;
  let sql = 'select profile_pic,name from users where id =?';
  const data = mySqlConnection.query(sql, (id), (error, result, fields) => {
    if (!error) {
      return res.send(result);
    } else {
      console.log(error);
    }
  })
}

module.exports.updateProfile = async (req, res) => {
  const name = JSON.stringify(req.body.name);
  const email = JSON.stringify(req.body.email);
  const password = req.body.password;
  const captcha = req.body.captcha === true ? 1 : 0;


  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  let sql = `update users set name = ${name},password = ${JSON.stringify(hashPassword)},captcha = ${captcha} where email = ${email}`;

  mySqlConnection.query(sql, (error, result, fields) => {
    if (!error) {
      const jwt = sign({
        id: req.body.id,
        name: req.body.name,
        email: req.body.email,
      }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });

      return res.send({
        message: "Profile updated successfully",
        token: jwt,
      });
    } else {
      console.log(error);
    }
  })

}

module.exports.fetchUserComments = async (req, res) => {
  const id = req.params.id;
  let sql = `select a.*,b.title,b.description from news_comments a left join news b on a.news_id = b.id where a.user_id = ${id}`;
  mySqlConnection.query(sql, (error, results, fields) => {
    if (!error) {
      return res.status(200).send(results);
    } else {
      console.log(error);
    }
  })
}
module.exports.deleteComments = async (req, res) => {
  const id = req.params.id;
  const user_id = req.params.user_id;
  let sql = `delete from news_comments where id = ${id} and user_id = ${user_id}`;
  mySqlConnection.query(sql, (error, results, fields) => {
    if (!error) {
      return res.status(200).send('Comments Deleted Successfully')
    } else {
      console.log(error);
    };
  })
}

module.exports.forgotPassword = (req, res) => {
  const email = req.body.email;
  
  const token = sign({
    email: email,
  }, process.env.JWT_SECRET_KEY, { expiresIn: "300s" });

  let findUserSql = 'select email from users where email = ?';
  mySqlConnection.query(findUserSql, [req.body.email], (error, rows, fields) => {
    if (rows.length == 0) {
      return res.send("email doesn't exist in our records")
    } else {
      //step 1
      const transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'riadkhan2367@gmail.com',
          pass: 'khkjbqbmnflqlnfg'
        }
      })

      const handlebarOptions = {
        viewEngine: {
          extName: ".hbs",
          partialDir: path.join(__basedir + '/views'),
          defaultLayout: false,
        },
        viewPath: path.join(__basedir + '/views'),
        extName: '.hbs',
      }

      const url = `http://localhost:3000/reset-password?token=${token}&email=${email}`;



      transporter.use('compile', hbs(handlebarOptions));
      const mailOptions = {
        from: 'riadkhan2367@gmail.com',
        to: 'rdxriad236@gmail.com',
        subject: 'password reset email',
        text: 'Hello dear here is your password reset email for meldingen.nl',
        template: 'reset',
        context: {

          email: email,
          url: url,
        }
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {

          let insertSql = `insert into password_resets (email,token) values (?,?)`

          mySqlConnection.query(insertSql, [email, token], (error, result, fields) => {
            if (!error) {
              return res.send('password reset email sent')
            } else {
              console.log(error);
            }
          })

        }
      })

    }
  })
}


module.exports.getDashboardCount = async (req, res) => {
  let fav_sql = `SELECT count(id) as total from fav_news where user_id = ${req.params.id}`;
  let reacties_sql = `SELECT count(id) as total from news_comments where user_id = ${req.params.id}`;


  mySqlConnection.query(fav_sql, (error, rows, fields) => {
    if (!error) {
      mySqlConnection.query(reacties_sql, (errors, results, fields) => {
        if (errors) {
          console.log(errors);
        } else {
          return res.send({
            fav_news: rows[0],
            comments: results[0],
          })
        }
      })
    }
  })


}

module.exports.reset = async(req, res)=>{
  let token = req.body.token;
  let email = req.body.email;
  const password = req.body.password;
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  let sql = `update users set password = ${JSON.stringify(hashPassword)} where email = ${JSON.stringify(email)}`;
  mySqlConnection.query(sql,(error, rows, fields)=>{
      if(!error){
        mySqlConnection.query(`delete from password_resets where email = ${JSON.stringify(email)}`,(error, result,fileds)=>{
            return res.send('password changed successfully')
        })
      }
  })


}