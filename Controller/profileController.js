const mysql = require('../connection');
const bcrypt = require('bcrypt');

module.exports.getUserDetails = async (req, res) => {
    const email = req.user.email;
    const sql = 'Select id,name,email from users where email=?'
    const findUser = mysql.query(sql, [email], (error, result, fields) => {
        return res.status(200).json({
            id: result[0].id,
            name: result[0].name,
            email: result[0].email
        })
    })
}
module.exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const name = req.body.name;
    const newPassword = req.body.password;
    const oldPassword = req.body.old_password;
    const comparePassword = mysql.query('select password from users where id=?',
        [userId], (error, rows, fields) => {
            let compare = bcrypt.compareSync(oldPassword, rows[0].password)
            if (compare) {
                const sql = 'update users set name=?,password=? where id=?'
                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(newPassword, salt)
                const update = mysql.query(sql, [name, hashPassword, userId],
                    (error, result, fields) => {
                        if (error) {
                            console.log(error);
                        } else {
                            return res.status(201).send('Profile updated successfully');
                        }
                    })
            } else {
                return res.send('Incorrect Old Password')
            }
        })


}