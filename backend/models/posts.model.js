import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      default: '',
    },

    body: {
      type: String,
      default: '',
    },

    likes: {
      type: Number,
      default: 0,
    },

    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    media: {
      type: String,
      default: '',
    },

    fileType: {
      type: String,
      default: '',
    },

    active: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  },
);

const Post = mongoose.model('Post', postSchema);

export default Post;
