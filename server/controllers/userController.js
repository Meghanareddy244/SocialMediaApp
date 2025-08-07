import mongoose from "mongoose";
import Verification from "../models/emailVerification.js";
import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import path from "path";
import PasswordReset from "../models/passwordReset.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import FriendRequest from "../models/FriendRequest.js";

const __dirname = path.resolve(path.dirname(""));

export const verifyEmail = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const result = await Verification.findOne({ userId });
    if (result) {
      const { expiresAt, token: hashedToken } = result;
      if (expiresAt < Date.now()) {
        await Verification.findOneAndDelete({ userId })
          .then(() => {
            Users.findOneAndDelete({ _id: userId }).then(() => {
              const message = encodeURIComponent("Verification Token Expired");
              res.redirect(`/users/verified?status=error&message=${message}`);
            });
          })
          .catch((err) => {
            console.log(err);
            const message = encodeURIComponent(
              "Verification failed due to database error"
            );
            res.redirect(`/users/verified?status=error&message=${message}`);
          });
      } else {
        //token valid
        await compareString(token, hashedToken)
          .then((isMatch) => {
            if (isMatch) {
              Users.findOneAndUpdate({ _id: userId }, { verified: true })
                .then(() => {
                  Verification.findOneAndDelete({ userId }).then(() => {
                    const message = encodeURIComponent(
                      "Email Verified Successfully"
                    );
                    res.redirect(
                      `/users/verified?status=success&message=${message}`
                    );
                  });
                })
                .catch((error) => {
                  console.log(error);
                  const message = encodeURIComponent(
                    "Email Verification Failed or link is invalid"
                  );
                  res.redirect(
                    `/users/verified?status=error&message=${message}`
                  );
                });
            } else {
              const message = encodeURIComponent(
                "Email Verification Failed or link is invalid"
              );
              res.redirect(`/users/verified?status=error&message=${message}`);
            }
          })
          .catch((error) => {
            console.log(error);
            const message = encodeURIComponent(
              "Verification failed due to token comparison error"
            );
            res.redirect(`/users/verified?status=error&message=${message}`);
          });
      }
    } else {
      const message = encodeURIComponent(
        "Invalid verification link. Try again later."
      );
      res.redirect(`/users/verified?status=error&message=${message}`);
    }
  } catch (error) {
    console.log(error);
    const message = encodeURIComponent(
      "Verification failed due to server error"
    );
    res.redirect(`/users/verified?status=error&message=${message}`);
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        status: "FAILED",
        message: "Email is required",
      });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "Email address not found",
      });
    }

    const existingRequest = await PasswordReset.findOne({ email });
    if (existingRequest) {
      if (existingRequest.expiresAt > Date.now()) {
        return res.status(201).json({
          status: "PENDING",
          message: "Password reset request already sent. Try again later",
        });
      }
      await PasswordReset.findOneAndDelete({ email });
    }

    await resetPasswordLink(user, res);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "FAILED",
      message: "Server error occurred while processing request",
    });
  }
};

