/**
 * History Router
 * Roteia requisições para o History Controller
 */

import { Router } from 'express';
import { historyController } from '../controllers/history.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => historyController.getAll(req, res));
router.get('/:id', (req, res) => historyController.getById(req, res));
router.post('/', (req, res) => historyController.create(req, res));
router.put('/:id', (req, res) => historyController.update(req, res));
router.delete('/:id', (req, res) => historyController.delete(req, res));

export default router;
