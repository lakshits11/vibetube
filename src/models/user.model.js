import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true, // Removes leading and trailing whitespace
      index: true, // Makes username search more optimised (iske bina bhi search to kr hi skte)
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/*
pre is a hook
Mongoose gives us functionality to use some hooks.
Hooks basically gives us option to do some action before/after/between doing another action
for example, pre hook basically allows us to run some function just before another action is performed
that action can be "save", "delete" etc (these are fixed)

so here we want that just before password is saved, we want to encrypt them
"save" action likhne ke baad next parameter is a callback.
we are not using arrow functions here for callback because they dont have "this" keyword reference meaning they dont have context
thats why we are using callbacks in classic function way
also we are making it async since encrypting may take some time

next => ye cheez perform ho jaane ke baad aage kya krna wo batata
```js
userSchema.pre("save", async function (next) {
  this.password = bcrypt.hash(this.password, 10)
  next()
})
```

Now above function m ek problem hai
it encrypts password whenever "any", I mean ANY field is updated and saved.
so even if password is already encrypted and not updated, it will again do 10 rounds of encryption on that already encrypted password.
*/

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = bcrypt.hash(this.password, 10);
    next();
  }
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userSchema);
