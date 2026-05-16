import * as SecureStore from 'expo-secure-store';

const scopeStates = new Map();
let activeScope = 'anonymous';

const createScopeState = () => ({
  favoriteState: new Map(),
  listeners: new Set(),
  pendingRequests: new Map(),
  clickCounts: new Map(),
});

const getScopeKey = (scope = activeScope) => {
  if (scope == null) return 'anonymous';
  if (typeof scope === 'string') {
    const trimmed = scope.trim();
    return trimmed || 'anonymous';
  }
  if (typeof scope === 'number' || typeof scope === 'boolean') {
    return String(scope);
  }
  if (scope && typeof scope.toString === 'function') {
    const value = scope.toString();
    if (value && value !== '[object Object]') {
      return value;
    }
  }
  return 'anonymous';
};

const getScopeState = (scope = activeScope) => {
  const key = getScopeKey(scope);
  if (!scopeStates.has(key)) {
    scopeStates.set(key, createScopeState());
  }
  return scopeStates.get(key);
};

const getKey = (offerId) => {
  if (offerId == null) return null;
  const t = typeof offerId;
  if (t === 'string' || t === 'number' || t === 'boolean') return String(offerId);
  // prefer a useful toString() (Mongoose ObjectId gives hex string)
  if (offerId && typeof offerId.toString === 'function') {
    const s = offerId.toString();
    if (s && s !== '[object Object]') return s;
  }
  try {
    return JSON.stringify(offerId);
  } catch (e) {
    return String(offerId);
  }
};

const setUserScope = (scope) => {
  activeScope = getScopeKey(scope);
  getScopeState(activeScope);
};

const getUserScope = () => activeScope;

const clearScope = (scope = activeScope) => {
  const key = getScopeKey(scope);
  scopeStates.delete(key);
};

const clearUserScope = () => {
  clearScope(activeScope);
  activeScope = 'anonymous';
  getScopeState(activeScope);
};

const syncUserScopeFromStorage = async () => {
  try {
    const raw = await SecureStore.getItemAsync('userData');
    if (!raw) {
      clearUserScope();
      return 'anonymous';
    }

    const parsed = JSON.parse(raw);
    const scope = parsed?._id ? String(parsed._id) : 'anonymous';
    setUserScope(scope);
    return scope;
  } catch {
    clearUserScope();
    return 'anonymous';
  }
};

const setFavorite = (offerId, isFavorite) => {
  const key = getKey(offerId);
  if (!key) return;

  const scopeState = getScopeState();
  const nextValue = Boolean(isFavorite);
  const prev = scopeState.favoriteState.has(key) ? scopeState.favoriteState.get(key) : undefined;
  if (prev === nextValue) return; // no change, avoid noisy notifications

  scopeState.favoriteState.set(key, nextValue);
  scopeState.listeners.forEach((listener) => listener({ offerId: key, isFavorite: nextValue }));
};

const getFavorite = (offerId) => {
  const key = getKey(offerId);
  if (!key) return undefined;
  const scopeState = getScopeState();
  return scopeState.favoriteState.has(key) ? scopeState.favoriteState.get(key) : undefined;
};

const subscribe = (listener) => {
  const scopeState = getScopeState();
  scopeState.listeners.add(listener);
  return () => scopeState.listeners.delete(listener);
};

const setPending = (offerId, promise) => {
  const key = getKey(offerId);
  if (!key) return;
  const scopeState = getScopeState();
  scopeState.pendingRequests.set(key, promise);
};

const getPending = (offerId) => {
  const key = getKey(offerId);
  const scopeState = getScopeState();
  return key ? scopeState.pendingRequests.get(key) : null;
};

const clearPending = (offerId) => {
  const key = getKey(offerId);
  const scopeState = getScopeState();
  if (key) scopeState.pendingRequests.delete(key);
};

const getClickCount = (offerId) => {
  const key = getKey(offerId);
  const scopeState = getScopeState();
  return key ? (scopeState.clickCounts.get(key) || 0) : 0;
};

const incrementClickCount = (offerId) => {
  const key = getKey(offerId);
  const scopeState = getScopeState();
  if (key) scopeState.clickCounts.set(key, (scopeState.clickCounts.get(key) || 0) + 1);
};

const decrementClickCount = (offerId) => {
  const key = getKey(offerId);
  const scopeState = getScopeState();
  if (key) {
    const count = (scopeState.clickCounts.get(key) || 0) - 1;
    if (count <= 0) scopeState.clickCounts.delete(key);
    else scopeState.clickCounts.set(key, count);
  }
};

export default {
  getFavorite,
  setFavorite,
  subscribe,
  setPending,
  getPending,
  clearPending,
  getClickCount,
  incrementClickCount,
  decrementClickCount,
  setUserScope,
  getUserScope,
  clearUserScope,
  clearScope,
  syncUserScopeFromStorage,
};
