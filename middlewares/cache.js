const NodeCache = require('node-cache');
const cache = new NodeCache();

module.exports = duration =>(req, res, next)=>{
    //is req a get req
    if(req.method !== get){
        console.error('cannot cache non-get methods');
        return next();
    }
    const key = req.orginalUrl;
    const cachedResponse = cache.get(key);
    if(cachedResponse){
        res.send(cachedResponse);
    }else{
        res.orginalSend = res.send

        res.send = body =>{
            res.orginalSend(body);
            cache.set(key,body,duration)
        }
        next();
    }
}