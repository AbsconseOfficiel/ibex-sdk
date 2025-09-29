<div align="center">

# Configuration IBEX SDK

### Guide complet de configuration pour tous les environnements

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-Stable-green)](https://github.com/ibex/sdk)

[Configuration de base](#configuration-de-base) • [Environnements](#environnements) • [Variables d'environnement](#variables-denvironnement) • [Validation et erreurs](#validation-et-erreurs)

</div>

---

## Vue d'ensemble

### Philosophie de configuration

L'IBEX SDK suit le principe du **"Zero Configuration"** :

<table>
<tr>
<td width="50%">

### Configuration minimale

- **Seuls les paramètres essentiels** sont requis
- **Auto-détection** des paramètres selon l'environnement
- **Intelligence** adaptative du SDK

</td>
<td width="50%">

### Paramètres essentiels

```typescript
const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'votre-domaine.com',
};
```

**C'est tout !**

</td>
</tr>
</table>

---

## Configuration de base

### Paramètres requis

| Paramètre | Type     | Description           | Exemple                      |
| --------- | -------- | --------------------- | ---------------------------- |
| `baseURL` | `string` | URL de l'API IBEX     | `https://api.ibexwallet.org` |
| `domain`  | `string` | Domaine pour WebAuthn | `votre-domaine.com`          |

### Configuration minimale complète

```typescript
import { IbexProvider } from '@absconse/ibex-sdk';

const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'votre-domaine.com',
};

function App() {
  return (
    <IbexProvider config={config}>
      <YourApp />
    </IbexProvider>
  );
}
```

**Résultat attendu :**

- ✅ SDK initialisé avec succès
- ✅ Authentification WebAuthn configurée
- ✅ Prêt pour la production

---

## Paramètres optionnels

### Paramètres d'authentification

| Paramètre    | Type     | Défaut   | Description                   |
| ------------ | -------- | -------- | ----------------------------- |
| `rpId`       | `string` | `domain` | Relier Party ID pour WebAuthn |
| `timeout`    | `number` | `30000`  | Timeout des requêtes (ms)     |
| `retries`    | `number` | `3`      | Nombre de tentatives          |
| `retryDelay` | `number` | `1000`   | Délai entre tentatives (ms)   |

### Configuration avancée

```typescript
const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'votre-domaine.com',

  // Paramètres optionnels
  rpId: 'votre-domaine.com', // Auto-déduit si non spécifié
  timeout: 30000, // 30 secondes
  retries: 3, // 3 tentatives
  retryDelay: 1000, // 1 seconde entre tentatives
  debug: process.env.NODE_ENV === 'development',
  defaultChainId: 1, // Ethereum mainnet
};
```

**Fonctionnalités WebSocket automatiques :**

- ✅ Connexion WebSocket automatique
- ✅ Mises à jour en temps réel (solde, transactions)
- ✅ Gestion des erreurs de connexion
- ✅ Reconnexion automatique

**Points clés :**

- ✅ `rpId` est automatiquement déduit du `domain`
- ✅ `defaultChainId` est auto-détecté selon l'URL
- ✅ Mode debug activé en développement

---

## Environnements

### Développement local

```typescript
// src/config/ibex.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const IBEX_CONFIG = {
  baseURL: isDevelopment
    ? 'http://localhost:3001/api' // API locale
    : 'https://api.ibexwallet.org', // Production
  domain: isDevelopment
    ? 'localhost' // Domaine local
    : 'votre-domaine.com', // Domaine de production
  debug: isDevelopment, // Logs en développement
};
```

### Testnet

```typescript
export const IBEX_CONFIG = {
  baseURL: 'https://api-testnet.ibexwallet.org',
  domain: 'test.votre-domaine.com',
  debug: true,
  timeout: 60000, // Timeout plus long pour les tests
};
```

### Production

```typescript
export const IBEX_CONFIG = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'votre-domaine.com',
  debug: false,
  timeout: 30000,
  retries: 3,
};
```

### Staging

```typescript
export const IBEX_CONFIG = {
  baseURL: 'https://api-staging.ibexwallet.org',
  domain: 'staging.votre-domaine.com',
  debug: false,
  timeout: 45000,
};
```

---

## Auto-détection intelligente

### Détection automatique

<table>
<tr>
<td width="50%">

### Détection du Chain ID

```typescript
// Détection automatique
if (baseURL.includes('localhost')) {
  defaultChainId = 31337; // Hardhat local
} else if (baseURL.includes('testnet')) {
  defaultChainId = 11155111; // Sepolia testnet
} else {
  defaultChainId = 1; // Ethereum mainnet
}
```

</td>
<td width="50%">

### Détection du RP ID

```typescript
// Auto-déduction
rpId = domain; // 'votre-domaine.com' → rpId: 'votre-domaine.com'
```

</td>
</tr>
</table>

### Détection de l'environnement

```typescript
// Détection automatique de l'environnement
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
```

**Avantages :**

- ✅ Configuration automatique selon l'URL
- ✅ Moins d'erreurs de configuration
- ✅ Adaptation intelligente

---

## Variables d'environnement

### Configuration avec variables d'environnement

```typescript
// src/config/ibex.ts
export const IBEX_CONFIG = {
  baseURL: process.env.REACT_APP_IBEX_API_URL || 'https://api.ibexwallet.org',
  domain: process.env.REACT_APP_IBEX_DOMAIN || 'votre-domaine.com',
  debug: process.env.NODE_ENV === 'development',
  timeout: parseInt(process.env.REACT_APP_IBEX_TIMEOUT || '30000'),
  retries: parseInt(process.env.REACT_APP_IBEX_RETRIES || '3'),
};
```

### Fichiers d'environnement

<details>
<summary><b>Fichiers .env par environnement</b></summary>

```bash
# .env
REACT_APP_IBEX_API_URL=https://api-testnet.ibexwallet.org
REACT_APP_IBEX_DOMAIN=localhost
REACT_APP_IBEX_DEBUG=true
```

</details>

---

## Configuration avancée

### Configuration dynamique

```typescript
// Configuration basée sur la détection du domaine
function getConfig() {
  const hostname = window.location.hostname;

  if (hostname === 'localhost') {
    return {
      baseURL: 'http://localhost:3001/api',
      domain: 'localhost',
      debug: true,
    };
  }

  if (hostname.includes('staging')) {
    return {
      baseURL: 'https://api-staging.ibexwallet.org',
      domain: hostname,
      debug: false,
    };
  }

  return {
    baseURL: 'https://api.ibexwallet.org',
    domain: hostname,
    debug: false,
  };
}

const config = getConfig();
```

### Configuration avec validation

```typescript
// src/config/ibex.ts
interface IbexConfig {
  baseURL: string;
  domain: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

function validateConfig(config: any): IbexConfig {
  if (!config.baseURL) {
    throw new Error('baseURL est requis');
  }

  if (!config.domain) {
    throw new Error('domain est requis');
  }

  if (!config.baseURL.startsWith('https://') && !config.baseURL.includes('localhost')) {
    console.warn('baseURL devrait utiliser HTTPS en production');
  }

  return {
    baseURL: config.baseURL,
    domain: config.domain,
    timeout: config.timeout || 30000,
    retries: config.retries || 3,
    debug: config.debug || false,
  };
}

export const IBEX_CONFIG = validateConfig({
  baseURL: process.env.REACT_APP_IBEX_API_URL,
  domain: process.env.REACT_APP_IBEX_DOMAIN,
  timeout: process.env.REACT_APP_IBEX_TIMEOUT,
  retries: process.env.REACT_APP_IBEX_RETRIES,
  debug: process.env.NODE_ENV === 'development',
});
```

---

## Configuration du Provider

### Utilisation basique

```typescript
import { IbexProvider } from '@absconse/ibex-sdk';
import { IBEX_CONFIG } from './config/ibex';

function App() {
  return (
    <IbexProvider config={IBEX_CONFIG}>
      <YourApp />
    </IbexProvider>
  );
}
```

### Configuration avec gestion d'erreur

```typescript
function App() {
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Validation de la configuration
      if (!IBEX_CONFIG.baseURL || !IBEX_CONFIG.domain) {
        throw new Error('Configuration IBEX incomplète');
      }
    } catch (error) {
      setConfigError(error.message);
    }
  }, []);

  if (configError) {
    return (
      <div className="config-error">
        <h2>Erreur de configuration</h2>
        <p>{configError}</p>
        <p>Vérifiez votre fichier de configuration.</p>
      </div>
    );
  }

  return (
    <IbexProvider config={IBEX_CONFIG}>
      <YourApp />
    </IbexProvider>
  );
}
```

### Configuration avec fallback

```typescript
function App() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // Chargement de la configuration
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const configData = await response.json();
        setConfig(configData);
      } catch (error) {
        console.error('Erreur de chargement de la configuration:', error);
        // Configuration de fallback
        setConfig({
          baseURL: 'https://api.ibexwallet.org',
          domain: window.location.hostname,
        });
      }
    };

    loadConfig();
  }, []);

  if (!config) {
    return <div>Chargement de la configuration...</div>;
  }

  return (
    <IbexProvider config={config}>
      <YourApp />
    </IbexProvider>
  );
}
```

---

## Validation et erreurs

### Validation de configuration

```typescript
// src/utils/config-validator.ts
interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateIbexConfig(config: any): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validation des paramètres requis
  if (!config.baseURL) {
    errors.push('baseURL est requis');
  } else {
    if (!config.baseURL.startsWith('https://') && !config.baseURL.includes('localhost')) {
      warnings.push('baseURL devrait utiliser HTTPS en production');
    }
  }

  if (!config.domain) {
    errors.push('domain est requis');
  }

  // Validation des paramètres optionnels
  if (config.timeout && (typeof config.timeout !== 'number' || config.timeout < 1000)) {
    errors.push('timeout doit être un nombre supérieur à 1000ms');
  }

  if (config.retries && (typeof config.retries !== 'number' || config.retries < 0)) {
    errors.push('retries doit être un nombre positif');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
```

### Gestion des erreurs de configuration

```typescript
// src/components/ConfigError.tsx
interface ConfigErrorProps {
  errors: string[];
  warnings: string[];
}

function ConfigError({ errors, warnings }: ConfigErrorProps) {
  return (
    <div className="config-error">
      <h2>Erreur de configuration IBEX</h2>

      {errors.length > 0 && (
        <div className="errors">
          <h3>Erreurs critiques :</h3>
          <ul>
            {errors.map((error, index) => (
              <li key={index} className="error">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="warnings">
          <h3>Avertissements :</h3>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index} className="warning">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="help">
        <p>
          Consultez la <a href="/docs/configuration">documentation de configuration</a>
          pour résoudre ces problèmes.
        </p>
      </div>
    </div>
  );
}
```

---

## Bonnes pratiques

### 1. Séparation des environnements

<table>
<tr>
<td width="50%">

### ✅ Bon - Configuration séparée

```typescript
const config = {
  development: {
    baseURL: 'https://api-testnet.ibexwallet.org',
    domain: 'localhost',
    debug: true,
  },
  production: {
    baseURL: 'https://api.ibexwallet.org',
    domain: 'votre-domaine.com',
    debug: false,
  },
};
```

</td>
<td width="50%">

### ❌ Éviter - Configuration mixte

```typescript
const badConfig = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'localhost', // Mélange production/développement
  debug: true,
};
```

</td>
</tr>
</table>

### 2. Validation stricte

<table>
<tr>
<td width="50%">

### ✅ Bon - Validation de configuration

```typescript
function createConfig(config: any): IbexConfig {
  if (!config.baseURL || !config.domain) {
    throw new Error('Configuration IBEX invalide');
  }

  return {
    baseURL: config.baseURL,
    domain: config.domain,
    timeout: config.timeout || 30000,
    retries: config.retries || 3,
    debug: config.debug || false,
  };
}
```

</td>
<td width="50%">

### ❌ Éviter - Configuration sans validation

```typescript
const badConfig = config; // Pas de validation
```

</td>
</tr>
</table>

### 3. Gestion des erreurs

<table>
<tr>
<td width="50%">

### ✅ Bon - Gestion des erreurs

```typescript
try {
  const config = createConfig(process.env);
  <IbexProvider config={config}>
    <App />
  </IbexProvider>;
} catch (error) {
  return <ConfigError error={error.message} />;
}
```

</td>
<td width="50%">

### ❌ Éviter - Pas de gestion d'erreur

```typescript
<IbexProvider config={config}>
  <App />
</IbexProvider>
```

</td>
</tr>
</table>
