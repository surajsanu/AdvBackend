import express from "express";
import dotenv from "dotenv";


dotenv.config();

const port = process.env.PORT || 8001;
const app = express();



app.use(express.json())
app.get("/", (req, res) => {
    return res.status(200).json({message:`Hello from Order Service `});
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);      
})