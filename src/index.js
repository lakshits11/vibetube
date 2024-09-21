import { app } from "./app.js";
import connectDB from "./db/index.js";

connectDB()
  .then(() => {

    app.on("error", (err)=>{
      console.log("Err");
      
    })

    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed... ", err);
  });

// This is another approach. Better is above one.
/*
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Errr: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`Application listening on port: ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
})();
*/
