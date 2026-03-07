import { asyncHandler } from "../utlis/asyncHandler.js";
import { apiError } from "../utlis/apiError.js";
import { apiResponse } from "../utlis/apiResponse.js";
import { Subscription } from "../models/subscription.model.js"

const toggleSubscription = asyncHandler(async ( req, res ) =>{
    const { channelId } = req.params
    const userId = req.user._id

    if(!channelId){
        throw new apiError(400, "Channel ID is required")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    }) 

    if(existingSubcripition){
        await Subscription.findByIdAndDelete(existingSubcripition._id)

        return res
        .status(200)
        .json(
            new apiResponse(200, {}, "Unscribed successfully")
        )
    }

    const subscription = await Subscription.create({
        subscriber: userId,
        channel: channelId 
    })

    return res
    .status(200)
    .json(
        new apiResponse(200, subscription, "Subcribed Successfully")
    )
})

const getUserChannelSubscribers = asyncHandler(async ( req, res ) =>{
    const { channelId } = req.params

    const subscribers = await Subscription.find({channel: channelId})
    .populate("subcriber","username avatar fullName")

    return res
    .status(200)
    .json(
        new apiResponse(200, subcribers, "Channel subcribers fecthed successfully")
    )
})

const getSubscribedChannels = asyncHandler(async ( req, res ) =>{
    const { subcriberId } = req.params
    
    const channels = await Subscription.find({ subscriber: subscriberId})
    .populate("channels", "username avatar fullname")

return res
    .status(200)
    .json(
new apiResponse(200, channels, "Subcribed Channels fetched successfully")
)
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
}