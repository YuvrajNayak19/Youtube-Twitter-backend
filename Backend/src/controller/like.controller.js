import { apiError } from '../utlis/apiError.js'
import { apiResponse } from '../utlis/apiResponse.js'
import { asyncHandler } from '../utlis/asyncHandler.js'
import { Like } from '../models/likes.model.js'

const toggleVideoLike = asyncHandler(async ( req, res ) =>{
    const { videoId } = req.params

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(
            new apiResponse(200, {}, "Video unliked successfully")
        )
    }

    const like = Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res
    .status(200)
    .json(
        new apiResponse(200, like, "Video Liked Successfully")
    )
})

const toggleTweetLike = asyncHandler(async ( req, res ) =>{
    const { tweetId } = req.params

   const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(
            new apiResponse(200, {}, "Tweet unliked successfully")
        )
    }

    const like = Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res
    .status(200)
    .json(
        new apiResponse(200, like, "Tweet Liked Successfully")
    )
})

const toggleCommentLike = asyncHandler(async ( req, res ) =>{
    const { commentId } = req.params

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(
            new apiResponse(200, {}, "Comment unliked successfully")
        )
    }

    const like = Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res
    .status(200)
    .json(
        new apiResponse(200, like, "Comment Liked Successfully")
    )
})

const getAllLikedVideos = asyncHandler(async ( req, res ) =>{
    
    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: { $exists: true, $ne: null }
    }).populate({
        path: "video",
        populate:{
            path: "owner",
            select: "username avatar"
        }
    })

    return res
    .status(200)
    .json(
        new apiResponse(200, likedVideos, "Liked Video fetched Successfully")
    )
})

export {
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getAllLikedVideos
}