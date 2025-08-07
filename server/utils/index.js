import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

export const hashString = async (userValue) => {
  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(userValue, salt);
  return hashedPassword;
};

export const compareString = async (userPassword, password) => {
  const isMatch = await bcrypt.compare(userPassword, password);
  return isMatch;
};
export function createJWT(id) {
  return JWT.sign({ userId: id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
}



// // Upload image
// const uploadImage = async (file, folder) => {
//   const res = await cloudinary.uploader.upload(file, {
//     folder: folder || "social-media",
//     resource_type: "image",
//   });
//   return res;
// };

// // Delete image using public_id
// const deleteImage = async (publicId) => {
//   await cloudinary.uploader.destroy(publicId);
// };

// module.exports = { uploadImage, deleteImage };
