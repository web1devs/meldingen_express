const mysql = require('../connection');
const NodeCache = require("node-cache");
const myCache = new NodeCache();

module.exports.getPrivacy = async (req, res) => {

    let privacy_sql = 'select title,content from privacy';
    let seo_sql = 'select title,seo_keywords,seo_meta,structured_data from seo_data_tables where page = "Privacybeleid"';
    const data = await getResult(privacy_sql);
    const seo = await seo_data(seo_sql);
    return res.send({
        details : data[0],
        seo : seo[0]
    })

   
}

module.exports.getCookie = async (req,res)=>{
    let cookie_sql = 'select title,content from cookie';
    let seo_sql = 'select title,seo_keywords,seo_meta,structured_data from seo_data_tables where page = "Cookiebeleid"';
    const data = await getResult(cookie_sql);
    const seo = await seo_data(seo_sql);
    return res.send({
        details : data[0],
        seo : seo[0]
    })
}
const getResult = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

const seo_data = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

