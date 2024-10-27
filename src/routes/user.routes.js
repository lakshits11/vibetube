import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // this is how we inject a middleware in a route
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
// in above case, now the url wil look like this: http://localhost:8000/api/v1/user/register

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refreshAccessToken").post(refreshAccessToken)

router.route("/changePassword").post(upload.none(), verifyJWT, changeCurrentPassword) // see notes.md point 9 for why we used upload.none()
router.route("/currentUser").get(verifyJWT, getCurrentUser)
router.route("/updateAccountDetails").patch(verifyJWT, updateAccountDetails) // here use patch instead of post

router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/updateCoverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
// dynamic routes for user channel profile, use ':' to define a variable in the url
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router;
