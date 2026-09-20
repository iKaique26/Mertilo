/**
 * Salary Router
 * Roteia requisições para o Salary Controller
 */

import { Router } from 'express';
import { salaryController } from '../controllers/salary.controller.js';

const router = Router();

router.get('/', (req, res) => salaryController.get(req, res));
router.post('/', (req, res) => salaryController.set(req, res));
router.put('/', (req, res) => salaryController.set(req, res));

export default router;
