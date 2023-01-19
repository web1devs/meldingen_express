const mysql = require('../connection');
const NodeCache = require("node-cache");
const myCache = new NodeCache();

module.exports.getAllNews = async (req, res) => {
    const news_sql = 'select id,title,post_url,pubdate,description,content,slug,created_at,lat,lon,tags,state,city,staddress,postal,image,seo_keywords,seo_meta from news where state <>"" and city <>"" order by id DESC limit 5';
    let sql = 'SELECT a.`id`,a.p2000,a.straat,a.straat_url,a.lat,a.lng,a.prio,a.timestamp,';
    sql += ' b.provincie,c.regio,c.regio_url,d.categorie,d.categorie_url,e.dienst,f.stad,f.stad_url';
    sql += ' from melding a LEFT JOIN provincie b ON a.provincie = b.id LEFT JOIN regio c ON a.regio = c.id LEFT JOIN categorie';
    sql += ' d ON a.categorie = d.id LEFT JOIN dienst e ON a.dienst = e.id LEFT JOIN stad f ON a.stad = f.id Order by a.id DESC limit 5';

    let seoQuery = 'select title,seo_keywords,seo_meta,structured_data,page from seo_data_tables where page = "Nieuws"'

    let newsCacheValue = myCache.get('news');
    let newsSeoCacheValue = myCache.get('seo_news');

    const recent = await recentMeldingen(sql);
    if (newsCacheValue == undefined || newsSeoCacheValue == undefined) {
        const allNews = await news(news_sql);
        const seo = await seo_fetch(seoQuery);
        myCache.set('news', allNews, 3600);
        myCache.set('seo_news', seo[0], 86400);
        return res.send({
            news: myCache.get('news'),
            recentMeldingen: recent,
            seo: myCache.get('seo_news'),
        })
    } else {
        console.log('news api cache');
        return res.send({
            news: myCache.get('news'),
            recentMeldingen: recent,
            seo: myCache.get('seo_news'),
        })
    }

}
const recentMeldingen = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}
const news = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}
const seo_fetch = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}


module.exports.getOtherNews = (req, res) => {
    let sql = 'select * from news where state <>"" and city <>"" order by id DESC limit 5,5';
    mysql.query(sql, (error, result, fields) => {
        return res.send(result);
    })
}

module.exports.getMoreOtherNews = (req, res) => {
    const PageNumber = req.params.page == 0 ? 0 : req.params.page;
    const limit = 5;
    const offset = PageNumber * limit;

    let sql = 'select * from news where state <>"" and city <>"" order by id DESC limit ' + offset + ',' + limit;

    mysql.query(sql, (error, result, fields) => {
        return res.send(result);
    })
}


module.exports.newsDetails = async (req, res) => {
    let id = req.params.id;
    const details = await news_details(id);
    let sql = 'SELECT a.`id`,a.p2000,a.straat,a.straat_url,a.lat,a.lng,a.prio,a.timestamp,';
    sql += ' b.provincie,c.regio,c.regio_url,d.categorie,d.categorie_url,e.dienst,f.stad,f.stad_url';
    sql += ' from melding a LEFT JOIN provincie b ON a.provincie = b.id LEFT JOIN regio c ON a.regio = c.id LEFT JOIN categorie';
    sql += ' d ON a.categorie = d.id LEFT JOIN dienst e ON a.dienst = e.id LEFT JOIN stad f ON a.stad = f.id Order by a.id DESC limit 5';
    let seoQuery = 'select title,seo_keywords,seo_meta,structured_data,page from seo_data_tables where page = "Nieuws"'
    const seo_data = await seo_fetch(seoQuery);
    const recent = await recentMeldingen(sql);

   return res.send({
    details: details[0],
    seo_data : seo_data[0],
    recentMeldingen : recent,
   })
  
}

const news_details = (id) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query('select id,title,post_url,pubdate,description,content,slug,created_at,lat,lon,tags,state,city,staddress,postal,image,seo_keywords,seo_meta from news where id =?', [id], (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

const recent = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query('SELECT id,title,post_url,pubdate,description,content,slug,created_at,lat,lon,tags,state,city,staddress,postal,image,seo_keywords,seo_meta from news where state <>"" and city <>"" order by id DESC limit 6', (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

module.exports.recentNews = async (req, res) => {
    const recent_news = await recent();
    return res.send(recent_news)
};


module.exports.fetchRegios = async (req, res) => {
    const sql = "SELECT a.regio,a.regio_url,b.provincie,b.provincie_url FROM regio a LEFT join provincie b on a.provincie = b.id where a.provincie <>'';"

    let key = "regios";
    let value = myCache.get(key);

    if (value == undefined) {
        const data = await regio(sql);
        myCache.set(key, data, 0);
        return res.send(data);
    } else {
        console.log('regio cache');
        return res.send(myCache.get(key))

    }

};

const regio = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
};


module.exports.filteredNews = (req, res) => {
    const region = req.params.region;
    const PageNumber = req.params.page == 0 ? 0 : req.params.page;
    const limit = 5;
    const offset = PageNumber * limit;
    
    const sql = `SELECT * FROM news WHERE state LIKE "%${region}%" or city LIKE "%${region}%" or staddress LIKE "%${region}%" and state <>"" and city <>""  order by id DESC limit ${offset}, ${limit}`;
    const data = mysql.query(sql, (error, results, fields) => {
        if (error) {
            console.log(error);
        } else {
            return res.status(200).send(results)
        }

    })
};

module.exports.recentMeldingens = (req, res) => {
    let sql = 'SELECT a.`id`,a.p2000,a.straat,a.straat_url,a.lat,a.lng,a.prio,a.timestamp,';
    sql += ' b.provincie,c.regio,c.regio_url,d.categorie,d.categorie_url,e.dienst,f.stad,f.stad_url';
    sql += ' from melding a LEFT JOIN provincie b ON a.provincie = b.id LEFT JOIN regio c ON a.regio = c.id LEFT JOIN categorie';
    sql += ' d ON a.categorie = d.id LEFT JOIN dienst e ON a.dienst = e.id LEFT JOIN stad f ON a.stad = f.id Order by a.id DESC limit 5';

    mysql.query(sql, (error, results, fields) => {
        if (!error) {
            return res.send(results)
        }
    })
}