import { Router } from 'express';
import { uploadCloud } from '../config/cloudinary.js';
import {
  activeCheck,
  createPost,
  getAllPosts,
  deletePost,
  comments,
  get_comments_By_Post,
  delete_comments_of_user,
  increment_Likes,
} from '../controllers/posts.controller.js';

const router = Router();

router.route('/').get(activeCheck);

router.post(
  '/createPost',
  (req, res, next) => {
    uploadCloud.single('media')(req, res, (err) => {
      if (err) {
        console.error('UPLOAD ERROR:', err);
        console.error('ERROR MESSAGE:', err.message);
        console.error('HTTP CODE:', err.http_code);
        const errorMessage =
          err.http_code === 403
            ? 'Cloudinary 403 Forbidden: API Key does not have upload permissions (missing actions=["create"]). Check API Key role in Cloudinary Settings or use the Master API Key.'
            : err.message;
        return res.status(400).json({
          success: false,
          error: errorMessage,
        });
      }
      next();
    });
  },
  createPost,
);

router.route('/posts').get(getAllPosts);
router.route('/delete_post').delete(deletePost);
router.route('/comment').post(comments);
router.route('/get_comments').get(get_comments_By_Post);
router.route('/delete_comment').delete(delete_comments_of_user).post(delete_comments_of_user);
router.route('/increment_post_like').post(increment_Likes);

export default router;
