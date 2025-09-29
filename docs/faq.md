<div align="center">

# FAQ - Questions fréquentes

### Réponses aux questions les plus courantes et solutions aux problèmes fréquents

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-Stable-green)](https://github.com/ibex/sdk)

[Authentification](#authentification) • [Données](#données) • [Transactions](#transactions) • [Support](#support)

</div>

---

## Authentification

### Q: Pourquoi l'authentification ne fonctionne pas ?

**R:** Vérifiez les points suivants :

<table>
<tr>
<td width="50%">

### Points de vérification

1. **HTTPS requis** : WebAuthn nécessite HTTPS en production
2. **Navigateur supporté** : Chrome 88+, Firefox 60+, Safari 14+
3. **Configuration correcte** : Vérifiez `domain` et `rpId` dans la config
4. **Erreurs console** : Regardez les erreurs dans la console du navigateur

</td>
<td width="50%">

### Configuration de base

```typescript
const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'your-domain.com',
  rpId: 'your-domain.com', // Doit correspondre au domaine
};
```

</td>
</tr>
</table>

### Q: Comment forcer l'utilisation de PIN/biométrie ?

**R:** Le SDK est configuré par défaut pour privilégier les authentificateurs intégrés :

```typescript
// Configuration automatique dans le SDK
const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'your-domain.com',
  // Le SDK gère automatiquement les préférences WebAuthn
};
```

### Q: L'erreur "NotSupportedError" apparaît, que faire ?

**R:** Cette erreur indique que le navigateur ne supporte pas WebAuthn :

| Solution | Description                                                   |
| -------- | ------------------------------------------------------------- |
| 1️⃣       | **Mettez à jour le navigateur** vers une version récente      |
| 2️⃣       | **Vérifiez HTTPS** : WebAuthn ne fonctionne qu'en HTTPS       |
| 3️⃣       | **Testez sur un autre navigateur** pour confirmer le problème |

### Q: Comment gérer les erreurs d'authentification ?

**R:** Utilisez le hook `useIbex` pour gérer les erreurs :

```typescript
import { useIbex } from '@absconse/ibex-sdk';

function ErrorHandler() {
  const { error, clearError } = useIbex(config);

  if (error) {
    return (
      <div className="error">
        <h3>Erreur d'authentification</h3>
        <p>{error}</p>
        <button onClick={clearError}>Réessayer</button>
      </div>
    );
  }

  return null;
}
```

---

## Données

### Q: Les transactions ne s'affichent pas, pourquoi ?

**R:** Vérifiez les points suivants :

<table>
<tr>
<td width="50%">

### Points de vérification

1. **Utilisateur authentifié** : L'utilisateur doit être connecté
2. **Réseau** : Vérifiez que vous êtes sur le bon réseau
3. **Permissions** : L'utilisateur doit avoir les bonnes permissions
4. **Erreurs** : Vérifiez la propriété `error` du hook

</td>
<td width="50%">

### Code de vérification

```typescript
// Vérification de l'état
const { user, transactions, error, isLoading } = useIbex(config);

if (!user) {
  return <div>Veuillez vous connecter</div>;
}

if (error) {
  return <div>Erreur: {error}</div>;
}

if (isLoading) {
  return <div>Chargement...</div>;
}

console.log('Transactions:', transactions);
```

</td>
</tr>
</table>

### Q: Les soldes affichent 0 malgré des fonds, que faire ?

**R:** Plusieurs causes possibles :

| Cause                           | Solution                                 |
| ------------------------------- | ---------------------------------------- |
| **Utilisateur non authentifié** | Vérifiez que l'utilisateur est connecté  |
| **Réseau incorrect**            | Vérifiez que vous êtes sur le bon réseau |
| **Cache**                       | Essayez de rafraîchir les données        |
| **Erreur**                      | Vérifiez la propriété `error`            |

```typescript
// Rafraîchir les données
const { refresh, balance, error } = useIbex(config);

const handleRefresh = () => {
  refresh();
  console.log('Données actualisées');
};

if (error) {
  console.error('Erreur de solde:', error);
}
```

### Q: Comment afficher les données en temps réel ?

**R:** Utilisez la fonction `refresh` :

```typescript
function RealTimeData() {
  const { refresh } = useIbex(config);

  // Rafraîchir toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  return <div>Données en temps réel</div>;
}
```

---

## Transactions

### Q: Comment formater les montants correctement ?

**R:** Utilisez les utilitaires JavaScript natifs :

```typescript
// Formatage des montants
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Utilisation
const { balance } = useIbex(config);
console.log(formatAmount(balance)); // "22 212,89 €"
```

### Q: Les hash de transactions sont trop longs, comment les raccourcir ?

**R:** Créez une fonction de formatage personnalisée :

```typescript
const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Utilisation
const { transactions } = useIbex(config);
transactions.forEach(tx => {
  console.log(formatAddress(tx.hash)); // "0x4c9b...f625"
});
```

### Q: Comment afficher les statuts des transactions ?

**R:** Créez une fonction de formatage des statuts :

```typescript
const getStatusLabel = (status: string) => {
  const statusMap = {
    confirmed: 'Confirmée',
    pending: 'En attente',
    failed: 'Échouée',
  };
  return statusMap[status] || 'Inconnue';
};

const getStatusClasses = (status: string) => {
  const statusMap = {
    confirmed: 'text-green-600 bg-green-50',
    pending: 'text-yellow-600 bg-yellow-50',
    failed: 'text-red-600 bg-red-50',
  };
  return statusMap[status] || 'text-gray-600 bg-gray-50';
};

function TransactionStatus({ status }) {
  return <span className={`status ${getStatusClasses(status)}`}>{getStatusLabel(status)}</span>;
}
```

---

## Opérations Safe

### Q: L'erreur "Unauthorized" apparaît lors des transferts, pourquoi ?

**R:** Cette erreur indique un problème d'authentification :

<table>
<tr>
<td width="50%">

### Causes possibles

1. **Session expirée** : L'utilisateur doit se reconnecter
2. **Utilisateur non authentifié** : Vérifiez que l'utilisateur est connecté
3. **Permissions** : L'utilisateur doit avoir les bonnes permissions

</td>
<td width="50%">

### Code de vérification

```typescript
// Vérification de l'état d'authentification
const { user, error } = useIbex(config);

if (!user) {
  return <div>Veuillez vous connecter pour effectuer des transferts</div>;
}

if (error) {
  return <div>Erreur: {error}</div>;
}
```

</td>
</tr>
</table>

### Q: Comment gérer les erreurs de transfert ?

**R:** Utilisez un try/catch pour capturer les erreurs :

```typescript
function TransferComponent() {
  const { send, error, clearError } = useIbex(config);
  const [localError, setLocalError] = useState(null);

  const handleTransfer = async (amount: number, to: string) => {
    try {
      setLocalError(null);
      clearError();
      await send(amount, to);
      alert('Transfert réussi !');
    } catch (err) {
      setLocalError(err.message);
      console.error('Erreur de transfert:', err);
    }
  };

  return (
    <div>
      {(error || localError) && <div className="error">{error || localError}</div>}
      {/* Formulaire de transfert */}
    </div>
  );
}
```

### Q: Les retraits IBAN ne fonctionnent pas, que faire ?

**R:** Vérifiez les points suivants :

| Point                       | Vérification                                             |
| --------------------------- | -------------------------------------------------------- |
| **Format IBAN**             | Doit être valide (ex: FR76 1234 5678 9012 3456 7890 123) |
| **Montant**                 | Doit être supérieur aux frais                            |
| **Utilisateur authentifié** | L'utilisateur doit être connecté                         |

```typescript
// Validation IBAN basique
const isValidIban = (iban: string) => {
  const cleanIban = iban.replace(/\s/g, '');
  return cleanIban.length >= 15 && cleanIban.length <= 34;
};

function WithdrawComponent() {
  const { withdraw, user } = useIbex(config);
  const [iban, setIban] = useState('');
  const [amount, setAmount] = useState('');

  const handleWithdraw = async () => {
    if (!user) {
      alert('Veuillez vous connecter');
      return;
    }

    if (!isValidIban(iban)) {
      alert('IBAN invalide');
      return;
    }

    try {
      await withdraw(parseFloat(amount), iban);
      alert('Retrait réussi !');
    } catch (error) {
      console.error('Erreur de retrait:', error);
    }
  };

  return (
    <div>
      <input type="text" placeholder="IBAN" value={iban} onChange={e => setIban(e.target.value)} />
      <input
        type="number"
        placeholder="Montant"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <button onClick={handleWithdraw}>Retirer</button>
    </div>
  );
}
```

---

## Personnalisation

### Q: Comment créer mes propres composants ?

**R:** Utilisez le hook `useIbex` pour créer vos composants :

```typescript
// Composant de transaction personnalisé
import { useIbex } from '@absconse/ibex-sdk';

function MyTransactionCard() {
  const { transactions } = useIbex(config);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  return (
    <div className="my-transaction-card">
      {transactions.map(tx => (
        <div key={tx.id} className="transaction">
          <div className="header">
            <h3>{tx.type}</h3>
            <span className="status">{tx.status}</span>
          </div>
          <div className="content">
            <p>Montant: {formatAmount(tx.amount)}</p>
            <p>Date: {formatDate(tx.date)}</p>
            <p>
              Hash: {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Q: Comment utiliser Tailwind CSS avec le SDK ?

**R:** Le SDK est compatible avec Tailwind CSS :

```typescript
// Utilisation avec Tailwind
function TransactionCard() {
  const { transactions } = useIbex(config);

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      {transactions.map(tx => (
        <div key={tx.id} className="mb-4 p-4 border rounded">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{tx.type}</h3>
            <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
              {tx.status}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">
              {tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-gray-600">{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
            <p className="text-sm text-gray-500 font-mono">
              {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Performance

### Q: Comment optimiser les performances ?

**R:** Plusieurs stratégies d'optimisation :

<table>
<tr>
<td width="50%">

### Stratégies d'optimisation

1. **Lazy loading** : Chargez les données seulement quand nécessaire
2. **Debouncing** : Évitez les appels API trop fréquents
3. **Memoization** : Utilisez `useMemo` et `useCallback`
4. **Rafraîchissement intelligent** : Utilisez `refresh` seulement quand nécessaire

</td>
<td width="50%">

### Code d'optimisation

```typescript
// Optimisation avec useMemo
import { useMemo } from 'react';
import { useIbex } from '@absconse/ibex-sdk';

function OptimizedTransactionList() {
  const { transactions } = useIbex(config);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  return (
    <div>
      {recentTransactions.map(tx => (
        <TransactionCard key={tx.id} transaction={tx} />
      ))}
    </div>
  );
}
```

</td>
</tr>
</table>

### Q: Comment gérer le cache des données ?

**R:** Le SDK gère automatiquement le cache, mais vous pouvez le contrôler :

```typescript
// Rafraîchissement manuel
const { refresh } = useIbex(config);

// Rafraîchir toutes les 5 minutes
useEffect(() => {
  const interval = setInterval(refresh, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, [refresh]);
```

---

## Développement

### Q: Comment activer le mode debug ?

**R:** Activez le mode debug dans la configuration :

```typescript
const config = {
  baseURL: 'https://api-testnet.ibexwallet.org',
  domain: 'test.com',
  rpId: 'test.com',
  // Le SDK gère automatiquement les logs de debug
};

<IbexProvider config={config}>
  <YourApp />
</IbexProvider>;
```

### Q: Comment déboguer les problèmes d'API ?

**R:** Utilisez les outils de développement du navigateur :

```typescript
// Logs de debug
const { transactions, error, isLoading } = useIbex(config);

useEffect(() => {
  if (error) {
    console.error('Erreur:', error);
  }
  if (transactions) {
    console.log('Transactions chargées:', transactions);
  }
  if (isLoading) {
    console.log('Chargement en cours...');
  }
}, [transactions, error, isLoading]);
```

### Q: Comment contribuer au SDK ?

**R:** Voir le guide de contribution :

| Étape | Action                                   |
| ----- | ---------------------------------------- |
| 1️⃣    | **Fork** le repository                   |
| 2️⃣    | **Créer** une branche pour votre feature |
| 3️⃣    | **Tester** vos modifications             |
| 4️⃣    | **Soumettre** une pull request           |

```bash
# Installation pour le développement
git clone https://github.com/ibex/sdk.git
cd sdk
npm install
npm run dev
```

## Support

### Q: Où trouver de l'aide ?

**R:** Plusieurs ressources disponibles :

| Ressource         | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| **Documentation** | [docs/](./docs/)                                              |
| **Issues GitHub** | [GitHub Issues](https://github.com/ibex/sdk/issues)           |
| **Discussions**   | [GitHub Discussions](https://github.com/ibex/sdk/discussions) |
| **Exemples**      | [Exemples d'utilisation](./examples.md)                       |

### Q: Comment signaler un bug ?

**R:** Utilisez le template d'issue GitHub :

```markdown
## Description du bug

Description claire du problème.

## Étapes pour reproduire

1. Aller à '...'
2. Cliquer sur '...'
3. Voir l'erreur

## Comportement attendu

Description du comportement attendu.

## Captures d'écran

Si applicable, ajoutez des captures d'écran.

## Environnement

- OS: [ex: Windows 10]
- Navigateur: [ex: Chrome 88]
- Version SDK: [ex: 1.0.0]
```

### Q: Comment demander une fonctionnalité ?

**R:** Utilisez le template de feature request :

```markdown
## Description de la fonctionnalité

Description claire de la fonctionnalité souhaitée.

## Cas d'usage

Pourquoi cette fonctionnalité serait-elle utile ?

## Alternatives considérées

Décrivez les alternatives que vous avez considérées.

## Contexte supplémentaire

Ajoutez tout autre contexte ou captures d'écran.
```
