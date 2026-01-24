import mongoose, {Schema} from "mongoose";


const subcripitionSchema = new Schema({
    subcriber: {
        type: Schema.Type.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Type.ObjectId,
        ref: "User"
    }
},{timestamps: true})

export const Subcripition = mongoose.model('Subcribtion', subcripitionSchema)