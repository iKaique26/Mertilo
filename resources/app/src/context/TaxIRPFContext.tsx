/**
 * Tax/IRPF Context
 * Gerencia estado global de dados fiscais
 */

import React, { createContext, useReducer, useCallback } from 'react';
import type { 
  IRPFExercise, 
  IRPFDocument, 
  IRPFIncome, 
  IRPFAsset, 
  IRPFDeduction, 
  IRPFAlert 
} from '../types';

export interface TaxState {
  exercises: IRPFExercise[];
  currentExerciseId: string | null;
  documents: IRPFDocument[];
  incomes: IRPFIncome[];
  assets: IRPFAsset[];
  deductions: IRPFDeduction[];
  alerts: IRPFAlert[];
  loading: boolean;
  error: string | null;
}

export type TaxAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EXERCISES'; payload: IRPFExercise[] }
  | { type: 'SET_CURRENT_EXERCISE'; payload: string | null }
  | { type: 'SET_DOCUMENTS'; payload: IRPFDocument[] }
  | { type: 'SET_INCOMES'; payload: IRPFIncome[] }
  | { type: 'SET_ASSETS'; payload: IRPFAsset[] }
  | { type: 'SET_DEDUCTIONS'; payload: IRPFDeduction[] }
  | { type: 'SET_ALERTS'; payload: IRPFAlert[] }
  | { type: 'ADD_DOCUMENT'; payload: IRPFDocument }
  | { type: 'UPDATE_DOCUMENT'; payload: IRPFDocument }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'ADD_INCOME'; payload: IRPFIncome }
  | { type: 'UPDATE_INCOME'; payload: IRPFIncome }
  | { type: 'DELETE_INCOME'; payload: string }
  | { type: 'ADD_ASSET'; payload: IRPFAsset }
  | { type: 'UPDATE_ASSET'; payload: IRPFAsset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'ADD_DEDUCTION'; payload: IRPFDeduction }
  | { type: 'UPDATE_DEDUCTION'; payload: IRPFDeduction }
  | { type: 'DELETE_DEDUCTION'; payload: string }
  | { type: 'ADD_ALERT'; payload: IRPFAlert }
  | { type: 'DELETE_ALERT'; payload: string };

export const TaxContext = createContext<
  { state: TaxState; dispatch: React.Dispatch<TaxAction> } | undefined
>(undefined);

const initialState: TaxState = {
  exercises: [],
  currentExerciseId: null,
  documents: [],
  incomes: [],
  assets: [],
  deductions: [],
  alerts: [],
  loading: false,
  error: null,
};

function taxReducer(state: TaxState, action: TaxAction): TaxState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_EXERCISES':
      return { ...state, exercises: action.payload, loading: false };

    case 'SET_CURRENT_EXERCISE':
      return { ...state, currentExerciseId: action.payload };

    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };

    case 'SET_INCOMES':
      return { ...state, incomes: action.payload };

    case 'SET_ASSETS':
      return { ...state, assets: action.payload };

    case 'SET_DEDUCTIONS':
      return { ...state, deductions: action.payload };

    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };

    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };

    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map((d) => (d.id === action.payload.id ? action.payload : d)),
      };

    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter((d) => d.id !== action.payload),
      };

    case 'ADD_INCOME':
      return { ...state, incomes: [...state.incomes, action.payload] };

    case 'UPDATE_INCOME':
      return {
        ...state,
        incomes: state.incomes.map((i) => (i.id === action.payload.id ? action.payload : i)),
      };

    case 'DELETE_INCOME':
      return {
        ...state,
        incomes: state.incomes.filter((i) => i.id !== action.payload),
      };

    case 'ADD_ASSET':
      return { ...state, assets: [...state.assets, action.payload] };

    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };

    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter((a) => a.id !== action.payload),
      };

    case 'ADD_DEDUCTION':
      return { ...state, deductions: [...state.deductions, action.payload] };

    case 'UPDATE_DEDUCTION':
      return {
        ...state,
        deductions: state.deductions.map((d) => (d.id === action.payload.id ? action.payload : d)),
      };

    case 'DELETE_DEDUCTION':
      return {
        ...state,
        deductions: state.deductions.filter((d) => d.id !== action.payload),
      };

    case 'ADD_ALERT':
      return { ...state, alerts: [...state.alerts, action.payload] };

    case 'DELETE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter((a) => a.id !== action.payload),
      };

    default:
      return state;
  }
}

export function TaxProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taxReducer, initialState);

  return <TaxContext.Provider value={{ state, dispatch }}>{children}</TaxContext.Provider>;
}

export function useTax() {
  const context = React.useContext(TaxContext);
  if (context === undefined) {
    throw new Error('useTax deve ser usado dentro de TaxProvider');
  }
  return context;
}
