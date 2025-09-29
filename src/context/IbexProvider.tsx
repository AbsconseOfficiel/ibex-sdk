// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Provider IBEX
 * Configuration centralisée pour le SDK
 */

import { ReactNode, createContext, useContext } from 'react';
import type { IbexConfig } from '../types';

// ============================================================================
// TYPES DU CONTEXTE
// ============================================================================

export interface IbexProviderProps {
  children: ReactNode;
  config: IbexConfig;
}

interface IbexContextValue {
  config: IbexConfig;
}

// ============================================================================
// CONTEXTE
// ============================================================================

const IbexContext = createContext<IbexContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Provider IBEX simplifié
 * Configure le SDK avec les paramètres de base
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <IbexProvider config={{
 *       baseURL: "https://api.ibex.com",
 *       domain: "ibex.com"
 *     }}>
 *       <Dashboard />
 *     </IbexProvider>
 *   );
 * }
 * ```
 */
export function IbexProvider({ children, config }: IbexProviderProps) {
  const value: IbexContextValue = {
    config,
  };

  return <IbexContext.Provider value={value}>{children}</IbexContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour accéder à la configuration IBEX
 *
 * @returns Configuration IBEX
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { config } = useIbexConfig();
 *   console.log('Base URL:', config.baseURL);
 * }
 * ```
 */
export function useIbexConfig(): IbexContextValue {
  const context = useContext(IbexContext);

  if (!context) {
    throw new Error('useIbexConfig doit être utilisé dans un IbexProvider');
  }

  return context;
}
