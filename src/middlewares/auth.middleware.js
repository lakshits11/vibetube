import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// here below res is not used so we can replace it with _
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // humare pass cookies m accesstoken hoga..pr btw agar accesstoken nhi ho to?
    // like in mobile application, user may sed a custom header for access token
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorised request");
    }

    // agar token hai to using jwt, we need to find is this token valid or not and what info does it contain
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // many times, you may need to use await with jwt.verify

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // now since we have access to req, we can add user to it
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
