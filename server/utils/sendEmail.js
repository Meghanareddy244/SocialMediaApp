import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { hashString } from "./index.js";
import Verification from "../models/emailVerification.js";
import PasswordReset from "../models/passwordReset.js";

dotenv.config();

const { AUTH_EMAIL, AUTH_PASSWORD, APP_URL } = process.env;

let transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: AUTH_EMAIL,
    pass: AUTH_PASSWORD,
  },
});

export const sendVerificationEmail = async (user, res) => {
  const { _id, email, lastName } = user;
  const token = _id + uuidv4();
  const url = APP_URL !== undefined ? APP_URL : "https://mern-socialmedia-9s33.onrender.com";
  const link = url + "/users/verify/" + _id + "/" + token;

  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Email Verification",
    html: `<div
        style='font-family: Arial, sans-serif; font-size:20px;color:#333; background-color:white'>
        <h1 style='color:rgb(8,56,188)'>Please verify your email address</h1>
        <h3>Hi ${lastName}</h3>
        <p>please verify your email address so we can know that it's  really you</p>
        <br>
        <p>Click <a href="${link}">here</a> to verify your account.</p>
        <div style="margin-top:20px;">
        <h5>Best Regards</h5>
        <h5>ShareFun Team</h5>
        </div>
        </div>`,
  };

  try {
    const hashedToken = await hashString(token);
    const newVerificationEmail = await Verification.create({
      userId: _id,
      token: hashedToken,
      createAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    if (newVerificationEmail) {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).send({
            success: "PENDING",
            message: "Verification email sent successfully",
          });
        })
        .catch((error) => {
          console.log(error);
          res.status(404).json({ message: "Something went wrong" });
        });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};

export const resetPasswordLink = async (user, res) => {
  const { _id, email } = user;
  const token = _id + uuidv4();
  const url = APP_URL !== undefined ? APP_URL : "https://mern-socialmedia-9s33.onrender.com";
  const link = url + "/users/reset-password/" + _id + "/" + token;

  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Password Reset",
    html: `<div
            style='font-family: Arial, sans-serif; font-size:20px;color:#333; background-color:white'>
            <h1 style='color:rgb(8,56,188)'>Password Reset Request</h1>
            <h3>Hi ${user.firstName}</h3>
            <p>Click <a href="${link}">here</a> to reset your password.</p>
            <div style="margin-top:20px;">
            <h5>Best Regards</h5>
            <h5>ShareFun Team</h5>
            </div>
            </div>`,
  };

  try {
    const hashedToken = await hashString(token);
    const resetEmail = await PasswordReset.create({
      userId: _id,
      email: email,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000,
    });
    if (resetEmail) {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).send({
            success: "PENDING",
            message: "Password reset email sent successfully",
          });
        })
        .catch((error) => {
          console.log(error);
          res.status(404).json({ message: "Something went wrong" });
        });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};
