const mysql = require('../connection');

module.exports.likeNews = (req, res)=>{
    const news_id = req.body.newsId;
    const user_id = req.user.id;
   
    let sql = 'INSERT INTO `fav_news`(`news_id`, `user_id`, `status`) VALUES (?,?,?)';
    mysql.query(sql,[news_id,user_id,1],(error,rows,fields)=>{
        if(!error){
            return res.send({
                status : 1
            })
        }else{
            console.log(error);
        }
    })
}

module.exports.unLikeNews = (req, res)=>{
    const news_id = req.body.newsId;
    const user_id = req.user.id;

    let sql = 'delete from `fav_news` where news_id = ? and user_id = ?';
    mysql.query(sql,[news_id,user_id],(error,rows,fields)=>{
        if(!error){
            return res.send({
                status : 0
            })
        }else{
            console.log(error);
        }
    })
}
module.exports.getStatus = (req, res)=>{
    const news_id = req.params.news;
    const user_id = req.params.user;

    let sql = 'select status from fav_news where news_id = ? and user_id = ?';
    mysql.query(sql,[news_id,user_id],(error, rows, fields)=>{
        if(!error){
           if(rows.length === 0){
            return res.send({status : 0})
           }else{
            return res.send(rows[0])
           }
        }
    })

   
}

module.exports.getMyNews = (req, res)=>{
    const user_id = req.user.id;
    let sql = 'select a.id,a.title,a.pubdate,a.state,a.city,a.slug from news a left join fav_news b on a.id = b.news_id where b.user_id = ?';
    mysql.query(sql,[user_id],(error, rows, fields)=>{
        if(!error){
            return res.send(rows)
        }
    })
}

