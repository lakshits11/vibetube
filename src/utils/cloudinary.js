import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    console.log("file uploaded on cloudinary, url: ", response.secure_url);
    console.log("☁️ Complete response from cloudinary: ", response);
    
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // removes the locally saved temp file if upload fails
    console.log("error uploading file on cloudinary: ", error);
    return null;
  }
};

export { uploadOnCloudinary };
