import Profile from '../models/profile.model.js';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import Post from '../models/posts.model.js';
import mongoose from 'mongoose';
import Comment from '../models/comments.model.js';

export const activeCheck = (req, res, next) => {
  return res.status(200).json({ message: 'Active' });
};

export const createPost = async (req, res) => {
  console.log('REQUEST BODY INCOMING ===', req.body);
  console.log('FILE DETAILS INCOMING ===', req.file);

  try {
    let token = req.body.token || req.headers.token;
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasFile = req.file !== undefined && req.file !== null;
    let computedFileType = '';
    let finalMediaUrl = '';

    if (hasFile) {
      finalMediaUrl = req.file.path || req.file.secure_url || '';

      if (req.file.mimetype) {
        const parts = req.file.mimetype.split('/');
        computedFileType = parts.length > 1 ? parts[1] : '';
      } else if (req.file.format) {
        computedFileType = req.file.format;
      }
    }

    const verifiedTitle =
      req.body.title && String(req.body.title).trim().length > 0
        ? String(req.body.title).trim()
        : '';

    const verifiedBody =
      req.body.body && String(req.body.body).trim().length > 0
        ? String(req.body.body).trim()
        : '';

    const post = new Post({
      userId: user._id,
      title: verifiedTitle,
      body: verifiedBody,
      media: finalMediaUrl,
      fileType: computedFileType,
      active: true,
    });

    await post.save();
    await post.populate('userId', 'name username profilePicture');

    return res.status(200).json({
      message: 'Post Created',
      post: post,
    });
  } catch (err) {
    console.error('Create Post Error Details:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ active: true })
      .populate('userId', 'name username profilePicture')
      .sort({ createdAt: -1, _id: -1 });

    return res.status(200).json({ posts });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.body && 'token' in req.body) {
      token = req.body.token;
    }

    const post_id =
      req.params.id || req.headers.postid || (req.body && req.body.post_id);

    if (!token || !post_id) {
      return res.status(400).json({ message: 'Token or Post ID is missing' });
    }

    const user = await User.findOne({ token: token }).select('id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await Post.findOne({ _id: post_id });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() != user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Post.deleteOne({ _id: post_id });
    return res.status(200).json({ message: 'Post Deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const comments = async (req, res) => {
  const token = req.body?.token || req.query?.token || req.headers?.token;
  const post_id = req.body?.post_id || req.query?.post_id;
  const commentBody = req.body?.commentBody || req.query?.commentBody;
  try {
    if (!token) {
      return res.status(401).json({ message: 'Token is required' });
    }

    const user = await User.findOne({ token: token }).select('_id').lean();
    console.log('Found User:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await Post.findOne({ _id: post_id });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = new Comment({
      userId: user._id,
      postId: post_id,
      body: commentBody,
    });

    await comments.save();
    return res.status(200).json({ message: 'Comments added' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const get_comments_By_Post = async (req, res) => {
  const fromQuery = req.query.post_id || req.query.id;
  const fromBody = req.body && req.body.post_id;
  const fromHeaders = req.headers.postid;

  const post_id = fromQuery || fromBody || fromHeaders;

  try {
    if (!post_id) {
      return res
        .status(400)
        .json({ message: 'post_id received as undefined or empty' });
    }

    const cleanId = String(post_id).trim();

    if (!mongoose.Types.ObjectId.isValid(cleanId)) {
      return res
        .status(400)
        .json({ message: `Format invalid for value: '${cleanId}'` });
    }

    const post = await Post.findById(cleanId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found in MongoDB' });
    }

    const comments = await Comment.find({ postId: cleanId }).populate(
      'userId',
      'name username',
    );

    const result = { comments: [...comments].reverse() };

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const delete_comments_of_user = async (req, res) => {
  const { token, commet_id } = req.body;

  try {
    const user = await User.findOne({ token: token }).select('_id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const comment = await Comment.findOne({ _id: commet_id });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId.toString() != user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Comment.deleteOne({ _id: comment_id });

    return res.status(200).json({ message: 'Comment Deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const increment_Likes = async (req, res) => {
  const { post_id } = req.body;
  try {
    let token = req.body.token || req.headers.token;
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required to like' });
    }

    const user = await User.findOne({ token: token }).select('_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await Post.findById(post_id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!Array.isArray(post.likedBy)) {
      post.likedBy = [];
    }

    const userIndex = post.likedBy.findIndex(
      (id) => String(id) === String(user._id)
    );

    let hasLiked = false;
    if (userIndex !== -1) {
      post.likedBy.splice(userIndex, 1);
      post.likes = Math.max(0, (post.likes || 1) - 1);
      hasLiked = false;
    } else {
      post.likedBy.push(user._id);
      post.likes = (post.likes || 0) + 1;
      hasLiked = true;
    }

    await post.save();

    return res.status(200).json({
      message: hasLiked ? 'Post Liked' : 'Post Unliked',
      likes: post.likes,
      likedBy: post.likedBy,
      hasLiked,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
