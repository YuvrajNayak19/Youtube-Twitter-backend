import { asyncHandler } from "../utlis/asyncHandler.js";
import { apiError } from "../utlis/apiError.js";
import { apiResponse } from "../utlis/apiResponse.js";
import { Video }  from "../models/video.model.js"
import { uploadOnCloudinary } from "../utlis/cloudinary.js";

const getAllVideoes = asyncHandler(async ( req, res ) =>{

    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId} = req.query

    const skip = ( page -1 ) * limit 

    // build base filter
    let filter = {}

    if (userId) {
        // when querying for a specific user, ignore publication status so owner sees all
        filter.owner = userId
    } else {
        // default: only published videos
        filter.$or = [
            { isPublished: true } // fallback for legacy documents
        ]
    }

    if (query) {
        const queryConditions = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ]

        if (filter.$or) {
            // combine published check with text search
            filter = {
                $and: [
                    { $or: filter.$or },
                    { $or: queryConditions }
                ]
            }
        } else {
            // no publication restriction (likely because userId was provided)
            filter.$or = queryConditions
        }
    }

    const sortOrder = sortType === "asc" ? 1 : -1

    const videoes = await Video.aggregate([
        { $match: filter},
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $sort: { [sortBy]: sortOrder }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ])

    if(!videoes){
        throw new apiError(404, "No videoes found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, videoes, "Videoes retrieved successfully")
    )
}
)

const publishVideo = asyncHandler(async ( req, res ) =>{
    const { title, description} = req.body

    if( !title || !description){
        throw new apiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videoLocalPath){
        throw new apiError(400, "Video file is required")
    }

    const videoUpload = await uploadOnCloudinary(videoLocalPath)
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoUpload){
        throw new apiError(500, "Failed to upload video")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload?.url || "",
        duration: videoUpload.duration || 0,
        owner: req.user._id
    })

    if(!video){
        throw new apiError(500, "Failed to publish video")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, video, "Video published successfully")
    )
})

const getVideoById = asyncHandler(async ( req, res ) =>{
    const { videoId } = req.params
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, video, "Video retrieved successfully")
    )
})

const updateVideo = asyncHandler(async ( req, res ) =>{
    const { videoId } = req.params
    const { title, description } = req.body

    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError( 404, "Video Not Found")
    }

    // Validate that at least one field is provided for update
    if ((!title || !title.trim()) && (!description || !description.trim()) && !req.file?.path) {
        throw new apiError( 400, "At least one field (title, description, or thumbnail) must be provided for update")
    }

    let thumbnailLocalPath = req.file?.path
    let thumbnailUrl = video.thumbnail

    if(thumbnailLocalPath){
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)

        if(!thumbnailUpload){
            throw new apiError(500, "Failed to upload thumbnail")
        }

        thumbnailUrl = thumbnailUpload.url
    }

    const updateFields = {}
    if (title && title.trim()) {
        updateFields.title = title.trim()
    }
    if (description && description.trim()) {
        updateFields.description = description.trim()
    }
    if (thumbnailLocalPath) {
        updateFields.thumbnail = thumbnailUrl
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFields
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new apiResponse(200, updatedVideo, "Video Updated Successfully")
    )
})

const deleteVideo = asyncHandler(async ( req, res ) =>{
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(400, "Video not found")
    }

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new apiResponse(200, null, "Video Deleted Successfully")
    )
})

const togglePublishStatus = asyncHandler(async ( req, res ) =>{
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(400, "Video not found")
    }

    video.isPublished = !video.isPublished

    await video.save()

    return res
    .status(200)
    .json(
        new apiResponse(200, video, "Publish status toggled successfully")
    )
})

export{
    getAllVideoes,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}