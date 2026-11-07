import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import App from './main.jsx';
import { TaxProvider } from './modules/irpf/context/TaxIRPFContext';
import { IRPF } from './modules/irpf/pages';
import { Header } from './components/layout/Header';
import { AuthContext } from './context/AuthContext';
import { FinancialContext } from './context/FinancialContext';
import { Dashboard } from './pages/Dashboard';

beforeEach(() => {
  localStorage.clear();
  global.fetch = vi.fn();
});

test('renderiza a tela de login para usuário não autenticado', async () => {
  window.location.hash = '#/';
  render(<App />);

  const subtitles = await screen.findAllByText(/Acesse sua conta Mertilo/i);
  expect(subtitles.length).toBeGreaterThan(0);
  expect(document.body.textContent).toMatch(/E-mail/i);
  expect(document.body.textContent).toMatch(/Senha/i);
});

test('redireciona rota protegida para login quando não há sessão ativa', async () => {
  window.location.hash = '#/';
  render(<App />);

  expect(await screen.findAllByText(/Acesse sua conta Mertilo/i)).toHaveLength(2);
  expect(document.body.textContent).toMatch(/Entrar/i);
});

test('não quebra a UI do IRPF ao receber payload inválido da API', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ error: 'Unauthorized' }),
  });

  render(
    <TaxProvider>
      <IRPF />
    </TaxProvider>
  );

  expect(await screen.findByText(/Nenhum exercício fiscal criado/i)).toBeInTheDocument();
});

test('o cabeçalho abre painel de filtros e configurações com interatividade real', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthContext.Provider value={{
        user: { id: '1', name: 'Maria Souza', email: 'maria@test.com' },
        token: 'token-test',
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
      }}>
        <Header />
      </AuthContext.Provider>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /abrir filtros/i }));
  expect(screen.getByText(/filtro por período/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /abrir configurações/i }));
  expect(screen.getByText(/configurações da conta/i)).toBeInTheDocument();
});

test('a página de IRPF renderiza os links de navegação do exercício', async () => {
  global.fetch = vi.fn().mockImplementation((url) => {
    const target = String(url);

    if (target.includes('/irpf/exercises')) {
      return Promise.resolve({
        ok: true,
        json: async () => ([{ id: 'exercise-1', year: 2024, status: 'Em andamento', progress: 30 }]),
      });
    }

    if (target.includes('/dashboard')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          documents: { total: 1, processed: 1 },
          income: { items_count: 1, total: 50000 },
          assets: { items_count: 0, total: 0 },
          dependents: { total: 0 },
          deductions: { items_count: 0, total: 0 },
          alerts: { total: 0, critical: 0 },
          pending_actions: {},
        }),
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  render(
    <MemoryRouter>
      <TaxProvider>
        <IRPF />
      </TaxProvider>
    </MemoryRouter>
  );

  expect(await screen.findByRole('link', { name: /documentos/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /assistente/i })).toHaveAttribute('href', '/irpf/exercise-1/assistente');
});

test('o filtro de período atualiza o dashboard e mostra recomendações de economia', () => {
  const mockState = {
    salario: 8000,
    accounts: [
      { id: 'acc-1', nome: 'Cartão', valor: 1500, categoria: 'Cartão', isFixed: true, data: '2026-01-01' },
      { id: 'acc-2', nome: 'Aluguel', valor: 2500, categoria: 'Moradia', isFixed: true, data: '2026-01-01' },
    ],
    categories: [
      { id: 'cat-1', nome: 'Alimentação', cor: '#f59e0b', percentual: 40, gasto: 1400 },
      { id: 'cat-2', nome: 'Transporte', cor: '#3b82f6', percentual: 25, gasto: 900 },
      { id: 'cat-3', nome: 'Lazer', cor: '#10b981', percentual: 35, gasto: 1200 },
    ],
    history: [
      { id: 'h1', mes: '2026-01', salario: 8000, totalContas: 3200, saldoDisponivel: 4800, distribuicao: [], totalExtras: 0, rendaTotal: 8000, extras: [], criadoEm: '2026-01-31' },
      { id: 'h2', mes: '2026-02', salario: 8000, totalContas: 4200, saldoDisponivel: 3800, distribuicao: [], totalExtras: 0, rendaTotal: 8000, extras: [], criadoEm: '2026-02-28' },
      { id: 'h3', mes: '2026-03', salario: 8000, totalContas: 5100, saldoDisponivel: 2900, distribuicao: [], totalExtras: 0, rendaTotal: 8000, extras: [], criadoEm: '2026-03-31' },
    ],
    vehicleExpenses: [],
    importHistory: [],
    importedTransactions: [],
    loading: false,
    error: null,
    selectedCategory: null,
  };

  localStorage.setItem('mertilo_selected_period', 'quarter');

  render(
    <FinancialContext.Provider value={{ state: mockState, dispatch: vi.fn() }}>
      <Dashboard />
    </FinancialContext.Provider>
  );

  expect(screen.getByText(/recomendações de economia/i)).toBeInTheDocument();
  expect(screen.getByText(/reduzir despesas fixas/i)).toBeInTheDocument();
});

test('serviços de importação expõem desfazer importação e exclusão segura', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, revertedCount: 2, importId: 'import-1' }),
  });

  const { financialImportService } = await import('./services/api/importacao');

  await expect(financialImportService.undoImport('import-1')).resolves.toMatchObject({ ok: true, revertedCount: 2 });
  await expect(financialImportService.deleteImportedTransaction('txn-1')).resolves.toMatchObject({ ok: true });

  expect(global.fetch).toHaveBeenCalledWith(
    'http://127.0.0.1:5000/api/financas/importacao/import-1',
    expect.objectContaining({ method: 'DELETE' })
  );
  expect(global.fetch).toHaveBeenCalledWith(
    'http://127.0.0.1:5000/api/financas/importacao/transaction/txn-1',
    expect.objectContaining({ method: 'DELETE' })
  );
});

test('espera a autenticação antes de carregar os dados financeiros', async () => {
  localStorage.setItem('mertilo_token', 'token-test');

  let resolveMe;
  const mePromise = new Promise((resolve) => {
    resolveMe = resolve;
  });

  global.fetch = vi.fn((url) => {
    if (String(url).includes('/auth/me')) {
      return mePromise.then(() => ({
        ok: true,
        json: async () => ({ id: '1', name: 'Tester', email: 'tester@example.com', is_verified: true }),
      }));
    }

    if (String(url).includes('/financas')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ salario: 0, contas: [], categorias: [], historico: [], vexpenses: [] }),
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  window.location.hash = '#/';
  render(<App />);

  await Promise.resolve();

  expect(global.fetch.mock.calls.some(([url]) => String(url).includes('/financas'))).toBe(false);

  resolveMe();

  await waitFor(() => {
    expect(global.fetch.mock.calls.some(([url]) => String(url).includes('/financas'))).toBe(true);
  });
});
