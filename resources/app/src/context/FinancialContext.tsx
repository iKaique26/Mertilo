/**
 * Financial Context
 * Gerencia estado global de dados financeiros
 */

import React, { createContext, useReducer, useEffect } from 'react';
import type { FinancialState, FinancialAction, AppData } from '../types';
import { financialService } from '../services/api/financial';

export const FinancialContext = createContext<
  { state: FinancialState; dispatch: React.Dispatch<FinancialAction> } | undefined
>(undefined);

const initialState: FinancialState = {
  salario: 0,
  accounts: [],
  categories: [],
  history: [],
  vehicleExpenses: [],
  loading: true,
  error: null,
  selectedCategory: null,
};

/**
 * Reducer para gerenciar estado financeiro
 */
function financialReducer(
  state: FinancialState,
  action: FinancialAction
): FinancialState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_DATA':
      return {
        ...state,
        salario: action.payload.salario,
        accounts: action.payload.contas,
        categories: action.payload.categorias,
        history: action.payload.historico,
        vehicleExpenses: action.payload.vexpenses,
        loading: false,
        error: null,
      };

    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
      };

    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((acc) =>
          acc.id === action.payload.id ? action.payload : acc
        ),
      };

    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter((acc) => acc.id !== action.payload),
      };

    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.id === action.payload.id ? action.payload : cat
        ),
      };

    case 'SET_SALARY':
      return {
        ...state,
        salario: action.payload,
      };

    case 'SET_SELECTED_CATEGORY':
      return {
        ...state,
        selectedCategory: action.payload,
      };

    default:
      return state;
  }
}

/**
 * Provider para Financial Context
 */
export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(financialReducer, initialState);

  // Carrega dados quando o componente monta
  useEffect(() => {
    async function loadData() {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const data = await financialService.getAllFinancialData();
        dispatch({ type: 'SET_DATA', payload: data });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar dados';
        dispatch({ type: 'SET_ERROR', payload: message });
      }
    }

    loadData();
  }, []);

  return (
    <FinancialContext.Provider value={{ state, dispatch }}>
      {children}
    </FinancialContext.Provider>
  );
}
