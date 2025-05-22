import express from 'express';
import { getUserContacts, addContact } from '../controllers/contactController';

const router = express.Router();

router.get('/user/:userId', getUserContacts);
router.post('/add', addContact);

export default router;