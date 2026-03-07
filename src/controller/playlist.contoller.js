import { asyncHandler } from "../utlis/asyncHandler.js";
import { apiError } from "../utlis/apiError.js";
import { apiResponse } from "../utlis/apiResponse.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async ( req, res ) =>{
    const { name, description } = req.body

    if(!name){
        throw new apiError(400, "playlist name is required")
    }

    const playlist = await Playlist.create({
        name: name,
        description: description,
        owner: req.user._id,
        videos: []
    })

    if(!playlist){
        throw new apiError(400, "fialed to create playlist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, playlist, "Playlist created successfully")
    )
})

const getUserPlaylist = asyncHandler(async ( req, res ) =>{
    const { userId } = req.body

    const playlist = await playlist.findById({owner: userId})

    return res
    .status(200)
    .json(
        new apiResponse(200, playlist, "playlist fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async ( req, res ) =>{
    const { playlistId } = req.params

    const playlist = await Playlist.findById({playlistId})
    .populate("videos")
    .populate("owner", "username avatar")

    if(!playlist){
        throw new apiError(400, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async ( req, res ) =>{
    const { playlistId, videoId } = req.params

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos: videoId}
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new apiResponse(200, playlist, " Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async ( req, res ) =>{
    const { playlistId, videoId } = req.params

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId}
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new apiResponse(200, playlist, "Video removed successfully")
    )
})

const deletePlaylist = asyncHandler(async ( req, res ) =>{
    const { playlistId } = req.params

    await Playlist.findbyIdAndDelete(playlistId)

    return res
    .status(200)
    .json(
        new apiResponse(200, {}, "Playlist deleted Successfully")
    )
})

const updatePlaylist = asyncHandler(async ( req, res ) =>{
    const { playlistId } = req.params
    const { title, description } = req.body

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                title: title,
                description: description,
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new apiResponse(200, playlist, "Playlist updated Successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
}