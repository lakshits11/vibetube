import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  // Check if the user already exists in the database.
  // using below findOne and $or operator, we can find the user by either username or email
  // it will return the first user it finds which has either username or email matching to our query
  const existedUser = User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // multer gives us access to request.files
  // TASK: console.log(req.files)
  console.log("req.files", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log("avatarLocalPath", avatarLocalPath);
  console.log("coverImageLocalPath", coverImageLocalPath);

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
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!userCreated) {
    throw new ApiError(500, "Failed to create user");
  }
  console.log("userCreated", userCreated);

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User created successfully"));

  res.send("⚔️ End ⚔️");
});

export { registerUser };