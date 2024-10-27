import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, getCloudinaryPublicIdFromUrl, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

const isValidEmail = (email) => {
  if (!email) return "Enter valid email.";
  email = email.toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return "Enter valid email.";
  }
  return true;
};

const isValidUsername = (username) => {
  if (!username) return "Enter valid username.";
  username = username.toLowerCase();
  const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
  if (!usernameRegex.test(username)) {
    return "Enter valid username.";
  }
  return true;
};

const isValidPassword = (password) => {
  if (!password) return "Enter valid password.";
  const passwordRegex = /^[A-Za-z\d!@#$%^&*()_+~`\-]{5,16}$/;
  if (!passwordRegex.test(password)) {
    return "Enter valid password.";
  }
  return true;
};

const isValidFullname = (fullname) => {
  if (!fullname || fullname.trim().length === 0)
    return "Enter a valid fullname.";
  const fullnamePattern = /^[a-zA-Z]+(?: [a-zA-Z]+)?$/;
  if (!fullnamePattern.test(fullname.trim())) {
    return "Enter valid fullname.";
  }
  return true;
};

const validateFields = (fields) => {
  const errors = [];
  const validators = {
    email: isValidEmail,
    username: isValidUsername,
    password: isValidPassword,
    fullname: isValidFullname,
  };

  // Loop through each field provided in the fields object
  Object.keys(fields).forEach((field) => {
    if (validators[field]) {
      const validationResult = validators[field](fields[field]);
      if (validationResult !== true) {
        errors.push({ field, message: validationResult });
      }
    }
  });

  if (errors.length > 0) {
    console.log("⚡ errors: ", errors);
    throw new ApiError(400, "Validation failed", errors);
  }

  return true; // All fields are valid
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

  validateFields({
    username: username,
    email: email,
    password: password,
    fullname: fullname,
  });

  // ✅ DONE similarly you can check for email validation, username validation like it should only contain chars from a-z,A-z,0-9,.,_
  // ✅ DONE check for password validation (min length, max length, special characters, etc)
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
    username,
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

  if (username) {
    validateFields({
      username: username,
      password: password,
    })
  }
  else {
    validateFields({
      email: email,
      password: password
    })
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
  const userWithoutPasswordAndRefreshToken = user.toObject();
  delete userWithoutPasswordAndRefreshToken.password;
  delete userWithoutPasswordAndRefreshToken.refreshToken;
  // console.log("⚡ user obj after removing password and refresh token", userWithoutPasswordAndRefreshToken,); 
  
  // now we are designing cookies
  // there are some options in cookies
  // 1. secure: true
  // 2. httpOnly: true
  // 3. sameSite: strict/lax/none/true
  // 4. maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days

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
        "User logged in successfully ✅",
      ),
    );
});

// Steps for logout:
// clear the cookies
// reset the refresh token present insidde user model

