const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_KEY_SECRET,
});

// const uploadToCloudinary = async (path, folder = "uploads") => {
//   try {
//     const data = await cloudinary.uploader.upload(path, { folder: folder });
//     return { url: data.secure_url, publicId: data.public_id };
//   } catch (err) {
//     console.log(err);
//     throw err;
//   }
// };
module.exports = { cloudinary };
