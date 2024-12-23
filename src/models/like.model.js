import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
        communitypost: {
            type: Schema.Types.ObjectId,
            ref: "CommunityPost",
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);