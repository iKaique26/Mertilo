import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { confirmCsvImport, deleteImportedTransaction, parseCsvPreview, undoCsvImport } from '../services/csv-import.service.js';

const router = Router();
router.use(requireAuth);

router.post('/preview', (req, res) => {
  try {
    const { csvText, fileName, mapping } = req.body || {};
    if (typeof csvText !== 'string' || !csvText.trim()) {
      return res.status(400).json({ error: 'CSV vazio ou inexistente.' });
    }

    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Contexto de usuário obrigatório.' });
    }

    const result = parseCsvPreview(csvText, {
      userId: authUserId,
      fileName: typeof fileName === 'string' ? fileName : 'importacao.csv',
      mapping,
    });

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao analisar o arquivo CSV.';
    return res.status(400).json({ error: message });
  }
});

router.post('/confirm', (req, res) => {
  try {
    const { records, fileName } = req.body || {};
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Nenhuma transação válida para importar.' });
    }

    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Contexto de usuário obrigatório.' });
    }

    const result = confirmCsvImport({ userId: authUserId, records, fileName });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao confirmar importação.';
    return res.status(400).json({ error: message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Contexto de usuário obrigatório.' });
    }
    const result = undoCsvImport(authUserId, req.params.id);
    if (!result.ok) {
      return res.status(404).json({ error: result.reason || 'Importação não encontrada.' });
    }
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao desfazer importação.';
    return res.status(400).json({ error: message });
  }
});

router.delete('/transaction/:transactionId', (req, res) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Contexto de usuário obrigatório.' });
    }
    const result = deleteImportedTransaction(authUserId, req.params.transactionId);
    if (!result.ok) {
      return res.status(404).json({ error: result.reason || 'Transação não encontrada.' });
    }
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir transação.';
    return res.status(400).json({ error: message });
  }
});

export default router;
