import {redis} from "../index.js"
 const ratelimitter = async(req, res, next) => {
    const ip = req.ip
    console.log(`IP is ${ip}   `)
    const key=`rate_limit:${ip}`
    const requests= await redis.incr(key)
    console.log(requests)

    if(requests==1) {//if first request, set expiry
        await redis.expire(key, 60) //expire in 60 seconds
    }
    if(requests>5) { //generally 100 requests , but we take here 5 for experiment
        return res.status(429).json({message:"Too many requests"})
    }    

    next();
}    
export default ratelimitter;