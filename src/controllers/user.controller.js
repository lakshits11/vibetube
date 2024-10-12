import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

// generate access token and refresh token
const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate access token and refresh token ❌");
  }
};

/*
Steps to register a user:
// Check if the user already exists in the database.
// If the user exists, return an error message. => check username and email
// If the user doesn't exist, get user details from the request body or from frontend
// Validate the user details (username, email, password, empty field, images).
// Check for images, avatar
// upload them to cloudinary
// check if upload is successful 
// create user object - create entry in database
// remove password and refresh token field from response
// check for user creation 
// If the user is created successfully, return a success message.
// return res
*/
const registerUser = asyncHandler(async (req, res) => {
  console.log("⚔️ Start ⚔️");
  console.log("req.body", req.body);

  const { username, email, password, fullname } = req.body;
  console.log("username", username);

  // Validation
  // if (!username || !email || !password || !fullname) {
  //   throw new ApiError(400, "Please provide all the fields");
  // }
  // Another method to check for empty fields using "some"
  if ([username, email, password, fullname].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please provide all the fields");
  }

  // similarly you can check for email validation, username validation like it should only contain chars from a-z,A-z,0-9,.,_
  // check for password validation (min length, max length, special characters, etc)
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req?.files?.coverImage?.[0]?.path;
  console.log("avatarLocalPath", avatarLocalPath);
  console.log("coverImageLocalPath", coverImageLocalPath);

  // Check if the user already exists in the database.
  // using below findOne and $or operator, we can find the user by either username or email
  // it will return the first user it finds which has either username or email matching to our query

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    // remove files stored in temp folder if valid path exists
    avatarLocalPath &&
      fs.unlink(avatarLocalPath, (err) => {
        if (err) throw err;
        console.log("avatarLocalPath was deleted");
      });
    coverImageLocalPath &&
      fs.unlink(coverImageLocalPath, (err) => {
        if (err) throw err;
        console.log("coverImageLocalPath was deleted");
      });
    throw new ApiError(409, "User with this email or username already exists");
  }

  // multer gives us access to request.files
  // TASK: console.log(req.files)
  console.log("req.files", req.files);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload an avatar");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath, "avatar");
  const coverImage = await uploadOnCloudinary(coverImageLocalPath, "coverImage");

  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // we have not checked for coverImageLocalPath before..maybe ye uppload hi na hua ho..but since this is not required in the database, we can just set it to empty string
    email,
    password,
    username: username.toLowerCase(),
  });

  // Now we are checking if user is created successfully
  // And saath hi saath we are also removing the password and refresh token from response
  let userCreated = await User.findById(user._id);
  console.log("userCreated before removing password and refresh token", userCreated);
  userCreated = await User.findById(user._id).select("-password -refreshToken");
  if (!userCreated) {
    throw new ApiError(500, "Failed to create user");
  }
  console.log("userCreated after removing password and refresh token", userCreated);

  return res.status(201).json(new ApiResponse(200, userCreated, "User created successfully"));

  res.send("⚔️ End ⚔️");
});

// login user
// TODOS
// 1. req body se data le aao
// 2. username or email
// 3. check if user exists
// 4. input field validation
// 5. check if password matches
// 6. if password matches, check access token and refresh token
// 7. send cookie

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // if neither email nor username is provided
  if (!email && !username) {
    throw new ApiError(400, "Please provide either email or username");
  }

  // btw here `user` is not a javascript object, it is a mongoose document object
  // and you can convert it to javascript object using `toObject` method like `user.toObject()`
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found ❌");
  }

  // checking password
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password ❌");
  }

  // now if password is correct, we can generate access token and refresh token
  // we need to do this many times so we are creating a seperate function for it
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);

  // remove password and refresh token field from user object
  // console.log("⚡ user object before removing password and refresh token", user);
  // console.log("⚡ user object after removing password and refresh token", user);
  console.log("⚡ user obj: ", user);
  const userWithoutPasswordAndRefreshToken = user.toObject();
  delete userWithoutPasswordAndRefreshToken.password;
  delete userWithoutPasswordAndRefreshToken.refreshToken;
  console.log(
    "⚡ user obj after removing password and refresh token",
    userWithoutPasswordAndRefreshToken
  );
  // now we are designing cookies
  // there are some options in cookies
  // 1. secure: true
  // 2. httpOnly: true
  // 3. sameSite: strict
  // 4. sameSite: lax
  // 5. sameSite: none
  // 6. sameSite: true
  // res.cookie("accessToken", accessToken, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "strict",
  //   maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  // });

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          userWithoutPasswordAndRefreshToken,
          accessToken,
          refreshToken,
        },
        "User logged in successfully ✅"
      )
    );
});

// Steps for logout:
// clear the cookies
// reset the refresh token present insidde user model

// pahle login m to humne user se maang liya tha email and password etc and uske basis pr db query chala di thi.
// ab yaha to user ka access hai hi nhi... to yaha kse pata kre ki konse user ko logout krna hai
// so we will use middleware.

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully ✅"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // sabse pehle we need to access refresh token... it can be accessed using cookies
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request, no incoming refresh token");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or invalid");
    }
    const { newAccessToken, newRefreshToken } = await generateAccessandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            newAccessToken,
            newRefreshToken,
          },
          "Access token refreshed successfully ✅"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Some error occured while refreshing access token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
