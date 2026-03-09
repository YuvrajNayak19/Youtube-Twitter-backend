import { Router } from 'express';
import {
    getAllTweets,
    createTweet,
    deleteTweet,
    getUserTweet,
    updateTweet,
} from "../controller/tweet.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router();
router.use(verifyJWT); 

router.route("/").get(getAllTweets).post(createTweet);
router.route("/user/:userId").get(getUserTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router