// pahle login m to humne user se maang liya tha email and password etc and uske basis pr db query chala di thi.
// ab yaha to user ka access hai hi nhi... to yaha kse pata kre ki konse user ko logout krna hai
// so we will use middleware.

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        // refreshToken: undefined,
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    },
  );
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
    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            newAccessToken,
            newRefreshToken,
          },
          "Access token refreshed successfully ✅",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Some error occured while refreshing access token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Please provide both current password and new password ❌");
  }

  validateFields({ password: newPassword });

  // Now thinking process:
  // If user is able to change password, it means the user is logged in
  // If he is logged in, we can get the user id from the request object

  const user = await User.findById(req.user?._id);
  const isEnteredPasswordCorrect = await user.isPasswordCorrect(currentPassword);
  if (!isEnteredPasswordCorrect) {
    throw new ApiError(400, "Invalid current password ❌");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully ✅"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully ✅"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email, username } = req.body;
  
  // Normalize and trim input for consistency
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedUsername = username?.trim().toLowerCase();

  // one approach to check which fields are updated is to create a new object and set only the fields that are updated
  const updateFields = {};
  if (fullname) updateFields.fullname = fullname.trim(); // Trim it to avoid leading/trailing spaces
  if (normalizedEmail) updateFields.email = normalizedEmail;
  if (normalizedUsername) updateFields.username = normalizedUsername;
  
  validateFields(updateFields);

  // if neither of three are sent, it means user doesn't want to update anything
  // so we can throw an error
  if (!fullname && !email && !username) {
    throw new ApiError(400, "Please provide any of the fields");
  }

  // check if username/email is updated, they already do not belong to any other user
  // also removes current username and email from search area
  // $ne (not equal) excludes the current user's ID from the search
  if (normalizedUsername || normalizedEmail) {
    const queryConditions = [];

    if (normalizedUsername) queryConditions.push({ username: normalizedUsername });
    if (normalizedEmail) queryConditions.push({ email: normalizedEmail });

    const existingUser = await User.findOne({
      $or: queryConditions,
      _id: { $ne: req.user._id }, // Exclude the current user
    });

    if (existingUser) {
      if (existingUser.username === normalizedUsername) {
        throw new ApiError(400, "Username already exists.");
      } else if (existingUser.email === normalizedEmail) {
        throw new ApiError(400, "Email already exists.");
      }
    }
  }


  // another approach is to check this while destructuring req.body itself
  /*
  const updateFields = Object.fromEntries(
  Object.entries(req.body).filter(([_, v]) => v != null)
  );

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "Please provide at least one field to update");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true }
  ).select("-password");
*/

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true, select: "-password" }, // Return the updated user without the password field
  );

  // setting new:true returns the updated user with new info

  if (!updatedUser) {
    throw new ApiError(404, "User not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account details updated successfully ✅"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // Get the current user's avatar URL (to delete later)
  const currentUser = await User.findById(req.user?._id).select("avatar");
  const currentAvatarUrl = currentUser.avatar;
  console.log("⚡ currentAvatarUrl: ", currentAvatarUrl);
  

  const newAvatar = await uploadOnCloudinary(avatarLocalPath);
  if (!newAvatar) {
    throw new ApiError(400, "Failed to upload avatar ❌");
  }
  console.log("⚡ newAvatar: ", newAvatar);

  //✅ DONE: REMOVE PREVIOUS AVATAR IMAGE FROM CLOUDINARY AND ALSO FROM TEMP FOLDER

  // SEE: updateUserAvatar.md for some notes !! MUST READ !!

  // CHECK BELOW COMMENTED CODE IF ITS CORRECT ALSO
  // const user = await User.findById(req.user?.id);
  // user.avatar = avatarCloudinaryUrl;
  // await user.save({ validateBeforeSave: false });

  // update the user's avatar in the database
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: newAvatar.url,
      },
    },
    { new: true, select: "-password" },
  );

  // If update fails, delete the newly uploaded avatar to maintain consistency
  if (!updatedUser) {
    await deleteFromCloudinary(newAvatar.public_id);
    throw new ApiError(400, "Failed to update user avatar ❌");
  }

  // Delete the previous avatar from Cloudinary (if it exists)
  if (currentAvatarUrl) {
    const currentAvatarPublicId = await getCloudinaryPublicIdFromUrl(currentAvatarUrl);
    console.log("⚡ currentAvatarPublicId: ", currentAvatarPublicId);
    await deleteFromCloudinary(currentAvatarPublicId);
  }

  return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successfully ✅"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  // Get the current user's cover image URL
  const currentUser = await User.findById(req.user?._id).select("coverImage");
  const currentCoverImageUrl = currentUser?.coverImage;

  const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!newCoverImage) {
    throw new ApiError(400, "Failed to upload new cover image on cloudinary ❌");
  }

  // Update the user's cover image in the database
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: newCoverImage.url,
      },
    },
    { new: true, select: "-password" },
  );

  // If update fails, delete the newly uploaded cover image to maintain consistency
  if (!updatedUser) {
    await deleteFromCloudinary(newCoverImage.public_id);
    throw new ApiError(400, "Failed to update user cover image ❌");
  }

  // Delete the previous cover image from Cloudinary (if it exists)
  if (currentCoverImageUrl) {
    await deleteFromCloudinary(await getCloudinaryPublicIdFromUrl(currentCoverImageUrl));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Cover image updated successfully ✅"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Please provide username");
  }

  // aggregate always returns an array of documents
  // we can use $match to filter the documents
  // and $group to group the documents
  // and $count to count the number of documents
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", // since model name is Subscription and we know mongodb converts everything to lowercase and makes it plural, we are usingsubscriptions
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedToChannels",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedToChannelsCount: {
          $size: "$subscribedToChannels",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        subscribedToChannelsCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        createdAt: 1,
      },
    },
  ]);
  console.log("⚡ channel : ", channel);

  if (!channel?.length) {
    throw new ApiError(404, "Channel doesnt exist❌");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel details fetched successfully ✅"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        // aggregation pipelines ka code directly hi jaata hai...yaha automatic conversion nhi hota ki hum req.user._id likhe and mongodb id mil jaaye..wo mongoose bts kaam krta hai pr yaha nhi krega..to yaha sirf string mil jaayegi and actual mongodb ObjectId nhi milegi
        _id: new mongoose.Types.ObjectId(String(req.user._id)),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          // pipeline #1
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          // pipeline #2
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully ✅"));
});
// although our work is done after pipeline #1, but for the convinience of frontend dev,
// we are making a new pipeline to extract the owner of the watch history
// since owner will be stored in an object in first element(at zeroth position) of owner(that we get from first pipeline)
// so we are making a new pipeline to extract the owner and overwriting the field

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
