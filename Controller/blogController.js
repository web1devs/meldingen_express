const mysql = require('../connection');

module.exports.getBlogs = async(req, res)=>{
    const sql = "select * from blogs where status = 'published'"
   const data = await blogs(sql);
   return res.send(data)
}
const blogs = (sql) =>{
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql,(error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

module.exports.blogDetails = async(req, res)=>{
    const sql = "select * from blogs where id = ? and status=?";
    const id = req.params.id;
    const data = await details(sql,id);
    return res.send(data[0]);
}

const details = (sql,id) =>{
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql,[id,'published'],(error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

module.exports.recentBlogs = async (req, res)=>{
    const id = req.params.id
    const sql = 'SELECT * FROM `blogs` where status = "published" and id <> ?  ORDER BY `created_at` DESC limit 5';
    const data = await recent(sql,id);
    return res.send(data)
}

const recent = (sql,id) =>{
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql,[id],(error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

module.exports.category = async (req,res)=>{
    const sql  = 'select * from blog_categories';
   const data = await category(sql);
   return res.send(data);
}

const category = (sql) =>{
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql,(error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

module.exports.filteredBlogs = async (req, res)=>{
    const id = req.params.id;
    const sql = "SELECT * FROM `blogs` WHERE FIND_IN_SET(?,`categories`) and status = ?";
    const data = await filter(sql,id);
    return res.send(data)
}

const filter = (sql,id) =>{
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql,[id,'published'],(error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}
