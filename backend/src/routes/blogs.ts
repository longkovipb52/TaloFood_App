import express from 'express';
import { getAllBlogs, getBlogById } from '../controllers/blogController';

const router = express.Router();

router.get('/', getAllBlogs);
router.get('/:blogId', getBlogById);

export default router;