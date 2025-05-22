import express from 'express';
import { getUserInfo, updateUserInfo, changePassword, upload, uploadProfileImage } from '../controllers/userController';

const router = express.Router();

router.get('/:id', getUserInfo);
router.post('/update', updateUserInfo);
router.post('/change-password', changePassword);
router.post('/upload-profile-image', upload.single('profileImage'), uploadProfileImage);

export default router;