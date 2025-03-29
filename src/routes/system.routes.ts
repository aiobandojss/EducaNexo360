// src/routes/system.routes.ts
import express from 'express';
import { checkSystemStatus, initializeSystem } from '../controllers/system.controller';
import { validate } from '../middleware/validate.middleware';
import { systemInitializeValidation } from '../validations/system.validation';

const router = express.Router();

// Verificar el estado del sistema
router.get('/status', checkSystemStatus);

// Inicializar el sistema
router.post('/initialize', validate(systemInitializeValidation), initializeSystem);

export default router;
