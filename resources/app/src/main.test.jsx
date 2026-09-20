import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './main.jsx';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      salario: 5600,
      contas: [
        { id: '1', nome: 'Aluguel', valor: 1800, categoria: 'Moradia', isFixed: true },
        { id: '2', nome: 'Internet', valor: 120, categoria: 'Casa', isFixed: true },
      ],
      categorias: [
        { id: '1', nome: 'Moradia', cor: '#8b5cf6', percentual: 0.45 },
        { id: '2', nome: 'Alimentação', cor: '#38bdf8', percentual: 0.25 },
      ],
      historico: [
        { id: '1', mes: 'Maio', totalContas: 1800, rendaTotal: 5600, saldoDisponivel: 2200 },
      ],
    }),
  });
});

test('exibe o dashboard financeiro com resumo e histórico', async () => {
  render(<App />);

  expect(screen.getByText(/Carregando finanças/i)).toBeInTheDocument();

  expect(await screen.findByText(/Painel financeiro/i)).toBeInTheDocument();
  expect(await screen.findByText(/Seu saldo atual/i)).toBeInTheDocument();
  expect(await screen.findByText(/Contas fixas/i)).toBeInTheDocument();
});
