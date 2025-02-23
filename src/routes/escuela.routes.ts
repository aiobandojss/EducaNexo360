import express from 'express';
import escuelaController from '../controllers/escuela.controller';

const router = express.Router();

router.post('/', escuelaController.crear);
router.get('/', escuelaController.obtener);

export default router;
