import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import postRoutes from './routes/post.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
