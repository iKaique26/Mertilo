import { authService } from './src/services/auth.service.js';
import { usersRepository } from './src/repositories/users.repository.js';
import { emailService } from './src/services/email.service.js';
import { getDatabase } from './src/database/db.js';
import fs from 'fs';
import path from 'path';

async function runDiagnostic() {
  console.log('=== DIAGNÓSTICO DE REENVIO DE VERIFICAÇÃO ===\n');

  // 1. Check Database
  const db = getDatabase();
  const dbPath = db.name;
  console.log(`[DB] Path: ${dbPath}`);
  console.log(`[DB] Exists: ${fs.existsSync(dbPath)}`);

  // 2. Check Email Configuration
  console.log('\n[EMAIL] Configuração:');
  const emailDiag = await emailService.diagnose();
  console.log(JSON.stringify(emailDiag, null, 2));

  // 3. Test Scenarios
  const testEmail = `test_${Date.now()}@example.com`;
  console.log(`\n[TEST] Criando usuário de teste: ${testEmail}`);

  try {
    // Scenario: New User
    const regResult = await authService.register('Test User', testEmail, 'password123');
    console.log('[TEST] Registro OK');

    // Scenario: Resend Verification
    console.log('[TEST] Tentando reenvio...');
    // Bypass interval check for first resend
    db.prepare('UPDATE verification_codes SET created_at = ? WHERE user_id = (SELECT id FROM users WHERE email = ?)').run(new Date(Date.now() - 70000).toISOString(), testEmail);
    const resendResult = await authService.resendVerification(testEmail);
    console.log('[TEST] Reenvio OK:', JSON.stringify(resendResult));

    // Scenario: Already Verified
    console.log('[TEST] Marcando como verificado...');
    db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?').run(testEmail);
    try {
      await authService.resendVerification(testEmail);
      console.log('[TEST] ERRO: Deveria ter falhado (já verificado)');
    } catch (e) {
      console.log('[TEST] OK: Falhou como esperado (já verificado):', e.message);
    }

    // Scenario: Non-existent user
    try {
      await authService.resendVerification('nonexistent@example.com');
      console.log('[TEST] ERRO: Deveria ter falhado (inexistente)');
    } catch (e) {
      console.log('[TEST] OK: Falhou como esperado (inexistente):', e.message);
    }

    // Scenario: Rate Limiting (if applicable)
    console.log('[TEST] Testando rate limit...');
    const limitEmail = `limit_${Date.now()}@example.com`;
    await authService.register('Limit User', limitEmail, 'password123');
    try {
      for(let i=0; i<5; i++) {
        // Bypass interval check for testing rate limit window
        db.prepare('UPDATE verification_codes SET created_at = ? WHERE user_id = (SELECT id FROM users WHERE email = ?)').run(new Date(Date.now() - 70000).toISOString(), limitEmail);
        await authService.resendVerification(limitEmail);
        console.log(`[TEST] Reenvio ${i+1} OK`);
      }
    } catch (e) {
      console.log('[TEST] Rate limit atingido:', e.message);
    }

  } catch (error) {
    console.error('[TEST] Falha crítica no diagnóstico:', error);
  } finally {
    // Cleanup
    console.log('\n[CLEANUP] Removendo usuários de teste...');
    db.prepare("DELETE FROM users WHERE email LIKE 'test_%' OR email LIKE 'limit_%'").run();
    db.prepare('DELETE FROM verification_codes WHERE user_id NOT IN (SELECT id FROM users)').run();
  }
}

runDiagnostic().catch(console.error);
