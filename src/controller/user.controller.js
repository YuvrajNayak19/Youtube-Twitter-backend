import { asyncHandler } from '../utlis/asyncHandler.js';
import { apiError } from '../utlis/apiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utlis/cloudinary.js'
import { apiResponse } from '../utlis/apiResponse.js';

const genrateAccessAndRefereshToken = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.genrateAccessToken()
        const refreshToken = user.genrateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ vaildateBeforeSave: false })

        return{ accessToken, refreshToken }
    } catch (error) {
        throw new apiError(500, "Something went wrong while genrating Access or Refresh token")
    }
}

const registerUser = asyncHandler(async ( req, res ) =>{
    const { fullName, email, password, username} = req.body
    
    if (
        [fullName, email, password, username].some((fields) => fields?.trim() === "")
    ) {
        throw new apiError(400, "All Fields are required")
    }

    const userExists = await User.findOne({
        $or: [{email}, {username}]
    })

    if(userExists){
         throw new apiError(409, "User Already Exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    let coverImageLocalPath;
    if(req.files && req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage[0] > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new apiError(400, "avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400, "Failed to upload avatar to cloudinary")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password, 
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!userCreated){
        throw new apiError(500, "Something went wrong while creating the user")
    }

    return res.status(201).json(
        new apiResponse(200, userCreated, "User registered successfully")
    )
})

const loginUser = asyncHandler(async ( req, res ) => {
    const { username, email, password } = req.body

    if (!( username || email)) {
        throw new apiError(400, "username or email is required")
    }
     const user = await User.findOne({
        $or: [{email},{username}]
     })

     if(!user){
        throw new apiError(404, "User does not exist")
     }

     const isPasswordVaild = await user.isPasswordCorrect(password)

     if(!isPasswordVaild){
        throw new apiError(401, "Invaild user credentials")
     }

      const { accessToken, refreshToken } = await genrateAccessAndRefereshToken(user._id)

      const loggedInUser = await User.findById(user._id).select(-password -refreshToken)

      const options = {
        httpOnly : true,
        secure : true,
      }

      return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new apiResponse(
            200,
            {
                user: refreshToken, loggedinUser, accessToken
            },
            "User logged in successfully"
        )
      )
})

const logoutUser = asyncHandler(async ( req, res ) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }

    )
    const options = {
        htppOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new apiResponse(200, {}, 'User logged Out')
    )
})

export { 
    registerUser, 
    loginUser,
    logoutUser
 }