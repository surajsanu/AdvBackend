import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import dns from 'dns';
import User from "./model/user.model.js";
import Redis from "ioredis";
import ratelimitter from "./middleware/ratelimit.js";
import sendEmail from "./lib/sendEmail.js";
import emailQueue from "./queue.js";
//dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const port = process.env.PORT || 7000;
const app = express();

export const redis=new Redis(process.env.REDIS_URL)
connectDB();

app.use(express.json())
app.get("/", (req, res) => {
    return res.status(200).json({message:`Hello from server ${process.env.SERVER_NAME}`});
});

app.post("/create", async(req,res)=>{

    const {name, email, password}= req.body
    await redis.del("user:all") //delete the cache when new user is created
    const user= await User.create({
        name, email, password
    })
    //await sendEmail()  //Without queue - took 5.10 secs

    await emailQueue.add("send-email",{email}) //Queue will added to worker



    res.json(user)
})

app.get("/get",ratelimitter, async(req,res)=>{
    
    const user= await User.find({})

    res.json(user)
})

app.get("/get-with-redis", async(req,res)=>{
    const cached= await redis.get("user:all")

    if(cached){
        const user=JSON.parse(cached)
        return res.json(user)
    }
    const user= await User.find({})
    await redis.set("user:all",JSON.stringify(user))

    res.json(user)

})


//OTP storing
app.post("/send-otp",async(req,res)=>{
    const{email}=req.body
    const otp=Math.floor(100000 + Math.random() * 900000).toString()
    //Send to mail function using nodemailer
    await redis.set(`otp:${email}`, otp, "EX",300) //30 second expiry
    return res.json({otp})
})

app.post("/verify-otp",async(req,res)=>{
    const {email, otp}=req.body
    const cachedOtp= await redis.get(`otp:${email}`)
    if(!cachedOtp) return res.status(200).json({message:"OTP expired"})
    if(otp!=cachedOtp) return res.status(400).json({message:"OTP is not matching"})
        
        
    await redis.del(`otp:${email}`)
    return res.status(200).json({message:"OTP verified"})
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);      
})

//Without redis - 54ms
//with redis- 6ms