import { asyncHandler } from '../utlis/asyncHandler.js';
import { apiError } from '../utlis/apiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utlis/cloudinary.js'
import { apiResponse } from '../utlis/apiResponse.js';

const registerUser = asyncHandler(async (req, res) =>{
    const { fullName, email, password, username} = req.body
    
    if (
        [fullName, email, password, username].some((fields) => fields?.trim() === "")
    ) {
        return new apiError([400, "All Fields are required"])
    }

    const userExists = User.findOne({
        $or: [{email}, {username}]
    })

    if(userExists){
         throw new apiError([409, "User Already Exists"])
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!avatarLocalImage) {
        throw new apiError([400, "avatar is required"])
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError([400, "avatar is required"])
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        avatar: avatar,
        coverImage: coverImage || "",
        email,
        password, 
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(userCreated){
        throw new apiError(500, "Something went wrong while creating the user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    )
})

export { registerUser }