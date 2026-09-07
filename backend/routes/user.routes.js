import { Router } from 'express';
import {
  register,
  login,
  uploadProfilePicture,
  updateUserProfile,
  getUserAndProfile,
  updateProfileData,
  getAllUsersProfile,
  downloadResume,
  sendConnectionRequest,
  getMyConnectionRequest,
  getUserConnectionRequest,
  acceptConnectionRequest,
  getUserProfileAndBasedOnUsername,
  cancelConnectionRequest,
  updateBio
} from '../controllers/user.controller.js';
import multer from 'multer';

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.route('/update_profile_picture').post(
  upload.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'cover_picture', maxCount: 1 },
  ]),
  uploadProfilePicture,
);

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/user_update').post(updateUserProfile);
router.route('/update-bio').put(updateBio);

router.route('/get_user_and_profile').get(getUserAndProfile);
router.route('/update_profile_data').post(updateProfileData);
router.route('/get_all_users').get(getAllUsersProfile);
router.route('/download_resume').get(downloadResume);

router.route('/send_connection_request').post(sendConnectionRequest);
router.route('/getConnectionRequests').get(getMyConnectionRequest);
router.route('/user_connection_request').get(getUserConnectionRequest);
router.route('/accept_connection_request').post(acceptConnectionRequest);

router
  .route('/get_profile_based_on_username')
  .get(getUserProfileAndBasedOnUsername);
router.route('/cancel_connection_request').post(cancelConnectionRequest);

export default router;
