import { asyncHandler } from "../utlis/asyncHandler"
import { apiResponse } from '../utlis/apiResponse'

const healthcheck = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new apiResponse(
            200,
            { status: "OK" },
            "Server is running successfully"
        )
    )
})

export {
    healthcheck
}