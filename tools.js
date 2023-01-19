// All modules used
var path      = require(`path`)
var mysql     = require(`mysql`)
var express   = require(`express`)
var helmet    = require(`helmet`)
var request   = require(`request`)
var cheerio   = require('cheerio')
var moment    = require(`moment-timezone`)
var $         = {}
// Set the correct timezone in enviroment and momentjs
process.env.TZ = 'Europe/Amsterdam'
moment.tz.setDefault('Europe/Amsterdam')
moment.locale('nl')

// Prototypes
String.prototype.matches = function(str) {
  if (Array.isArray(str)) {
    for (var i = 0; i < str.length; i++) {
      if (new RegExp(`\\b${str[i]}\\b`).test(this)) {
        return true
      }
    }
  } else {
    return new RegExp(`\\b${str}\\b`).test(this)
  }
  return false
}
String.prototype.contains = function(str) {
  if (Array.isArray(str)) {
    for (var i = 0; i < str.length; i++) {
      if (this.indexOf(str[i]) !== -1) {
        return str[i]
      }
    }
  }
  return this.indexOf(str) !== -1
}
String.prototype.slug = function() {
  if (!this) {
    return null
  }
  return this.trim().toLowerCase().replace(/;/g,'-').replace(/:/g,'-').replace(/ /g,'-').replace(/[^\w-]+/g,'').replace(/-+/g,'-')
}
String.prototype.capital = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}
// Request functions
$.Request = (options) => {
  if (typeof options === 'string') {
      options = {
          url: options
      }
  }
  if (options.url.contains('json') !== -1) {
      options.json = true
  }
  if (typeof options.timeout === 'undefined') {
    options.timeout = 25000
  }
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) {
        return reject(err)
      }
      resolve(body)
    })
  })
}
$.Jar = () => {
  return request.jar()
}
$.Cookies = (jar) => {
  var cookies = []
  jar['_jar']['store']['getAllCookies']((err, arr) => {
      for (var cookie of arr) {
        cookies.push({
          name: cookie.key,
          value: cookie.value
        })
      }
  })
  return cookies
}
// Mysql functions
$.Mysql = {
  settings: {
    host : "localhost",
    user: "root",
    password: "",
    database : "deb140017_dbs",
    multipleStatements : true,
    connectionLimit: 100
  },
  pool: null
}
$.Connect = (settings) => {
  return new Promise((resolve, reject) => {
    try {
      $.Mysql.pool = mysql.createPool(settings || $.Mysql.settings)
      resolve(true)
    } catch (err) {
      reject(err)
    }
  })
}
$.Query = (conn, sql, data) => {
  if (typeof conn === `string`) {
    data  = sql
    sql   = conn
    conn  = null
  }
  return new Promise((resolve, reject) => {
    if (conn) {
      conn.query(sql, data, (err, rows) => {
        if (err) {
          if (conn) {
            try {
              conn.release()
            } catch (err) {}
          }
          return reject(err)
        }
        resolve(rows)
      })
    } else {
      $.Mysql.pool.query(sql, data, (err, rows) => {
        if (err) {
          return reject(err)
        }
        resolve(rows)
      })
    }
  })
}
$.Connection = () => {
  return new Promise((resolve, reject) => {
    $.Mysql.pool.getConnection((err, conn) => {
      if (err) {
        return reject(err)
      }
      resolve(conn)
    })
  })
}
$.Release = (conn) => {
  try {
    conn.release()
  } catch (err) {}
}
// Express functions
$.Express = () => {
  return new express()
}
$.Static = (path) => {
  return express.static(path)
}
$.Helmet = () => {
  return helmet()
}
// Moment functions
$.Unix = (datetime, format) => {
  return moment(datetime, format).unix()
}
$.DateTime = (timestamp, format) => {
  return moment.unix(timestamp).format(format)
}
$.Timestamp = () => {
  return Math.floor(Date.now() / 1000)
}
$.Ago = (timestamp) => {
  return moment(timestamp * 1000).fromNow();
}
// Path functions
$.Path = (...args) => {
  return path.join.apply(null, args)
}
// Cheerio functions
$.Cheerio = (html) => {
  return cheerio.load(html)
}
// Random functions
$.Random = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
}
module.exports = $