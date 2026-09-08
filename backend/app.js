import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import postRoutes from './routes/post.routes.js';
import userRoutes from './routes/user.routes.js';
import { uploadCloud } from './config/cloudinary.js';
import Post from './models/posts.model.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/post', uploadCloud.single('media'), async (req, res) => {
  try {
    console.log('--- New Post Upload Request ---');
    console.log('File dynamic data:', req.file);
    console.log('Body dynamic data:', req.body);

    let imageUrl = '';
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    }

    // Body parser backup validation checks
    const bodyText =
      req.body && req.body.body ? String(req.body.body).trim() : '';

    // AGAR USER NE TEXT NAHI LIKHA HAI PAR IMAGE UPLOAD KI HAI,
    // TO SCHEMA CRASH SE BACHNE KE LIYE 'Media Post' DUMMY VALUE SET KAREIN
    let finalBody = bodyText;
    if (!finalBody && imageUrl) {
      finalBody = 'Sent a media attachment';
    }

    // Agar text aur image dono missing hain toh data request block karein
    if (!finalBody && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Post description context or file attachment is required.',
      });
    }

    // Safe Mongoose Object ID mapping
    let finalUserId = req.body?.userId || req.user?._id;
    if (!finalUserId || !mongoose.Types.ObjectId.isValid(finalUserId)) {
      // Agar login user nahi mila toh is fallback ID par map hoga
      finalUserId = new mongoose.Types.ObjectId('65d1a2b3c4d5e6f7a8b9c0d1');
    }

    // Creating post document directly inside MongoDB
    const newPost = await Post.create({
      body: finalBody,
      media: imageUrl,
      userId: finalUserId,
      fileType: req.file ? req.file.mimetype : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Post Created Successfully',
      post: newPost,
    });
  } catch (error) {
    console.error('CRITICAL BACKEND ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Database schema processing failed',
      error: error.message,
    });
  }
});

app.use('/', postRoutes);
app.use('/', userRoutes);
app.use(express.static('uploads'));
app.use('/uploads', express.static('uploads'));

const port = process.env.PORT || 9080;

const start = async () => {
  app.listen(port, () => {
    console.log(`Server is starting and listening on port ${port}`);
  });

  try {
    const connectDb = await mongoose.connect(process.env.mongoDb_url);
    console.log('Database connected successfully');
  } catch (dbError) {
    console.error(
      'Database connection failed, but server keeps running:',
      dbError.message,
    );
  }
};

start();
