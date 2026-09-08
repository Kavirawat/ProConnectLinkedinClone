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

router.route('/post').post(uploadCloud.single('media'), createPost);

router.route('/posts').get(getAllPosts);
router.route('/delete_post').delete(deletePost);
router.route('/comment').post(comments);
router.route('/get_comments').get(get_comments_By_Post);
router.route('/delete_comment').delete(delete_comments_of_user);
router.route('/increment_post_like').post(increment_Likes);

export default router;
