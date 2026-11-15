import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const PRIVACY_STORAGE_KEY = 'mertilo_privacy_consent';
export const CONSENT_SCHEMA_VERSION = '1.0.0';
export const PRIVACY_POLICY_VERSION = '1.1.0';
export const TERMS_OF_USE_VERSION = '1.1.0';

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

  const preferences = normalizePreferences(value.preferences || {});

  return {
    version: CONSENT_SCHEMA_VERSION,
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
  timestamp: new Date().toISOString(),
  preferences: normalizePreferences({
    ...DEFAULT_PREFERENCES,
    ...preferences,
  }),
});

export const PrivacyProvider = ({ children }) => {
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
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const removeFunctionalValues = useCallback(() => {
    let removed = true;
    for (const key of FUNCTIONAL_STORAGE_KEYS) {
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
  const getFunctionalValue = useCallback((key, fallback = null) => functionalEnabled ? (safeStorageGet(key) ?? fallback) : fallback, [functionalEnabled]);
  const setFunctionalValue = useCallback((key, value) => functionalEnabled && safeStorageSet(key, value), [functionalEnabled]);
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
