import mongoose from "mongoose";

const connectionRequestSchema  = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  connectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status_accepted: {
    type: Boolean,
    default: null,
  },
});

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema );

export default ConnectionRequest;
