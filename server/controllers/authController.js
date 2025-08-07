import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";


export const register = async (req, res, next) => {
    const {firstName,lastName,email,password} = req.body;

    if(!(firstName || lastName || email || password)){
        next("Provide Required Fields");
        return;
    }
    try {
        const userExist=await Users.findOne({email});
        if(userExist){
            next("User Already Exists");
            return;
        }
        const hashedPassword = await hashString(password);

        const user = await Users.create({
            firstName,
            lastName,
            email,
            password:hashedPassword,
        });
        sendVerificationEmail(user,res);
 
    } catch (error) {
        console.log(error);
        res.status(404).json({message:error.message});
    }
};

export const login =async (req,res,next) => {
    const {email, password} = req.body;

    try {
        if(!email || !password){
            next("please provide user credentials");
            return;
        }

        const user = await Users.findOne({email}).select("+password").populate({
            path:"friends",
            select:"firstName lastName location profileUrl -password",
        });

        if(!user){
            next("Invalid Credentials");
            return;
        }
        if(!user?.verified){
            next("user email is not verified . check your email account and verify your mail");
            return;
        }
        const isMatch = await compareString(password,user?.password);
        if(!isMatch){
            next("Invalid email or password");
            return;
        }
        user.password = undefined;
        const token = createJWT(user?._id);

        res.status(201).json({
            success:true,
            message:"user logged in successfully",
            token,
            user
        });
        

    } catch (error) {
        res.status(404).json({message:error.message});
    }
}