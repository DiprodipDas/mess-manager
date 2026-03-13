import express from 'express';
import { exportToExcel, exportToPDF } from '../controllers/export.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/excel', authenticate, exportToExcel);
router.get('/pdf', authenticate, exportToPDF);

export default router;