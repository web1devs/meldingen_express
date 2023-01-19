const mysql = require('mysql');
let mySqlConnection = mysql.createConnection({
    host : "localhost",
    user: "root",
    password: "",
    database : "deb140017_dbs",
    multipleStatements : true,
    connectionLimit: 100
})


mySqlConnection.connect((err)=>{
    if(!err){
        console.log('connected Successfully');
    }else{
        console.log("not connected");
    }
})

module.exports = mySqlConnection