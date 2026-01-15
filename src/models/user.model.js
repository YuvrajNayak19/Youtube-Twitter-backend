import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
            required: true,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            }
        ],
        refreshToken: {
            type: String,
        }
    }, { timestamps: true }
)

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next()

        this.password = await bcrypt.hash(this.password, 10)
        next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.genreateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            username: this.username,
        },
        procces.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: procces.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.genreateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        procces.env.REFRESH_TOKEN_SCERET,
        {
            expiresIn: procces.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema);