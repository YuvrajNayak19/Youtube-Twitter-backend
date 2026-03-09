import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

const normalizeOrigin = (origin = "") => origin.trim().replace(/\/+$/, "")

const envOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)

const devOrigins = [
    "http://localhost:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5175",
].map((origin) => normalizeOrigin(origin))

const allowedOrigins = [...new Set([...envOrigins, ...devOrigins])]

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow server-to-server and tools without browser origin header.
            if (!origin) return callback(null, true)
            if (allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true)
            return callback(new Error(`CORS blocked for origin: ${origin}`))
        },
        credentials: true,
    })
)

app.use(express.json({
    limit: '12kb',
}))
app.use(express.urlencoded({
    extended: true,
    limit: '12kb',
}))
app.use(express.static('public'))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.router.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.router.js"
import likeRouter from "./routes/like.router.js"
import playlistRouter from "./routes/playlist.router.js"
import dashboardRouter from "./routes/dashboard.router.js"

//routes decelration
app.use("/api/v1/healthchecks", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/dashboards", dashboardRouter)

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Something went wrong"
    
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || []
    })
})

export { app }
