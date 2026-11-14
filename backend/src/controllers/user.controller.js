import { matchUsers, key, LEVELS } from "../lib/learning.js";
import { User } from "../models/User.js";
import { FriendRequest } from "../models/FriendRequest.js";

export async function getRecommendedUsers(req,res){
  try{
    const currentUserId=req.user._id;
    const currentUser=req.user

    if (req.query.level && !LEVELS.includes(req.query.level)) return res.status(400).json({ message: "Invalid CEFR level" });
    const candidates = await User.find({ _id: { $nin: [currentUserId, ...currentUser.friends] }, isOnboarded: true })
      .select("fullName profilePic bio location nativeLanguage learningLanguage nativeLanguages learningLanguages interests availability timezone");
    const language = key(req.query.language);
    const recommendedUsers = candidates.filter(candidate => candidate.learningLanguages.some(l => (!language || key(l.language) === language) && (!req.query.level || l.level === req.query.level)) || (!language && !req.query.level))
      .map(candidate => ({ ...candidate.toJSON(), ...matchUsers(currentUser, candidate) }))
      .sort((a, b) => b.matchScore - a.matchScore || String(a._id).localeCompare(String(b._id)))
      .slice(0, 30);
    res.status(200).json(recommendedUsers);
  }catch(error){
    console.log("Error in handling recommendedUser Controller",error.message);
    res.status(500).json({message:"Internal Server Error"})
  }
};

export async function getMyFriends(req,res){
   try{
    const user = await User.findById(req.user._id)
    .select("friends")
    .populate("friends","fullName profilePic nativeLanguage learningLanguage nativeLanguages learningLanguages interests");

    res.status(200).json(user.friends.filter(Boolean).map(friend => ({ ...friend.toJSON(), ...matchUsers(req.user, friend) })));
   }catch(error){
        console.log("Error in handling getFriend controller",error.meassage);
        res.status(500).json({message:"Internal Server Error"});
   }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id.toString();
    const { id: recipientId } = req.params;
//     console.log("myId:", myId);
// console.log("recipientId:", recipientId);

if (myId.toString() === recipientId) {
  console.log("Returned: sending request to yourself");
  return res.status(400).json({ message: "You can't send friend request to yourself" });
}

const recipient = await User.findById(recipientId);
// console.log("recipient:", recipient);

if (!recipient) {
  console.log("Returned: recipient not found");
  return res.status(404).json({ message: "Recipient not found" });
}

const isFriend = recipient.friends.some(friendId =>
  friendId.toString() === myId.toString()
);

// console.log("isFriend:", isFriend);

if (isFriend) {
  console.log("Returned: already friends");
  return res.status(400).json({ message: "Already friends" });
}

const existingRequest = await FriendRequest.findOne({
  $or: [
    { sender: myId, recipient: recipientId },
    { sender: recipientId, recipient: myId },
  ],
});

// console.log("existingRequest:", existingRequest);

// console.log(existingRequest); 

if (existingRequest) {
  console.log("Returned: request already exists");
  return res.status(400).json({ message: "Request already exists" });
}

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req,res){
   try{
     const {id:requestId}=req.params;

     const friendRequest=await FriendRequest.findById(requestId);

     if(!friendRequest){
        return res.status(400).json({message:"No friend req found"})
     }

    //verifying is the current user is recipient or not 
     if(friendRequest.recipient.toString()!==req.user._id.toString()){
        return res.status(401).json({message:"you are not authorized to accept the req"})
     }

     friendRequest.status="accepted";
     await friendRequest.save()

    //Updating the friend list for both the User 
     await User.findByIdAndUpdate(friendRequest.sender,{
        $addToSet:{friends:friendRequest.recipient}
     })

     await User.findByIdAndUpdate(friendRequest.recipient,{
        $addToSet:{friends:friendRequest.sender}
     })

     res.status(200).json({message:"Friend requese accepted succcessfully"});

   }catch(error){
    console.log("Error while accepting friend request",error.message);
    res.status(500).json({message:"Internal Server Error while accepting req"});
   }
}

export async function getFriendRequest(req,res){
    try{
        const currentUserId = req.user._id || req.user.id;
        const incomingReqsRaw=await FriendRequest.find({
            recipient:currentUserId,
            status:"pending"
        }).populate("sender","fullName profilePic nativeLanguage learningLanguage nativeLanguages learningLanguages")

        //the req that we have sended and get accepted
        const acceptedReqsRaw=await FriendRequest.find({
            sender:currentUserId,
            status:"accepted"
        }).populate("recipient","fullName profilePic nativeLanguage learningLanguage nativeLanguages learningLanguages");     

        // Filter out orphaned requests where user no longer exists
        const incomingReqs = incomingReqsRaw.filter(r => r && r.sender);
        const acceptedReqs = acceptedReqsRaw.filter(r => r && r.recipient);

        res.status(200).json({incomingReqs,acceptedReqs})
    }catch(error){
        console.log("Error while fetching friend req notification",error.message);
        res.status(500).json({message:"Internal Server Error while request notification"})
    }
}

export async function getOutgoingFriendReqs(req,res){
    try{
        const currentUserId = req.user._id || req.user.id;
        const outgoingRequestsRaw=await FriendRequest.find({
            sender:currentUserId,
            status:"pending"
        }).populate("recipient","fullName profilePic nativeLanguage learningLanguage nativeLanguages learningLanguages")

        const outgoingRequests = outgoingRequestsRaw.filter(r => r && r.recipient);

        res.status(200).json({outgoingRequests})
    }catch(error){
        console.log("Error while getOutgoingreqs",error.message);
        res.status(500).json({message:"Internal Server Error while getOutgoing"})
    }
}
