import { upsertStreamUser } from "../lib/stream.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

export async function signup(req,res){
    const {fullName,email,password}=req.body;

    try{
        if(!email||!fullName||!password)
            return res.status(400).json({message:"All the Fields are Required"});
        
        if(password.length<8) 
            return res.status(400).json({message:"Password length should be more than 7"})
        
        // verifying if it is a valid mail or not 
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) 
        return res.status(400).json({message:"Provide a Valid mail id "})
         
        //Checking if thier a existing mail or we can say user 
        const ExistingUser=await User.findOne({email});

        if(ExistingUser)  
            return res.status(400).json({message:"email already exist , Try other email"})
 
        const idx=Math.floor(Math.random()*100)+1;
        const randomAvatar=`https://api.dicebear.com/9.x/adventurer/png?seed=${idx}`;

        console.log(randomAvatar);

        const newUser = await User.create({
            email,
            password,
            fullName,
            profilePic:randomAvatar
        })

        // connecting or generating Stream account for the User 
        //using try catch to avoid the flow in error of signup fn 
        try{
            await upsertStreamUser({
            id:newUser._id.toString(),
            name:newUser.fullName,
            image:newUser.profilePic||""
        })
        console.log(`stream user created succesfully with name:${newUser.fullName}`)
        }catch(error){
          console.log("Error occured while stream user creation");
        }

        //creating Tokens to send to user after signup 
        const token =jwt.sign({userId:newUser._id},process.env.JWT_SECRET_KEY,{
            expiresIn:"7d"
        });

        res.cookie("jwt",token,{
            maxAge:7*24*60*60*1000,
            httpOnly:true, // prevent dirsct access of cookie like document.cookie
            sameSite:"strict", //prevents other sites from accessing the cookies 
            secure:process.env.NODE_ENV==="production"
        })
        res.status(200).json({success:true,user:newUser})
    }catch(error){
        console.log(error,"something internal error");
        res.status(500).json({message:"Server Error"})
    }
}

export async function login(req,res){
    try{
    const {email,password}=req.body;

    if(!email||!password)
     return res.status(400).json({message:"Provide both the details "})

    const user=await User.findOne({email})
 
    if(!user)
        return res.status(404).json({message:"User not Found"})

    const isCorrect=await user.checkPassword(password)

    if(!isCorrect)
        return res.status(401).json({message:"Wrong password"})

    const token =jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,{
            expiresIn:"7d"
        });

        res.cookie("jwt",token,{
            maxAge:7*24*60*60*1000,
            httpOnly:true, // prevent dirsct access of cookie like document.cookie
            sameSite:"strict", //prevents other sites from accessing the cookies 
            secure:process.env.NODE_ENV==="production"
        })
        res.status(200).json({success:true,user})
    }catch(error){
        console.log("Internal Login Error",error.message)
        res.status(500).json({message:"internal server problem"})
    }

}

export async function logout(req,res){
    res.clearCookie("jwt");
    res.status(201).json({success:true,message:"User logout successfully"})
}

export async function onboard(req,res){

    try{
        const userId=req.user._id;
        const {fullName,nativeLanguage,learningLanguage,bio,location}=req.body

    if(!fullName||!nativeLanguage||!learningLanguage||!bio||!location){
        return res.status(400).json({
            message:"All details are Compalsury",
            missingFields:[
                !fullName && "fullName",
                !bio && "bio",
                !nativeLanguage && "nativeLanguage",
                !learningLanguage && "learningLanguage",
                !location && "location"
            ].filter(Boolean) //filter method to avoid the false value 
        });
    }
        const updatedUser = await User.findById(userId).select("-password");
        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        Object.assign(updatedUser, { fullName, nativeLanguage, learningLanguage, bio, location, isOnboarded: true });
        updatedUser.nativeLanguages = [nativeLanguage.trim().toLowerCase()];
        updatedUser.learningLanguages = [{ language: learningLanguage.trim().toLowerCase() }];
        await updatedUser.save();
 
         if(!updatedUser)
            return res.status(404).json({message:"User not found"})

         //Updating the stream user detail also 
         try{
            await upsertStreamUser({
            id:updatedUser._id. toString(),
            name:updatedUser.fullName,
            image:updatedUser.profilePic||""
        })
        console.log(`stream user updated succesfully with name:${updatedUser.fullName}`)
        }catch(error){
          console.log("Error occured while onborading and update stream ");
        }

         res.status(200).json({success:true,user:updatedUser})
    }catch(error){
        console.error("Onboarding error");
        res.status(500).json({message:"Internal Server Error"});
    }
    
}