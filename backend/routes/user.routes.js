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
  updateBio,
} from '../controllers/user.controller.js';
import { uploadCloud } from '../config/cloudinary.js';

const router = Router();

router.route('/update_profile_picture').post(
  (req, res, next) => {
    uploadCloud.fields([
      { name: 'profile_picture', maxCount: 1 },
      { name: 'cover_picture', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error('PROFILE PICTURE UPLOAD ERROR:', err);
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
