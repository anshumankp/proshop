import asyncHandler from 'express-async-handler';
import generateToken from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
import mailgun from 'mailgun-js';

dotenv.config();
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_KEY = process.env.MAILGUN_KEY;
const mg = mailgun({ apiKey: MAILGUN_KEY, domain: MAILGUN_DOMAIN });

//@desc Auth user & get token
//@route POST /api/users/login
//@access Public

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id)
    });
  } else {
    res.status(404);
    throw new Error('Invalid Email or Password');
  }
});

//@desc Register a new user
//@route POST /api/users/
//@access Public

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

//@desc Get user profile
//@route GET /api/users/profile
//@access Private

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

//@desc Get all users
//@route GET /api/users/
//@access Private/Admin

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

//@desc Get user by ID
//@route GET /api/users/:id
//@access Private/Admin

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

//@desc Delete a user
//@route DELETE /api/users/:id
//@access Private/Admin

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

//@desc Update user profile
//@route PUT /api/users/profile
//@access Private

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id)
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

//@desc Update a user
//@route PUT /api/users/:id
//@access Private, Admin

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

//@desc Email the user with the password resetLink
//@route PUT /api/users/forgot-password
//@access Public

const forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res
        .status(400)
        .json({ message: 'User with this email does not exist' });
    }

    const token = generateToken(user._id);
    const data = {
      from: 'noreply@proshop.in',
      to: email,
      subject: 'Reset Proshop Password',
      html: `
      <h2>Please click on the given link to reset your password<h2>
      <p>${process.env.CLIENT_URL}/reset-password/${token}</p>
      `
    };

    return user.updateOne({ resetLink: token }, function(err, success) {
      if (err) {
        return res.status(400).json({ error: 'Reset password link error' });
      } else {
        mg.messages().send(data, function(error, body) {
          if (error) {
            return res.json({ error: error.message });
          }
          return res.json({
            message: 'Email has been sent, kindly follow the instructions'
          });
        });
      }
    });
  });
};

//@desc Allows user to update password using the resetLink received in email
//@route PUT /api/users/reset-password
//@access Public

const resetPassword = (req, res) => {
  const { resetLink, newPass } = req.body;
  if (resetLink) {
    jwt.verify(resetLink, process.env.JWT_SECRET, function(error, decodedData) {
      if (error) {
        return res.status(401).json({ message: 'Token incorrect or expired' });
      }
      User.findOne({ resetLink }, function(err, user) {
        if (err || !user) {
          return res
            .status(400)
            .json({ message: 'Token incorrect or expired' });
        }
        const obj = {
          password: newPass,
          resetLink: ''
        };

        user = Object.assign(user, obj);

        user.save((err, result) => {
          if (err) {
            return res
              .status(401)
              .json({ error: 'Token incorrect or expired' });
          } else {
            res.status(200).json({ message: 'Your password has been changed' });
          }
        });
      });
    });
  } else {
    return res.status(401).json({ error: 'Authentication Error' });
  }
};

export {
  authUser,
  registerUser,
  getUserProfile,
  getUserById,
  getUsers,
  deleteUser,
  updateUser,
  updateUserProfile,
  forgotPassword,
  resetPassword
};
