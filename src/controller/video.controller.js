import { asyncHandler } from "../utlis/asyncHandler";
import { apiError } from "../utlis/apiError";
import { apiResponse } from "../utlis/apiResponse";
import { User } from "../models/user.model,js";
import { Video }  from "../models/video.model.js"
import { uploadOnCloudinary } from "../utlis/cloudinary";

const getAllVideoes = asyncHandler(async ( res, req ) =>{

    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId} = req.body

    const skip = ( page -1 ) * limit 

    const filter = {}

    if(query){
        filter.$or =[
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ]
    }

    if(userId){
        filter.user = userId
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
        new apiResponse(200, "Videoes retrieved successfully", videoes)
    )
}
)

const publishVideo = asyncHandler(async ( res, req ) =>{
    const { title, description} = req.body

    if( !title || !description){
        throw new apiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnailFile?.[0]?.path

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
        thumbnail: thumbnailUpload.url || "",
        duration: videoUpload.duration,
        owner: req.user._id
    })

    if(!video){
        throw new apiError(500, "Failed to publish video")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, "Video published successfully", video)
    )
})

const getVideoById = asyncHandler(async ( res, req ) =>{
    const { videoId } = req.params
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, "Video retrieved successfully", video)
    )
})

const updateVideo = asyncHandler(async ( res, req ) =>{
    const { videoId } = req.params
    const { title, description } = req.params

    const video = await Video.findById(videoId)

    if(!Video){
        throw new apiError( 404, "Video Not Found")
    }

    if(!title?.trim() || !description?.trim()){
        throw new apiError( 400, "All fields are required")
    }

    let thumbnailLocalPath = req.files?.path
    let thumbnailUrl = video.thumbnail

    if(thumbnailLocalPath){
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
        thumbnailUrl = thumbnailUpload.url

        if(!thumbnailUpload){
            throw new apiError(500, "Failed to upload thumbnail")
        }

        thumbnailUrl = thumbnailUpload.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title: title || video.title,
                description: description || video.description,
                thumbnail: thumbnailUrl
            }
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new apiResponse(200, updatedVideo, "Video Updated Successfully")
    )
})

const deleteVideo = asyncHandler(async ( res, req ) =>{
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(400, "Video not found")
    }

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new apiResponse(200, {}, "Video Deleted Successfully")
    )
})

const togglePublishStatus = asyncHandler(async ( res, req ) =>{
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
        new apiResponse(200, video, "Publish stauts toggled successfully")
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