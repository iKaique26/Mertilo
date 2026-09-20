/**
 * Accounts Router
 * Roteia requisições para o Account Controller
 */

import { Router } from 'express';
import { accountController } from '../controllers/account.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => accountController.getAll(req, res));
router.get('/:id', (req, res) => accountController.getById(req, res));
router.post('/', (req, res) => accountController.create(req, res));
router.put('/:id', (req, res) => accountController.update(req, res));
router.delete('/:id', (req, res) => accountController.delete(req, res));

export default router;
