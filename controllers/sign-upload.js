const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_KEY_SECRET,
  secure: true,
});

const generateSignature = (req, res, next) => {
  const { folder } = req.body;

  if (!folder) {
    res.status(400);
    return next(new Error("folder name is required"));
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUD_KEY_SECRET
    );

    res.status(200).json({ timestamp, signature });
  } catch (error) {
    console.log(error);
    res.status(500);
    next(error);
  }
};

module.exports = { generateSignature };
