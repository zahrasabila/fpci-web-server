const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const User = require("../models/userModel");
const HttpError = require("../models/errorModel");

// =====================REGISTER A NEW USER
// POST : api/users/register
// UNPROTECTED
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, password2 } = req.body;
    if (!name || !email || !password) {
      return next(new HttpError("Please fill in all fields", 422));
    }

    const newEmail = email.toLowerCase();

    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return next(new HttpError("Email already exists", 422));
    }

    if (password.trim().length < 6) {
      return next(new HttpError("Password must be at least 6 characters", 422));
    }

    if (password !== password2) {
      return next(new HttpError("Passwords do not match", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      name,
      email: newEmail,
      password: hashedPassword,
    });
    res.status(201).json(`New user ${newUser.email} registered`);
  } catch (error) {
    return next(new HttpError("User registration failed", 422));
  }
};

// =====================USER PROFILE
// POST : api/users/:id
// PROTECTED
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return next(new HttpError("User not found", 404));
    }
    res.status(200).json(user);
  } catch (error) {}
};

// =====================LOGIN A REGISTERED USER
// POST : api/users/login
// UNPROTECTED
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Please fill in all fields", 422));
    }
    const newEmail = email.toLowerCase();

    const user = await User.findOne({ email: newEmail });

    if (!user) {
      return next(new HttpError("Invalid credentials", 422));
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return next(new HttpError("Invalid credentials", 422));
    }

    const { _id: id, name } = user;
    const token = jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, id, name });
  } catch (error) {
    return next(new HttpError("User login failed", 422));
  }
};

// =====================CHANGE USER AVATAR (profile picture)
// POST : api/users/change-avatar
// PROTECTED
const changeAvatar = async (req, res, next) => {
  try {
    if (!req.files.avatar) {
      return next(new HttpError("Please upload an image", 422));
    }

    //find user from database
    const user = await User.findById(req.user.id);
    //delete old image
    if (user.avatar) {
      fs.unlink(path.join(__dirname, "..", "uploads", user.avatar), (err) => {
        if (err) {
          return next(new HttpError(err));
        }
      });
    }

    const { avatar } = req.files;
    //check file size
    if (avatar.size > 500000) {
      return next(
        new HttpError("File size too large. Should be less than 500kb", 422)
      );
    }

    let fileName;
    fileName = avatar.name;
    let splittedFilename = fileName.split(".");
    let newFilename =
      splittedFilename[0] +
      uuid() +
      "." +
      splittedFilename[splittedFilename.length - 1];
    avatar.mv(
      path.join(__dirname, "..", "uploads", newFilename),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        }

        const updatedAvatar = await User.findByIdAndUpdate(
          req.user.id,
          { avatar: newFilename },
          { new: true }
        );
        if (!updatedAvatar) {
          return next(new HttpError("Avatar couldn't be changed", 422));
        }
        res.status(200).json(updatedAvatar);
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =====================EDIT USER DETAILS (from profile)
// POST : api/users/edit-user
// UNPROTECTED
const editUser = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword, confirmNewPassword } =
      req.body;
    if (!name || !email || !currentPassword || !newPassword) {
      return next(new HttpError("Please fill in all fields", 422));
    }

    //get user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError("User not found", 403));
    }

    //make sure new email doesn't already exist
    const emailExists = await User.findOne({ email });
    //we want to update other details with/without changing the email (which is a unique id because we use it to login)
    if (emailExists && emailExists.id !== req.user.id) {
      return next(new HttpError("Email already exists", 422));
    }
    //compare current password to db password
    const validateUserPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!validateUserPassword) {
      return next(new HttpError("Current password is incorrect", 422));
    }

    //compare new passwords
    if (newPassword !== confirmNewPassword) {
      return next(new HttpError("Passwords do not match", 422));
    }

    //hash new password
    const salt = await bcrypt.genSalt(10);
    const Hash = await bcrypt.hash(newPassword, salt);

    //update user info in database
    const newInfo = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        password: Hash,
      },
      { new: true }
    );
    res.status(200).json(newInfo);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =====================GET AUTHORS
// POST : api/users/authors
// UNPROTECTED
const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select("-password");
    res.json(authors);
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  changeAvatar,
  editUser,
  getAuthors,
};
