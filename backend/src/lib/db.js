import mongoose from "mongoose"
import { Endorsement } from "../models/Endorsement.js";
import { PracticeCredit } from "../models/PracticeCredit.js";
import { CallAttendance } from "../models/CallAttendance.js";

 const connectDB=async()=>{
     try{
        await mongoose.connect(process.env.MONGO_URI);
        await Promise.all([Endorsement.init(), PracticeCredit.init(), CallAttendance.init()]);
        console.log("MONGODB CONNECTED SUCCESSFULLY")
     }catch(error){
        console.log(error);
        process.exit(1);
     }
 } 


export default connectDB
