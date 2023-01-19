const mysql = require('../connection');

module.exports.getHomePageAds = async (req, res) => {
    const sql1 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=1 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1';
    const sql2 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=2 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1;';
    const sql3 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=3 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1;';


    mysql.query(sql1, (error, result, fields) => {
        if (!error) {
            mysql.query(sql2, (error, rows, fields) => {
                if (!error) {
                    mysql.query(sql3, (error, data, fields) => {
                        return res.send({
                            ad1: result,
                            ad2: rows,
                            ad3: data
                        })
                    })
                }
            })
        }
    })

}

module.exports.meldingenDetailsAds = async (req, res) => {
    const sql1 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=4 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1';
    const sql2 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=5 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1;';
    const sql3 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=6 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1;';


    const ad1 = await ads(sql1);
    const ad2 = await ads(sql2);
    const ad3 = await ads(sql3);


    return res.send({
        ad1: ad1,
        ad2: ad2,
        ad3: ad3,

    })
}
module.exports.newsAds = async (req, res) => {
    const sql1 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=7 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1';
    const sql2 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=8 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1;';
    const sql3 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=9 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1;';

    const ad1 = await ads(sql1);
    const ad2 = await ads(sql2);
    const ad3 = await ads(sql3);

    return res.send({
        ad1: ad1,
        ad2: ad2,
        ad3: ad3,
    })
}

module.exports.newsDetails = async (req, res) => {
    const sql1 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=10 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1';
    const sql2 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=11 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1;';
    const sql3 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=12 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1;';

    const ad1 = await ads(sql1);
    const ad2 = await ads(sql2);
    const ad3 = await ads(sql3);

    return res.send({
        ad1: ad1,
        ad2: ad2,
        ad3: ad3,
    })
}
module.exports.partnerBlogs = async (req, res) => {
    const sql1 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=14 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1';

    const ad1 = await ads(sql1);


    return res.send({
        ad1: ad1,

    })
}

module.exports.blogs = async (req, res)=>{
    const sql1 = 'SELECT content FROM `ads` WHERE content<>"" and status=1 and section=13 and DATE_FORMAT(curtime(), "%H:%i")>=from_hr and DATE_FORMAT(curtime(), "%H:%i")<=to_hr limit 1';
    const ad1 = await ads(sql1);

    return res.send({
        ad1: ad1,

    })
}

const ads = (from) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(from, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
};