import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import postRoutes from './routes/post.routes.js';
import userRoutes from './routes/user.routes.js';
import { uploadCloud } from './config/cloudinary.js';
import { Post } from './models/post.model.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/post', uploadCloud.single('media'), async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path;
    }

    const bodyText = req.body.body;

    const newPost = await Post.create({
      body: bodyText,
      media: imageUrl,
      userId: req.body.userId || req.user?._id || '65d1a2b3c4d5e6f7a8b9c0d1',
    });

    res.status(201).json({
      success: true,
      message: 'Post Created Successfully',
      post: newPost,
    });
  } catch (error) {
    console.error('Backend Route Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use('/', postRoutes);
app.use('/', userRoutes);
app.use(express.static('uploads'));
app.use('/uploads', express.static('uploads'));

const port = process.env.PORT || 9080;

const start = async () => {
  const connectDb = await mongoose.connect(process.env.mongoDb_url);
  console.log('Database connected successfully');

  app.listen(port, () => {
    console.log(`Server is starting on port ${port}`);
  });
};

start();
