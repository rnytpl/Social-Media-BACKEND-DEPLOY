import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";

export const register = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    password,
    email,
    picturePath,
    friends,
    location,
    occupation,
    viewedProfile,
    impressions,
  } = req.body;

  // Check required fields
  const checkFields = [firstName, lastName, password, email].every(Boolean);

  if (!checkFields) {
    res.status(200).json({ message: "Please fill out required fields" });
    throw new Error("Fill all fields");
  }

  const duplicateEmail = await User.findOne({ email }).lean().exec();

  if (duplicateEmail) {
    res.status(400).json({ message: "Email adress is already in use" });
    throw new Error("Duplicate User");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = await User.create({
    firstName,
    lastName,
    password: hashedPassword,
    email,
    picturePath,
    friends,
    location,
    occupation,
    viewedProfile: Math.floor(Math.random() * 100),
    impressions: Math.floor(Math.random() * 60),
  });

  // Check if a new user created

  if (!newUser) {
    res.status(401).json({ message: "User couldn't be created" });
    throw new Error("User creation failed");
  }

  res
    .status(200)
    .json({ message: `New user created ${newUser.firstName}`, newUser });
});

//// LOGIN
export const login = asyncHandler(async (req, res) => {
  console.log("login");
  const { email, password } = req.body;
  if (!email || !password) {
    res
      .status(400)
      .json({ message: "Please enter a valid email or username." });
    throw new Error("Invalid credentials");
  }

  // Find User by email
  const findUser = await User.findOne({ email })
    .populate("friends")
    .lean()
    .exec();

  // Check if user is found
  if (!findUser) {
    return res.status(400).json({ message: "User not found" });
    // throw new Error("User not found")
  }

  const isMatch = await bcrypt.compare(password, findUser.password);
  if (!isMatch) {
    res.status(400).json({ message: "Invalid credentials" });
    throw new Error("Invalid credentials");
  }

  let token;
  if (isMatch) {
    token = jwt.sign({ id: findUser._id }, process.env.JWT_SECRET_KEY);
  }
  delete findUser.password;
  return res.status(200).json({ token, findUser });
});
