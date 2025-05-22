"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
router.get('/:id', userController_1.getUserInfo);
router.post('/update', userController_1.updateUserInfo);
router.post('/change-password', userController_1.changePassword);
router.post('/upload-profile-image', userController_1.upload.single('profileImage'), userController_1.uploadProfileImage);
exports.default = router;
