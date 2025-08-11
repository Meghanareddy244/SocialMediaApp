import express from "express";
import path from "path";
import upload from "../utils/multer.js";
import {
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  getUser,
  updateUser,
  friendRequest,
  getFriendRequest,
  acceptRequest,
  suggestedFriends,
  profileViews,
} from "../controllers/userController.js";
import userAuth from "../middleware/authMiddleware.js";

const router = express.Router();
const __dirname = path.resolve(path.dirname(""));

router.get("/verify/:userId/:token", verifyEmail);
//password reset
router.post("/request-passwordreset", requestPasswordReset);
router.get("/reset-password/:userId/:token", resetPassword);
router.post("/reset-password", changePassword);

//user routes
router.post("/get-user", userAuth, getUser);
router.post("/update-user", userAuth, updateUser);

//friend request
router.post("/friend-request", userAuth, friendRequest);
router.post("/get-friend-request", userAuth, getFriendRequest);

//accept / deny friend request
router.post("/accept-request", userAuth, acceptRequest);

//view profile
router.post("/profile-view", userAuth, profileViews);

//suggested friends
router.post("/suggested-friends", userAuth, suggestedFriends);

router.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "verifiedpage.html"));
});
router.get("/resetpassword", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "passwordReset.html"));
});
router.get("/invalid-link", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "invalidLink.html"));
});

export default router;
