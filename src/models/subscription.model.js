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

/*
How this will work:
we will create a new document every time a user subscribes to a channel (whether its the same user subscribing to different channels, or different users subscribing to the same channel)
we will have channel and subscriber fields in the document

ex: suppose users are a,b,c  and channels are ch1, ch2, ch3
so if a subscribes to ch1 and b subscribes to ch2, then we will have a document like this:

{
  channel: ch1,
  subscriber: a
}

{
  channel: ch2,
  subscriber: b
}

now if b also subscribes to ch1, then we will have a document like this:

{
  channel: ch1,
  subscriber: b
}

and now if a subscribes to ch3, then we will have a document like this:

{
  channel: ch3,
  subscriber: a
}

and so on...

So basically we will have many many documents.
TASK: find count of subscribers for a channel
=> search in db where channel = ch1 and count all the documents received from that query

TASK: find number of channels subscribed by a user (lets say a)
=> search in db where subscriber = a and count all the documents received from that query

*/

export const Subscription = mongoose.model("Subscription", subscriptionSchema);

