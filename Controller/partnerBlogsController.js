const mysql = require('../connection');

module.exports.fetchPartnerBlogs = async (req, res) => {
    const sql = 'SELECT id,blog_title,description,content,images,slug,seo_keywords,seo_meta,seo_meta,status,created_at FROM `partner_blogs` WHERE`status`= "published"';
   const data = await partnerBlog(sql);
   return res.send(data)
}

const partnerBlog = (sql)=>{
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}
module.exports.partnerBlogDetails = async(req, res)=>{
    const id = req.params.id;
    const sql = 'SELECT id,blog_title,description,content,images,slug,seo_keywords,seo_meta,seo_meta,status,created_at FROM `partner_blogs` WHERE`status`= "published" and id =?';
    const data = await details(sql,id);
    return res.send(data[0])
};
const details = (sql,id)=>{
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql,[id],(error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

module.exports.recentPartnerBlogs = async (req, res)=>{
    const id = req.params.id
    const sql = 'SELECT id,blog_title,description,content,images,slug,seo_keywords,seo_meta,seo_meta,status,created_at FROM `partner_blogs` where status = "published" and id <> ? ORDER BY `created_at` DESC limit 5';
   const data = await recent(sql,id);
   return res.send(data)
}

const recent = (sql,id)=>{
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql,[id],(error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}