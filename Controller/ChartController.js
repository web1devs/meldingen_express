
const mysql = require('../connection');
module.exports.meldingenStats = async (req, res) => {
    let from;
    let toHours;
    let finalResult;
    let chartQuery;

    const hours = req.params.hour;
    let region = req.params.region;

    const to = hours * 2;
    if (region === "all") {
        from = `select count(id) total from melding where FROM_UNIXTIME(timestamp) > NOW() - INTERVAL ${hours} HOUR and provincie<>''`;
        toHours = `select count(id) total from melding where FROM_UNIXTIME(timestamp) > NOW() - INTERVAL ${to} HOUR and provincie<>''`;
        chartQuery = `SELECT count(id) calculated,HOUR(FROM_UNIXTIME(timestamp)) time FROM melding 
        where FROM_UNIXTIME(timestamp) > NOW() - INTERVAL ${hours} HOUR and provincie<>'' group by HOUR(FROM_UNIXTIME(timestamp));`
    } else {
        region = JSON.stringify(req.params.region);
        from = `select count(a.id) total,b.regio from melding a LEFT JOIN regio b on a.regio = b.id where FROM_UNIXTIME(timestamp) > NOW() - INTERVAL ${hours} HOUR and b.regio= ${region} and a.provincie<>''`;
        toHours = `select count(a.id) total,b.regio from melding a LEFT JOIN regio b on a.regio = b.id where FROM_UNIXTIME(timestamp) > NOW() - INTERVAL ${to} HOUR and b.regio= ${region} and a.provincie<>''`;
        chartQuery = 'SELECT count(a.id) calculated,HOUR(FROM_UNIXTIME(a.timestamp)) time,b.regio FROM melding a LEFT JOIN regio b ON a.regio = b.id'
        chartQuery += ' where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL ' + hours + ' HOUR and b.regio =' + region + ' and a.provincie<>"" group by HOUR(FROM_UNIXTIME(a.timestamp))';


    }
    const recent24Hours = await Meldingen24HoursData(from);
    const previous48Hours = await MeldingenPrevious24(toHours);
    const previous_total = previous48Hours[0].total - recent24Hours[0].total;
    const parcentage = (recent24Hours[0].total - previous_total) * 100;

    if (previous_total === 0) {
        finalResult = 100;
    } else {
        finalResult = Math.round(parcentage / previous_total);
    }
    mysql.query(chartQuery, (error, results, fields) => {
        return res.send({
            count: recent24Hours[0].total,
            parcent: finalResult,
            charts: results
        })
    })
}
const Meldingen24HoursData = (from) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(from, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}
const MeldingenPrevious24 = (toHours) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(toHours, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

//ambulance charts

module.exports.ambulanceStats = async (req, res) => {
    let from;
    let toHours;
    let finalResult;
    let chartQuery;

    const hours = req.params.hour;
    let region = req.params.region;
    const to = hours * 2;

    if (region === 'all') {
        from = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'ambulance' and a.provincie<>''"
        toHours = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + to + " HOUR and b.dienst = 'ambulance' and a.provincie<>''";
        chartQuery = "SELECT count(a.id) calculated,HOUR(FROM_UNIXTIME(a.timestamp)) time FROM melding a LEFT JOIN dienst b on a.dienst = b.id"
        chartQuery += " where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'ambulance' and a.provincie<>'' group by HOUR(FROM_UNIXTIME(a.timestamp))";

    }
    else {
        region = JSON.stringify(region);
        from = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id LEFT Join regio c on a.regio = c.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'ambulance' and c.regio =" + region + " and a.provincie<>''";
        toHours = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id LEFT Join regio c on a.regio = c.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'ambulance' and c.regio = " + region + " and a.provincie<>''";
        chartQuery = "SELECT count(a.id) calculated,HOUR(FROM_UNIXTIME(a.timestamp)) time FROM melding a LEFT JOIN dienst b on a.dienst = b.id LEFT JOIN regio c on a.regio = c.id "
        chartQuery += " where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'ambulance' and c.regio = " + region + " and a.provincie<>'' group by HOUR(FROM_UNIXTIME(a.timestamp));"
    }

    const recent24Hours = await ambulance24HoursData(from);
    const previous48Hours = await ambulance48HoursData(toHours);
    const previous_total = previous48Hours[0].total - recent24Hours[0].total;
    const parcentage = (recent24Hours[0].total - previous_total) * 100;

    if (previous_total === 0) {
        finalResult = 100;
    } else {
        finalResult = Math.round(parcentage / previous_total);
    }
    mysql.query(chartQuery, (error, results, fields) => {
        return res.send({
            count: recent24Hours[0].total,
            parcent: finalResult,
            charts: results
        })
    })

}
const ambulance24HoursData = (from) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(from, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
};

const ambulance48HoursData = (toHours) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(toHours, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
};

//brandweer Stats

module.exports.brandweerMeldingen = async (req, res) => {
    let from;
    let toHours;
    let finalResult;
    let chartQuery;

    const hours = req.params.hour;
    let region = req.params.region;
    const to = hours * 2;

    if (region === 'all') {
        from = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'brandweer' and a.provincie<>''"
        toHours = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + to + " HOUR and b.dienst = 'brandweer' and a.provincie<>''";
        chartQuery = "SELECT count(a.id) calculated,HOUR(FROM_UNIXTIME(a.timestamp)) time FROM melding a LEFT JOIN dienst b on a.dienst = b.id"
        chartQuery += " where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'brandweer' and a.provincie<>'' group by HOUR(FROM_UNIXTIME(a.timestamp))";

    }
    else {
        region = JSON.stringify(region);
        from = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id LEFT Join regio c on a.regio = c.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'brandweer' and c.regio =" + region + " and a.provincie<>''";
        toHours = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id LEFT Join regio c on a.regio = c.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'brandweer' and c.regio = " + region + " and a.provincie<>''";
        chartQuery = "SELECT count(a.id) calculated,HOUR(FROM_UNIXTIME(a.timestamp)) time FROM melding a LEFT JOIN dienst b on a.dienst = b.id LEFT JOIN regio c on a.regio = c.id "
        chartQuery += " where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'brandweer' and c.regio = " + region + " and a.provincie<>'' group by HOUR(FROM_UNIXTIME(a.timestamp));"
    }

    const recent24Hours = await brandweer24HoursData(from);
    const previous48Hours = await brandweer48HoursData(toHours);
    const previous_total = previous48Hours[0].total - recent24Hours[0].total;
    const parcentage = (recent24Hours[0].total - previous_total) * 100;

    if (previous_total === 0) {
        finalResult = 100;
    } else {
        finalResult = Math.round(parcentage / previous_total);
    }
    mysql.query(chartQuery, (error, results, fields) => {
        return res.send({
            count: recent24Hours[0].total,
            parcent: finalResult,
            charts: results
        })
    })

}

const brandweer24HoursData = (from) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(from, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
};

const brandweer48HoursData = (toHours) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(toHours, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
};

//politie Meldingen

module.exports.politieMeldingen = async (req, res) => {
    let from;
    let toHours;
    let finalResult;
    let chartQuery;

    const hours = req.params.hour;
    let region = req.params.region;
    const to = hours * 2;

    if (region === 'all') {
        from = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'politie' and a.provincie<>''"
        toHours = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + to + " HOUR and b.dienst = 'politie' and a.provincie<>''";
        chartQuery = "SELECT count(a.id) calculated,HOUR(FROM_UNIXTIME(a.timestamp)) time FROM melding a LEFT JOIN dienst b on a.dienst = b.id"
        chartQuery += " where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'politie' and a.provincie<>'' group by HOUR(FROM_UNIXTIME(a.timestamp))";

    }
    else {
        region = JSON.stringify(region);
        from = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id LEFT Join regio c on a.regio = c.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'politie' and c.regio =" + region + " and a.provincie<>''";
        toHours = "select count(a.id) total from melding a LEFT JOIN dienst b on a.dienst = b.id LEFT Join regio c on a.regio = c.id where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'politie' and c.regio = " + region + " and a.provincie<>''";
        chartQuery = "SELECT count(a.id) calculated,HOUR(FROM_UNIXTIME(a.timestamp)) time FROM melding a LEFT JOIN dienst b on a.dienst = b.id LEFT JOIN regio c on a.regio = c.id "
        chartQuery += " where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and b.dienst = 'politie' and c.regio = " + region + " and a.provincie<>'' group by HOUR(FROM_UNIXTIME(a.timestamp));"
    }

    const recent24Hours = await politie24HoursData(from);
    const previous48Hours = await politie48HoursData(toHours);
    const previous_total = previous48Hours[0].total - recent24Hours[0].total;
    const parcentage = (recent24Hours[0].total - previous_total) * 100;

    if (previous_total === 0) {
        finalResult = 100;
    } else {
        finalResult = Math.round(parcentage / previous_total);
    }
    mysql.query(chartQuery, (error, results, fields) => {
        return res.send({
            count: recent24Hours[0].total,
            parcent: finalResult,
            charts: results
        })
    })
}

const politie24HoursData = (from) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(from, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
};

const politie48HoursData = (toHours) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(toHours, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
};

module.exports.provincie = async (req, res) => {
    let sql = 'select provincie from provincie';
    const result = mysql.query(sql, (error, result, fields) => {
        return res.send(result);
    })
}
module.exports.provincieChart = async (req, res) => {

    const hours = req.params.hour;
    let provincie = JSON.stringify(req.params.provincie);

    let chartQuery = "SELECT count(a.id) calculated,HOUR(FROM_UNIXTIME(a.timestamp)) time FROM melding a Left join provincie b";
    chartQuery += " on a.provincie =  b.id  where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR  and b.provincie";
    chartQuery += " = " + provincie + " group by HOUR(FROM_UNIXTIME(a.timestamp));";

    let hoursQuery = "select count(a.id) total,b.provincie from melding a LEFT JOIN provincie b on a.provincie = b.id where ";
    hoursQuery += " FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL " + hours + " HOUR and a.provincie = b.id GROUP by b.provincie order by b.provincie";

    const Data24Hour = await province24Hours(hoursQuery);

    mysql.query(chartQuery, (error, result, fields) => {

        return res.send({
            chart: result,
            hoursData: Data24Hour,
        })

    })

}

const province24Hours = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}

