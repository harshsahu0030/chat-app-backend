import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "chat-app-rista",
    });
    // file has been uploaded successfull

    // Optimize delivery by resizing and applying auto-format and auto-quality
    await cloudinary.url("chat-app-rista", {
      fetch_format: "auto",
      quality: "auto",
    });

    // console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log(error);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const destroyOnCloudinary = async (public_id) => {
  try {
    if (!public_id) return null;

    await cloudinary.uploader.destroy(public_id);
    return response;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export { uploadOnCloudinary, destroyOnCloudinary };