export const resetPassword = async (req, res) => {
  const { userId, token } = req.params;

  console.log("Reset password link accessed:", {
    userId,
    token: token?.substring(0, 10) + "...",
  });

  try {
    // Validate userId format
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid userId format:", userId);
      const message = encodeURIComponent(
        "Invalid password reset link. Try again later."
      );
      return res.redirect(
        `/users/resetpassword?status=error&message=${message}`
      );
    }

    const user = await Users.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      const message = encodeURIComponent(
        "Invalid password reset link. Try again later."
      );
      return res.redirect(
        `/users/resetpassword?status=error&message=${message}`
      );
    }

    const resetPassword = await PasswordReset.findOne({ userId });
    if (!resetPassword) {
      console.log("Password reset token not found for user:", userId);
      const message = encodeURIComponent(
        "Invalid password reset link. Try again later."
      );
      return res.redirect(
        `/users/resetpassword?status=error&message=${message}`
      );
    }

    const { expiresAt, token: resetToken } = resetPassword;
    console.log("Token expiration check:", {
      expiresAt: new Date(expiresAt),
      now: new Date(),
      isExpired: expiresAt < Date.now(),
    });

    if (expiresAt < Date.now()) {
      // Clean up expired token
      await PasswordReset.findOneAndDelete({ userId });
      console.log("Expired token deleted for user:", userId);
      const message = encodeURIComponent(
        "Password reset link expired. Try again later."
      );
      return res.redirect(
        `/users/resetpassword?status=error&message=${message}`
      );
    } else {
      const isMatch = await compareString(token, resetToken);
      console.log("Token comparison result:", { isMatch });

      if (!isMatch) {
        const message = encodeURIComponent(
          "Invalid password reset link. Try again later."
        );
        return res.redirect(
          `/users/resetpassword?status=error&message=${message}`
        );
      } else {
        console.log("Token valid, redirecting to form for user:", userId);
        return res.redirect(`/users/resetpassword?type=reset&id=${userId}`);
      }
    }
  } catch (error) {
    console.log("Error in resetPassword:", error);
    const message = encodeURIComponent(
      "Server error occurred. Please try again later."
    );
    return res.redirect(`/users/resetpassword?status=error&message=${message}`);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { userId, password } = req.body;

    console.log("Password reset request received:", {
      userId,
      passwordLength: password?.length,
    });

    // Validate input
    if (!userId || !password) {
      console.log("Validation failed: missing userId or password");
      return res.status(400).json({
        success: false,
        message: "User ID and password are required",
      });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid userId format:", userId);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      console.log("Validation failed: password too short");
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user exists
    const existingUser = await Users.findById(userId);
    if (!existingUser) {
      console.log("User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if password reset token still exists (for security)
    const resetToken = await PasswordReset.findOne({ userId });
    if (!resetToken) {
      console.log("No valid reset token found for user:", userId);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset session",
      });
    }

    const hashedPassword = await hashString(password);
    console.log("Password hashed successfully");

    const user = await Users.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (user) {
      console.log("User password updated successfully:", user._id);

      // Clean up the reset token
      await PasswordReset.findOneAndDelete({ userId });
      console.log("Password reset token deleted");

      return res.status(200).json({
        success: true,
        message: "Password reset successfully",
        redirectUrl: `/users/resetpassword?status=success&message=${encodeURIComponent(
          "Password reset successfully"
        )}`,
      });
    } else {
      console.log("Failed to update user password:", userId);
      return res.status(500).json({
        success: false,
        message: "Failed to update password",
      });
    }
  } catch (error) {
    console.log("Error in changePassword:", error);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while resetting password",
    });
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const user = await Users.findById(id ?? userId).populate({
      path: "friends",
      select: "-password",
    });
    if (!user) {
      return res.status(200).send({
        message: "user not found",
        success: false,
      });
    }

    user.password = undefined;

    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, location, profileUrl, profession } = req.body;
    if (!(firstName || lastName || location || profileUrl || profession)) {
      next("provide required fields");
      return;
    }
    const { userId } = req.user;

    const updateUser = {
      firstName,
      lastName,
      location,
      profileUrl,
      profession,
      _id: userId,
    };
    const user = await Users.findByIdAndUpdate(userId, updateUser, {
      new: true,
    });

    await user.populate({
      path: "friends",
      select: "-password",
    });
    const token = createJWT(user._id);
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: user,
      token: token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({
      message: error.message,
    });
  }
};

export const friendRequest = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { requestTo } = req.body;

    const requestExist = await FriendRequest.findOne({
      requestFrom: userId,
      requestTo,
    });
    if (requestExist) {
      next("Friend request already sent");
      return;
    }
    const accountExist = await FriendRequest.findOne({
      requestFrom: requestTo,
      requestTo: userId,
    });

    if (accountExist) {
      next("Friend request already sent");
      return;
    }
    const newRes = await FriendRequest.create({
      requestFrom: userId,
    });
    res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const getFriendRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const request = await FriendRequest.find({
      requestTo: userId,
      requestStatus: "pending",
    })
      .populate({
        path: "requestFrom",
        select: "firstName lastName profileUrl profession -password",
      })
      .limit(10)
      .sort({
        _id: -1,
      });
    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    const id = req.user.userId;
    const { rid, status } = req.body;
    const requestExist = await FriendRequest.findById(rid);
    if (!requestExist) {
      next("No Friend request found");
      return;
    }
    const newRes = await FriendRequest.findByIdAndUpdate(
      { _id: rid },
      { requestStatus: status }
    );
    if (status === "Accepted") {
      const user = await Users.findById(id);

      user.friends.push(newRes?.requestFrom);

      await user.save();

      const friend = await Users.findById(newRes?.requestFrom);
      friend.friends.push(newRes?.requestTo);

      await friend.save();
    }

    res.status(200).json({
      success: true,
      message: "Friend request" + status,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const profileViews = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.body;
    const user = await Users.findById(id);

    user.views.push(userId);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Profile viewed successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const suggestedFriends = async (req, res) => {
  try {
    const { userId } = req.body.user;
    let queryObject = {};
    queryObject._id = { $ne: userId };
    queryObject.friends = { $nin: [userId] };
    let queryResult = Users.find(queryObject)
      .limit(15)
      .select("firstName lastName profileUrl profession -password");
    const suggestedFriends = await queryResult;
    res.status(200).json({
      success: true,
      data: suggestedFriends,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