module.exports.emergencyMeldingen = async (req, res) => {
    const hour = req.params.hour;
    const emergency = JSON.stringify(req.params.dienst);
   
    let total = 0;
    let sql = `SELECT count(a.id) total,b.dienst from melding a LEFT Join dienst b on a.dienst = b.id where a.dienst <>"" and 
    FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL ${hour} HOUR 
    GROUP by b.dienst order by b.dienst ASC`;

    const sql_data = await emergencyCount(sql);
       let chartQuery = `select count(a.id) calculated,HOUR(FROM_UNIXTIME(a.timestamp)) time,b.dienst from melding a LEFT join dienst  b on a.dienst = b.id  where FROM_UNIXTIME(a.timestamp) > NOW() - INTERVAL ${hour} HOUR and b.dienst = ${emergency} group by HOUR(FROM_UNIXTIME(a.timestamp));`
       mysql.query(chartQuery,(error, result, fields)=>{
            if(!error){
                res.send({
                    buttons : sql_data,
                    chart : result
                })
            }
       })
}

const emergencyCount = (sql) => {
    return new Promise((resolve, reject) => {
        let query = mysql.query(sql, (error, result, fields) => {
            if (error) return reject(error);
            resolve(Object.values(JSON.parse(JSON.stringify(result))))
        })
    })
}







