import { asyncHandler } from "../utlis/asyncHandler.js";
import { apiError } from "../utlis/apiError.js";
import { apiResponse } from "../utlis/apiResponse.js";
import { Tweet } from "../models/tweet.model.js"

const createTweet = asyncHandler(async ( req, res ) =>{
    const { content } = req.body

    if(!content?.trim()){
        throw new apiError(400, "Tweet content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if(!tweet){
        throw new apiError(500, "Failed to create tweet")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, tweet, "Tweet created Successfully")
    )
})

const getAllTweets = asyncHandler(async (req, res) => {
    let { page = 1, limit = 30 } = req.query
    page = parseInt(page, 10) || 1
    limit = parseInt(limit, 10) || 30
    const skip = (page - 1) * limit

    const tweets = await Tweet.find({})
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

    return res
    .status(200)
    .json(
        new apiResponse(200, tweets, "Tweet feed fetched successfully")
    )
})

const getUserTweet = asyncHandler(async ( req, res ) =>{
    const { userId } = req.params
    
    const tweets = await Tweet.find({ owner: userId})
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 })

    return res
    .status(200)
    .json(
        new apiResponse(200, tweets, "Tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async ( req, res ) =>{
    const { tweetId } = req.params
    const { content } = req.body

    if(!content?.trim()){
        throw new apiError( 400, "Content cannot be empty")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new apiError( 400, "Tweet cannot be found")
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new apiError(400, "Unauthorized to udpat tweet")
    }

    tweet.content = content
    await tweet.save()

    return res
    .status(200)
    .json(
        new apiResponse(200, tweet, "Tweet updated Successfully")
    )
})

const deleteTweet = asyncHandler(async ( req, res ) =>{
    const { tweetId } = req.params

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new apiError(400, "Tweet not found")
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new apiError(400, "Unauthorized to udpat tweet")
    }

    await tweet.deleteOne()

    return res
    .status(200)
    .json(
        new apiResponse(200, {}, "Tweet delted Successfully")
    )

})

export {
    getAllTweets,
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}
