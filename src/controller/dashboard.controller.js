import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    
    const channelId = req.user._id

    const totalVideo = await Video.countDocuments({
        owner: channelId
    })

    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views"}
            }
        }
    ])

    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })

    const totalLikes = await Like.aggregate([
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {
            $unwind: "$video"
        },
        {
            $match:{
                "video.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totalLikes"
        }
    ])

    const status = {
        totalVideo,
        totalViews: totalViews?.[0].totalViews || 0,
        totalSubscribers,
        totalLikes: totalLikes?.[0].totalLikes || 0
    }

    return res 
    .status(200)
    .json(
        new ApiResponse(200, status, "Channel status fetched successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id

    const videos = await Video.find({
        owner: channelId
    }).sort({ createdAt: -1 })
})

export {
    getChannelStats, 
    getChannelVideos
    }