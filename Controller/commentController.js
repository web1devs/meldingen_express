const mysql = require('../connection');

module.exports.createComment = async (req, res) => {
    const userId = req.user.id;
    const newsId = req.body.news_id;
    const comments = req.body.comments;
    const sql = 'insert into news_comments (news_id,user_id,comments,posted_at,status)values(?,?,?,?,?)';
    const d = new Date();
    const insertComments = mysql.query(sql,
        [newsId, userId, comments, d,0],
        (error, result, fields) => {
            if(!error){
                return res.status(201).send('Comments created successfully')
            }else{
               console.log(error);
            }
        })
}

module.exports.commentsCount = async (req, res)=>{
    const news_id = req.params.id
    let sql = `SELECT count(id) as total FROM news_comments where news_id = ? and status = 1;`
    const data = await totalCommentsCount(sql,news_id);
    return res.send(data[0]);
}

const totalCommentsCount = (sql,news_id) =>{
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql,[news_id],(error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

module.exports.getNewsComments = async(req, res)=>{
     const newsId = req.params.id;
     const PageNumber = req.params.page == 0 ? 0 : req.params.page;
     const limit = 2;
     const offset = PageNumber * limit;
     const sql = `SELECT a.news_id,a.user_id,a.comments,a.posted_at,b.name FROM news_comments a LEFT JOIN users b ON a.user_id = b.id where a.news_id=? and a.status=? limit ${offset},${limit}`;
     mysql.query(sql,[newsId,1],(error,result,fields)=>{
        return res.status(200).json(result)
     })
}