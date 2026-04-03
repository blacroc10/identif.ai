import React, { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

const initialState = {
  activeCaseId: null,
  activeCase: null,
  sidebarOpen: true,
  theme: 'dark-techno',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_CASE':
      return { ...state, activeCaseId: action.payload?.id || null, activeCase: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setActiveCase = useCallback((cas) => dispatch({ type: 'SET_ACTIVE_CASE', payload: cas }), []);
  const toggleSidebar = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []);

  return (
    <AppContext.Provider value={{ ...state, setActiveCase, toggleSidebar, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
