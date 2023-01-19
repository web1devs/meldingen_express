const e = require('express');
const mySqlConnection = require('../connection')

//async meldingens
module.exports.fetchMeldingen = async (req, res) => {

    const PageNumber = req.params.page == 0 ? 0 : req.params.page;
    const limit = 10;
    const offset = PageNumber * limit;
    let sql = 'SELECT a.`id`,a.p2000,a.straat,a.straat_url,a.lat,a.lng,a.prio,a.timestamp,';
    sql += ' b.provincie,b.provincie_url,c.regio,c.regio_url,d.categorie,d.categorie_url,e.dienst,f.stad,f.stad_url';
    sql += ' from melding a LEFT JOIN provincie b ON a.provincie = b.id LEFT JOIN regio c ON a.regio = c.id LEFT JOIN categorie';
    sql += ' d ON a.categorie = d.id LEFT JOIN dienst e ON a.dienst = e.id LEFT JOIN stad f ON a.stad = f.id Order by a.timestamp DESC limit ?,?';
    const data = await meldingen(sql, offset, limit);
    return res.send({
        data : data,
        nextReq : true,
    })
}
const meldingen = (sql, offset, limit) => {
    return new Promise((resolve, reject) => {
        let query = mySqlConnection.query(sql, [offset, limit], (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}




//async meldingen details

module.exports.meldingenDetails = async (req, res) => {
    const id = req.params.id;


    let recent_sql = 'SELECT a.`id`,a.p2000,a.straat,a.straat_url,a.lat,a.lng,a.prio,a.timestamp,';
    recent_sql += ' b.provincie,c.regio,c.regio_url,d.categorie,d.categorie_url,e.dienst,f.stad,f.stad_url';
    recent_sql += ' from melding a LEFT JOIN provincie b ON a.provincie = b.id LEFT JOIN regio c ON a.regio = c.id LEFT JOIN categorie';
    recent_sql += ' d ON a.categorie = d.id LEFT JOIN dienst e ON a.dienst = e.id LEFT JOIN stad f ON a.stad = f.id Order by a.id DESC limit 5';


    let sql = 'SELECT a.`id`,a.p2000,a.straat,a.straat_url,a.lat,a.lng,a.prio,a.timestamp,';
    sql += ' b.provincie,c.regio,c.regio_url,d.categorie,d.categorie_url,e.dienst,f.stad,f.stad_url';
    sql += ' from melding a LEFT JOIN provincie b ON a.provincie = b.id LEFT JOIN regio c ON a.regio = c.id LEFT JOIN categorie';
    sql += ` d ON a.categorie = d.id LEFT JOIN dienst e ON a.dienst = e.id LEFT JOIN stad f ON a.stad = f.id where a.id =?`
    const detail = await details(sql, id);
    const recent = await recentMeldingen(recent_sql)
    return res.send({
        details: detail[0],
        recentMeldingen : recent
    })

}

const recentMeldingen = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mySqlConnection.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

const details = (sql, id) => {
    return new Promise((resolve, reject) => {
        let query = mySqlConnection.query(sql, [id], (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}


module.exports.filterMeldingen = async (req, res) => {
    const regio = req.params.regio;
    const PageNumber = req.params.page == 0 ? 0 : req.params.page;
    const limit = 21;
    const offset = PageNumber * limit;
    let sql = 'SELECT a.`id`,a.p2000,a.straat,a.straat_url,a.lat,a.lng,a.prio,a.timestamp,';
    sql += ' b.provincie,b.provincie_url,c.regio,c.regio_url,d.categorie,d.categorie_url,e.dienst,f.stad,f.stad_url';
    sql += ' from melding a LEFT JOIN provincie b ON a.provincie = b.id LEFT JOIN regio c ON a.regio = c.id LEFT JOIN categorie';
    sql += ' d ON a.categorie = d.id LEFT JOIN dienst e ON a.dienst = e.id LEFT JOIN stad f ON a.stad = f.id where c.regio_url like "%' + regio + '%" or b.provincie_url like "%' + regio + '%" or f.stad_url like "%' + regio + '%" Order by a.timestamp DESC limit ' + offset + ',' + limit;

    let query = mySqlConnection.query(sql, [regio, offset, limit], (error, result, fields) => {
        if (!error) {
            return res.send(result);
        } else {
            console.log(error);
        }
    })
};

module.exports.searchComplete = async (req, res) => {
    const searchString = req.query.search;
    let sql = `SELECT a.stad,a.stad_url,b.provincie,b.provincie_url,c.regio,c.regio_url from stad a, provincie b, regio c WHERE a.stad LIKE '${searchString}%' and a.provincie = b.id and a.regio = c.id limit 10`;
    const result = await mySqlConnection.query(sql, (error, rows, fields) => {
        if (error) {
            return res.send(error)
        } else {
            return res.send(rows)
        }
    })



}



module.exports.meldingenEnheeden = async (req, res) => {
    const id = req.params.id;
    let sql = `SELECT b.capcode,b.omschrijving,c.dienst FROM eenheden a LEFT join capcode b on a.capcode = b.id LEFT JOIN dienst c on b.dienst = c.id WHERE a.melding =?`;
    const data = await enheeden(sql, id);
    return res.send(data)
}

const enheeden = (sql, id) => {
    return new Promise((resolve, reject) => {
        let query = mySqlConnection.query(sql, [id], (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}


