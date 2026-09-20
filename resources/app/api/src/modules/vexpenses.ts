/**
 * Vehicle Expense Router
 * Roteia requisições para o Vehicle Expense Controller
 */

import { Router } from 'express';
import { vehicleExpenseController } from '../controllers/vehicle-expense.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => vehicleExpenseController.getAll(req, res));
router.get('/:id', (req, res) => vehicleExpenseController.getById(req, res));
router.post('/', (req, res) => vehicleExpenseController.create(req, res));
router.put('/:id', (req, res) => vehicleExpenseController.update(req, res));
router.delete('/:id', (req, res) => vehicleExpenseController.delete(req, res));

export default router;
