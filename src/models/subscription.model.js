import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    // subscriber: one who is subscribing
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // channel: one to whom the subscriber is subscribed
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
