/**
 * App.jsx - Componente raiz com roteamento
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FinancialProvider } from './context/FinancialContext';
import { TaxProvider } from './context/TaxIRPFContext';
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
import { IRPF } from './pages/IRPF';
import { IRPFAssistant } from './pages/IRPF/Assistant';
import { IRPFDocuments } from './pages/IRPF/Documents';
import { IRPFIncome } from './pages/IRPF/Income';
import { IRPFAssets } from './pages/IRPF/Assets';
import { IRPFDependents } from './pages/IRPF/Dependents';
import { IRPFDeductions } from './pages/IRPF/Deductions';
import { IRPFAlerts } from './pages/IRPF/Alerts';
import { IRPFReview } from './pages/IRPF/Review';

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
            <Route path="/reset-password" element={<ResetPassword />} />

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
