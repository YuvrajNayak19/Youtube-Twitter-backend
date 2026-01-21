import { User } from "../models/user.model";
import { apiError } from "../utlis/apiError";
import { asyncHandler } from "../utlis/asyncHandler";
import jwt from 'jsonwebtoken'

export const verifyJWT = asyncHandler(async(req, _, next) =>{
    try {
        const token = req.cookies?.accessToken || req.Header("Authorization")?.replace('Bearer ', '')
    
        if(!token){
            throw new apiError(401, "Unauthorized request")
        }
    
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodeToken._id).select("-password -refreshToken ")
    
        if(!user){
            throw new apiError(401, "Unauthorized Access Token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new apiError(401, error?.message || "Invaild Access Token")
    }
})