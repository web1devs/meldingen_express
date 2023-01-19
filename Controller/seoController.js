const mysql = require('../connection')

module.exports.seoData = (req, res)=>{
    const page = JSON.stringify(req.params.pageName);
    let sql = `select * from seo_data_tables where page =${page}`;
    mysql.query(sql,(error,results,fields)=>{
        if(!error){
            return res.status(200).send(results[0])
        }
    })
}