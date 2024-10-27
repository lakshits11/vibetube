import cookieParser from "cookie-parser";
import express, { urlencoded } from "express";
import cors from "cors";

const app = express();

// Typical Syntax: App.use(middleware)

// Configures the server to allow cross-origin requests (CORS) from the specified origin, enabling cookies and other credentials to be shared between the client and server.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Configures the Express app to parse URL-encoded form data with extended syntax support and a maximum size limit of 16 kilobytes.
app.use(express.urlencoded({ extended: true }));

// Sets up the Express app to parse incoming JSON data with a maximum size limit of 16 kilobytes.
app.use(express.json());

/*
1. `app.use(express.static("public"));`: This serves static files (like HTML, CSS, and images) from the "public" directory to the client.
   
2. `app.use(cookieParser());`: This sets up middleware to parse cookies from incoming requests, making them accessible via `req.cookies`.
*/

app.use(express.static("public"));
app.use(cookieParser());
// cookieParser lets us access and set cookies in user's browser from server
// (basically lets us do crud operation on cookies)

// routes import
import userRouter from "./routes/user.routes.js";

// routes declaration
// here we dont directly write app.get or app.post
// we use middleware which gives control to userRouter
// Now userRouter will see what to do with a given route
app.use("/api/v1/users", userRouter);

export { app };
