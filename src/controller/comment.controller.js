import { apiError } from "../utlis/apiError.js"
import { apiResponse } from "../utlis/apiResponse.js"
import { asyncHandler } from "../utlis/asyncHandler.js"
import { Comment } from "../models/comment.model.js"

const getVideoComment = asyncHandler(async ( req, res ) =>{
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const skip = (page - 1)*limit

    const comment = await Comment.find({video: videoId})
    .populate("owner", "username avatar")
    .sort({createdAt: -1})
    .skip(skip)
    .limit(Number(limit))

    return res
    .status(200)
    .json(
        new apiResponse(200, comment, "Video Comment fected successfully")
    )
})

const addComment = asyncHandler(async ( req, res ) =>{
    const { videoId } = req.params
    const { content } = req.body

    if(!content?.trim()){
        throw new apiError(400, "Content is required")
    }

    const comment = await Comment.create({
        video: videoId,
        content,
        owner: req.user._id
    })

    return res
    .status(200)
    .json(
        new apiResponse(200, comment, "comment added successfully")
    )
})

const updateComment = asyncHandler(async ( req, res ) =>{
    const { commentId } = req.params
    const { content } = req.body

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new apiError(400, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment")
    }

    comment.content = content
    await comment.save()

    return res
    .status(200)
    .json(
        new apiResponse(200, comment, "comment updated succesfully")
    )
})

const deleteComment = asyncHandler(async ( req, res ) =>{
    const { commentId } = req.params

     const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(
        new apiResponse(200, {}, "Comment deletd successfully")
    )
})

export {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}