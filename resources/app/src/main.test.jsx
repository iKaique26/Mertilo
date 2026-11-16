import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import App from './main.jsx';
import { TaxProvider } from './modules/irpf/context/TaxIRPFContext';
import { IRPF } from './modules/irpf/pages';
import { Header } from './components/layout/Header';
import { ConsentBanner } from './components/Privacy/ConsentBanner';
import { ConsentPreferencesModal } from './components/Privacy/ConsentPreferencesModal';
import { AuthContext } from './context/AuthContext';
import { FinancialContext } from './context/FinancialContext';
import { PrivacyProvider, usePrivacy } from './context/PrivacyContext';
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
        <PrivacyProvider>
          <Header />
          <ConsentPreferencesModal />
        </PrivacyProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /abrir filtros/i }));
  expect(screen.getByText(/filtro por período/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /abrir configurações/i }));
  expect(screen.getByText(/configurações da conta/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /preferências de privacidade/i }));
  expect(screen.getByRole('dialog', { name: /preferências de privacidade/i })).toBeInTheDocument();
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
    <PrivacyProvider>
      <FinancialContext.Provider value={{ state: mockState, dispatch: vi.fn() }}>
        <Dashboard />
      </FinancialContext.Provider>
    </PrivacyProvider>
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

describe('consentimento de privacidade', () => {
  test('não quebra ao encontrar localStorage indisponível', async () => {
    const originalLocalStorage = window.localStorage;
    const blockedStorage = {
      getItem: () => { throw new Error('storage blocked'); },
      setItem: () => { throw new Error('storage blocked'); },
      removeItem: () => { throw new Error('storage blocked'); },
    };

    Object.defineProperty(window, 'localStorage', {
      value: blockedStorage,
      configurable: true,
    });

    function PrivacyConsumer() {
      const { consent, saveConsent } = usePrivacy();
      return (
        <button
          type="button"
          onClick={() => saveConsent({ functional: true })}
          data-testid="save-consent"
        >
          {consent ? 'saved' : 'no-consent'}
        </button>
      );
    }

    render(
      <PrivacyProvider>
        <PrivacyConsumer />
      </PrivacyProvider>
    );

    expect(screen.getByText(/no-consent/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('save-consent'));
    await waitFor(() => {
      expect(screen.getByText(/no-consent/i)).toBeInTheDocument();
    });

    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
    });
  });

  test('ignora dados corrompidos e exibe banner de nova escolha', async () => {
    localStorage.setItem('mertilo_privacy_consent', '{invalid-json');

    render(
      <PrivacyProvider>
        <ConsentBanner />
      </PrivacyProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /privacidade e cookies/i })).toBeInTheDocument();
    });
  });

  test('revoga preferências funcionais, bloqueia novas gravações e preserva token', async () => {
    localStorage.setItem('mertilo_token', 'session-token');
    localStorage.setItem('mertilo_selected_period', 'month');
    localStorage.setItem('mertilo_account_settings', '{"theme":"dark"}');
    localStorage.setItem('mertilo_selected_period:account-a', 'quarter');
    localStorage.setItem('mertilo_account_settings:account-b', '{"notifications":false}');

    function PrivacyConsumer() {
      const { saveConsent, setFunctionalValue, functionalEnabled } = usePrivacy();
      return (
        <>
          <button type="button" onClick={() => saveConsent({ functional: true })}>enable</button>
          <button type="button" onClick={() => saveConsent({ functional: false })}>revoke</button>
          <button type="button" onClick={() => setFunctionalValue('mertilo_selected_period', 'year')}>write</button>
          <output>{String(functionalEnabled)}</output>
        </>
      );
    }

    render(<PrivacyProvider><PrivacyConsumer /></PrivacyProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'enable' }));
    fireEvent.click(screen.getByRole('button', { name: 'write' }));
    expect(localStorage.getItem('mertilo_selected_period')).toBe('year');

    fireEvent.click(screen.getByRole('button', { name: 'revoke' }));
    expect(localStorage.getItem('mertilo_selected_period')).toBeNull();
    expect(localStorage.getItem('mertilo_account_settings')).toBeNull();
    expect(localStorage.getItem('mertilo_selected_period:account-a')).toBeNull();
    expect(localStorage.getItem('mertilo_account_settings:account-b')).toBeNull();
    expect(localStorage.getItem('mertilo_token')).toBe('session-token');
    expect(screen.getByText('false')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'write' }));
    expect(localStorage.getItem('mertilo_selected_period')).toBeNull();
  });

  test('tenta remover todas chaves funcionais e exibe falha parcial', async () => {
    localStorage.setItem('mertilo_selected_period', 'month');
    localStorage.setItem('mertilo_account_settings', '{"theme":"dark"}');
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    const removed = [];
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      removed.push(key);
      if (key === 'mertilo_selected_period') throw new Error('remove blocked');
      originalRemoveItem(key);
    });

    function PrivacyConsumer() {
      const { saveConsent, storageNotice } = usePrivacy();
      return <><button type="button" onClick={() => saveConsent({ functional: false })}>revoke</button><output>{storageNotice}</output></>;
    }

    render(<PrivacyProvider><PrivacyConsumer /></PrivacyProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'revoke' }));
    expect(removed).toEqual(expect.arrayContaining(['mertilo_selected_period', 'mertilo_account_settings']));
    expect(screen.getByText(/não foi possível remover todas/i)).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  test('modal mantém foco, acessibilidade e restaura foco ao fechar', async () => {
    function Harness() {
      const { setShowModal } = usePrivacy();
      return <><button type="button" onClick={() => setShowModal(true)}>open</button><ConsentPreferencesModal /></>;
    }

    render(<PrivacyProvider><Harness /></PrivacyProvider>);
    const opener = screen.getByRole('button', { name: 'open' });
    opener.focus();
    fireEvent.click(opener);

    const dialog = await screen.findByRole('dialog', { name: /preferências de privacidade/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-describedby', 'privacy-modal-description');
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /ativar preferências funcionais/i })).toHaveFocus());

    const close = screen.getByRole('button', { name: /fechar modal/i });
    const save = screen.getByRole('button', { name: /salvar preferências/i });
    save.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
    close.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(save).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  test('sincroniza mudanças de consentimento entre abas', async () => {
    render(
      <PrivacyProvider>
        <ConsentBanner />
      </PrivacyProvider>
    );

    const consentPayload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      preferences: {
        necessary: true,
        functional: true,
        analytics: false,
        marketing: false,
      },
    };

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'mertilo_privacy_consent',
        newValue: JSON.stringify(consentPayload),
      }));
    });

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /privacidade e cookies/i })).not.toBeInTheDocument();
    });
  });

  test('revoga o consentimento em memória quando outra aba grava dados inválidos', async () => {
    localStorage.setItem('mertilo_privacy_consent', JSON.stringify({
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      preferences: { necessary: true, functional: true, analytics: false, marketing: false },
    }));

    function PrivacyState() {
      const { functionalEnabled } = usePrivacy();
      return <output>{String(functionalEnabled)}</output>;
    }

    render(<PrivacyProvider><PrivacyState /><ConsentBanner /></PrivacyProvider>);
    expect(screen.getByText('true')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'mertilo_privacy_consent',
        newValue: '{broken-json',
      }));
    });

    await waitFor(() => expect(screen.getByText('false')).toBeInTheDocument());
    expect(await screen.findByRole('region', { name: /privacidade e cookies/i })).toBeInTheDocument();
  });

  test('não compartilha preferências funcionais entre contas no mesmo navegador', () => {
    localStorage.setItem('mertilo_privacy_consent', JSON.stringify({
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      preferences: { necessary: true, functional: true, analytics: false, marketing: false },
    }));

    const renderHeaderForUser = (id) => render(
      <AuthContext.Provider value={{ user: { id, name: `User ${id}` }, logout: vi.fn() }}>
        <PrivacyProvider>
          <MemoryRouter initialEntries={['/']}>
            <Header />
          </MemoryRouter>
        </PrivacyProvider>
      </AuthContext.Provider>
    );

    const accountA = renderHeaderForUser('account-a');
    fireEvent.click(screen.getByRole('button', { name: /abrir configurações/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /notificações/i }));
    expect(localStorage.getItem('mertilo_account_settings:account-a')).toContain('"notifications":false');
    accountA.unmount();
    localStorage.setItem('mertilo_account_settings', '{"notifications":false}');

    renderHeaderForUser('account-b');
    fireEvent.click(screen.getByRole('button', { name: /abrir configurações/i }));
    expect(screen.getByRole('checkbox', { name: /notificações/i })).toBeChecked();
  });

  test('login recupera as preferências da própria conta após outro usuário usar o navegador', () => {
    localStorage.setItem('mertilo_privacy_consent', JSON.stringify({
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      preferences: { necessary: true, functional: true, analytics: false, marketing: false },
    }));
    localStorage.setItem('mertilo_account_settings:account-a', '{"notifications":false}');

    const readFor = (id) => {
      let value;
      function Reader() {
        value = usePrivacy().getFunctionalValue('mertilo_account_settings');
        return null;
      }
      const view = render(
        <AuthContext.Provider value={{ user: id ? { id } : null }}>
          <PrivacyProvider><Reader /></PrivacyProvider>
        </AuthContext.Provider>
      );
      view.unmount();
      return value;
    };

    expect(readFor('account-a')).toBe('{"notifications":false}');
    expect(readFor('account-b')).toBeNull();
    expect(readFor(null)).toBeNull();
    expect(readFor('account-a')).toBe('{"notifications":false}');
  });

  test('consentimento de versão antiga é descartado e o banner reaparece', async () => {
    localStorage.setItem('mertilo_privacy_consent', JSON.stringify({
      version: '0.9.0',
      timestamp: new Date().toISOString(),
      preferences: { necessary: true, functional: true, analytics: false, marketing: false },
    }));

    render(<PrivacyProvider><ConsentBanner /></PrivacyProvider>);
    expect(await screen.findByRole('region', { name: /privacidade e cookies/i })).toBeInTheDocument();
  });

  test('mudança apenas na versão da política não exige nova manifestação', async () => {
    localStorage.setItem('mertilo_privacy_consent', JSON.stringify({
      version: '1.0.0',
      policyVersion: '0.9.0',
      timestamp: new Date().toISOString(),
      preferences: { necessary: true, functional: true, analytics: false, marketing: false },
    }));

    function FunctionalState() {
      return <output>{String(usePrivacy().functionalEnabled)}</output>;
    }

    const { container } = render(<PrivacyProvider><FunctionalState /><ConsentBanner /></PrivacyProvider>);
    expect(screen.getByText('true')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(container.querySelector('.consent-banner')).toBeNull();
  });
});
