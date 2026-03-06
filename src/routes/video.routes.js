import { Router } from 'express'
import {
    getAllVideoes,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from '../controller/video.controller'
import { upload } from '../middleware/multer.middleware'
import { verifyJWT } from '../middleware/auth.middleware'

const router = Router()
router.use(verifyJWT)

router.route("/").get(getAllVideoes).post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishVideo
)

router.route("/:videoId").get(getVideoById).delete(deleteVideo).patch(upload.single("thumbnail"), updateVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router