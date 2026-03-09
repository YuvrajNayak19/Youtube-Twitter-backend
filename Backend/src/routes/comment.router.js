import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComment,
    updateComment,
} from "../controller/comment.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComment).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router