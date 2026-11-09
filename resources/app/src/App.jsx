/**
 * App.jsx - Componente raiz com roteamento
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FinancialProvider } from './context/FinancialContext';
import { TaxProvider } from './modules/irpf';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import { RequireAuth } from './components/Auth/RequireAuth';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Accounts } from './pages/Accounts';
import { Categories } from './pages/Categories';
import { ImportacaoFinanceira } from './pages/ImportacaoFinanceira';
import { IRPF } from './modules/irpf';
import { IRPFAssistant } from './modules/irpf/pages/Assistant';
import { IRPFDocuments } from './modules/irpf/pages/Documents';
import { IRPFIncome } from './modules/irpf/pages/Income';
import { IRPFAssets } from './modules/irpf/pages/Assets';
import { IRPFDependents } from './modules/irpf/pages/Dependents';
import { IRPFDeductions } from './modules/irpf/pages/Deductions';
import { IRPFAlerts } from './modules/irpf/pages/Alerts';
import { IRPFReview } from './modules/irpf/pages/Review';

export function App() {
  return (
    <AuthProvider>
      <FinancialProvider>
        <TaxProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/Reset-password/:token" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route
              path="/"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/transactions"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Transactions />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/accounts"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Accounts />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/categories"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Categories />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/importacao-financeira"
              element={
                <RequireAuth>
                  <MainLayout>
                    <ImportacaoFinanceira />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/irpf"
              element={
                <RequireAuth>
                  <MainLayout>
                    <IRPF />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/irpf/:exerciseId/assistente"
              element={
                <RequireAuth>
                  <MainLayout>
                    <IRPFAssistant />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/irpf/:exerciseId/revisao"
              element={
                <RequireAuth>
                  <MainLayout>
                    <IRPFReview />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/irpf/:exerciseId/documentos"
              element={
                <RequireAuth>
                  <MainLayout>
                    <IRPFDocuments />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/irpf/:exerciseId/rendimentos"
              element={
                <RequireAuth>
                  <MainLayout>
                    <IRPFIncome />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/irpf/:exerciseId/bens"
              element={
                <RequireAuth>
                  <MainLayout>
                    <IRPFAssets />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/irpf/:exerciseId/dependentes"
              element={
                <RequireAuth>
                  <MainLayout>
                    <IRPFDependents />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/irpf/:exerciseId/deducoes"
              element={
                <RequireAuth>
                  <MainLayout>
                    <IRPFDeductions />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/irpf/:exerciseId/alertas"
              element={
                <RequireAuth>
                  <MainLayout>
                    <IRPFAlerts />
                  </MainLayout>
                </RequireAuth>
              }
            />
            {/* Rota curinga para redirecionar rotas inválidas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
        </TaxProvider>
      </FinancialProvider>
    </AuthProvider>
  );
}
