import mongoose from "mongoose"
import { Endorsement } from "../models/Endorsement.js";
import { PracticeCredit } from "../models/PracticeCredit.js";
import { CallAttendance } from "../models/CallAttendance.js";

 const connectDB=async()=>{
     try{
        await mongoose.connect(process.env.MONGO_URI);
        try {
          const coll = mongoose.connection.collection("endorsements");
          const indexes = await coll.indexes();
          for (const idx of indexes) {
            if (idx.unique && idx.name.startsWith("endorser_1_recipient_1")) {
              await coll.dropIndex(idx.name);
              console.log(`Dropped legacy unique index: ${idx.name}`);
            }
          }
        } catch {
          // Safe ignore if collection or index does not exist yet
        }
        await Promise.all([Endorsement.init(), PracticeCredit.init(), CallAttendance.init()]);
        console.log("MONGODB CONNECTED SUCCESSFULLY")
     }catch(error){
        console.log(error);
        process.exit(1);
     }
 } 


export default connectDB
