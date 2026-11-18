import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import legalDocuments from '../../shared/legal-documents.json';

export const PRIVACY_STORAGE_KEY = 'mertilo_privacy_consent';
export const CONSENT_SCHEMA_VERSION = '1.0.0';
export const PRIVACY_POLICY_VERSION = legalDocuments.privacy.version;
export const TERMS_OF_USE_VERSION = legalDocuments.terms.version;

const DEFAULT_PREFERENCES = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

const PrivacyContext = createContext(null);

export const safeStorageGet = (key) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn('[PrivacyContext] Falha ao ler armazenamento local:', error);
    return null;
  }
};

export const safeStorageSet = (key, value) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('[PrivacyContext] Falha ao gravar armazenamento local:', error);
    return false;
  }
};

export const safeStorageRemove = (key) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('[PrivacyContext] Falha ao remover armazenamento local:', error);
    return false;
  }
};

export const FUNCTIONAL_STORAGE_KEYS = ['mertilo_selected_period', 'mertilo_account_settings'];

const normalizePreferences = (preferences = {}) => ({
  necessary: true,
  functional: Boolean(preferences.functional),
  analytics: Boolean(preferences.analytics),
  marketing: Boolean(preferences.marketing),
});

const normalizeConsentRecord = (value) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const version = value.version || value.schemaVersion || value.consentVersion;
  if (!version || version !== CONSENT_SCHEMA_VERSION) {
    return null;
  }

  const policyVersion = value.policyVersion;
  if (policyVersion !== PRIVACY_POLICY_VERSION) {
    return null;
  }

  const preferences = normalizePreferences(value.preferences || {});

  return {
    version: CONSENT_SCHEMA_VERSION,
    policyVersion: PRIVACY_POLICY_VERSION,
    timestamp: typeof value.timestamp === 'string' ? value.timestamp : new Date().toISOString(),
    preferences,
  };
};

const parseConsentFromStorageValue = (rawValue) => {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return normalizeConsentRecord(parsed);
  } catch (error) {
    console.warn('[PrivacyContext] JSON de consentimento inválido:', error);
    return null;
  }
};

const buildConsentRecord = (preferences = {}) => ({
  version: CONSENT_SCHEMA_VERSION,
  policyVersion: PRIVACY_POLICY_VERSION,
  timestamp: new Date().toISOString(),
  preferences: normalizePreferences({
    ...DEFAULT_PREFERENCES,
    ...preferences,
  }),
});

export const PrivacyProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id;
  const [consent, setConsent] = useState(() => parseConsentFromStorageValue(safeStorageGet(PRIVACY_STORAGE_KEY)));
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');

  useEffect(() => {
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 300);
      return () => clearTimeout(timer);
    }

    setShowBanner(false);
    return undefined;
  }, [consent]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== PRIVACY_STORAGE_KEY) return;

      if (event.newValue === null) {
        setConsent(null);
        setStorageNotice('');
        return;
      }

      const nextConsent = parseConsentFromStorageValue(event.newValue);
      if (nextConsent) {
        setConsent(nextConsent);
        setStorageNotice('');
      } else {
        setConsent(null);
        setStorageNotice('');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const removeFunctionalValues = useCallback(() => {
    let removed = true;
    const keysToRemove = new Set(FUNCTIONAL_STORAGE_KEYS);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (key && FUNCTIONAL_STORAGE_KEYS.some((baseKey) => key.startsWith(`${baseKey}:`))) {
            keysToRemove.add(key);
          }
        }
      }
    } catch (error) {
      console.warn('[PrivacyContext] Falha ao localizar preferências funcionais:', error);
      removed = false;
    }
    for (const key of keysToRemove) {
      if (!safeStorageRemove(key)) removed = false;
    }
    return removed;
  }, []);

  const saveConsent = useCallback((preferences) => {
    const nextConsent = buildConsentRecord(preferences);
    const persisted = safeStorageSet(PRIVACY_STORAGE_KEY, JSON.stringify(nextConsent));

    if (!persisted) {
      setStorageNotice('Não foi possível salvar a preferência de privacidade neste navegador.');
      return false;
    }

    setConsent(nextConsent);
    const functionalRemoved = nextConsent.preferences.functional || removeFunctionalValues();
    setStorageNotice(functionalRemoved ? '' : 'Não foi possível remover todas as preferências funcionais deste navegador.');
    setShowBanner(false);
    setShowModal(false);
    return true;
  }, [removeFunctionalValues]);

  const acceptAll = useCallback(() => saveConsent({ functional: true, analytics: false, marketing: false }), [saveConsent]);
  const rejectAll = useCallback(() => saveConsent({ functional: false, analytics: false, marketing: false }), [saveConsent]);
  const functionalEnabled = consent?.preferences.functional === true;
  const getFunctionalValue = useCallback((key, fallback = null) => {
    if (!userId || !functionalEnabled) return fallback;
    return safeStorageGet(`${key}:${userId}`) ?? fallback;
  }, [functionalEnabled, userId]);
  const setFunctionalValue = useCallback((key, value) => {
    if (!userId || !functionalEnabled) return false;
    return safeStorageSet(`${key}:${userId}`, value);
  }, [functionalEnabled, userId]);
  return (
    <PrivacyContext.Provider
      value={{
        consent,
        showBanner,
        setShowBanner,
        showModal,
        setShowModal,
        acceptAll,
        rejectAll,
        saveConsent,
        functionalEnabled,
        getFunctionalValue,
        setFunctionalValue,
        removeFunctionalValues,
        storageNotice,
        setStorageNotice,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};
