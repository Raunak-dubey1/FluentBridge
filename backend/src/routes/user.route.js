import { updateProfile, saveLanguage, deleteLanguage, endorseUser, rateUser, getEndorsements } from "../controllers/profile.controller.js";
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
    getRecommendedUsers,
    getMyFriends,
    sendFriendRequest,
    acceptFriendRequest,
    getFriendRequest,
    getOutgoingFriendReqs
} from "../controllers/user.controller.js";

const router =express.Router();

router.use(protectRoute);// to apply the auth middleware to every route here

router.put("/profile", updateProfile);
router.post("/languages", saveLanguage);
router.put("/languages/:language", saveLanguage);
router.delete("/languages/:language", deleteLanguage);
router.get("/endorsements", getEndorsements);
router.post("/:id/endorse", endorseUser);
router.post("/:id/rate", rateUser);
router.get("/",getRecommendedUsers);
router.get("/friends",getMyFriends);

router.post("/friend-request/:id",sendFriendRequest);
router.put("/friend-request/:id/accept",acceptFriendRequest);

// for the notification purpose from where user will accept req
router.get("/friend-requests",getFriendRequest)
router.get("/outgoing-friend-requests",getOutgoingFriendReqs)

export default router;