import { Router } from 'express';
import { processSync } from '../controllers/syncController';

const router = Router();

router.post('/process', processSync);

export default router;

