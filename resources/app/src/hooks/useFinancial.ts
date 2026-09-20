/**
 * Hook para usar Financial Context
 */

import { useContext } from 'react';
import { FinancialContext } from '../context/FinancialContext';

export function useFinancial() {
  const context = useContext(FinancialContext);

  if (!context) {
    throw new Error('useFinancial deve ser usado dentro de FinancialProvider');
  }

  return context;
}
