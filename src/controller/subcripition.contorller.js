import { asyncHandler } from "../utlis/asyncHandler";
import { apiError } from "../utlis/apiError";
import { apiResponse } from "../utlis/apiResponse";
import { Subcription, Subscription } from "../models/subcripition.model.js"

const toggleSubcription = asyncHandler(async ( req, res ) =>{
    const { channelId } = req.params
    const userId = req.user._id

    if(!channelId){
        throw new apiError(400, "Channel ID is required")
    }

    const existingSubcripition = await Subcription.findOne({
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

    const subscription = await Subcription.create({
        subscriber: userId,
        channel: channelId 
    })

    return res
    .status(200)
    .json(
        new apiResponse(200, subscription, "Subcribed Successfully")
    )
})

const getUserChannelSubcribers = asyncHandler(async ( req, res ) =>{
    const { channelId } = req.params

    const subcribers = await Subcription.find({channel: channelId})
    .populate("subcriber","username avatar fullName")

    return res
    .status(200)
    .json(
        new apiResponse(200, subcribers, "Channel subcribers fecthed successfully")
    )
})

const getSubcribedChannels = asyncHandler(async ( req, res ) =>{
    const { subcriberId } = req.params
    
    const channels = await Subcription.find({ subcriber: subcriberId})
    .populate("channels", "username avatar fullname")

return res
    .status(200)
    .json(
new apiResponse(200, channels, "Subcribed Channels fetched successfully")
)
})

export {
    toggleSubcription,
    getUserChannelSubcribers,
    getSubcribedChannels,
}