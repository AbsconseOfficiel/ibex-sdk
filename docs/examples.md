<div align="center">

# Exemples pratiques IBEX SDK

### Exemples concrets et prêts à l'emploi pour tous les cas d'usage

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-Stable-green)](https://github.com/AbsconseOfficiel/ibex-sdk)

[Exemples de base](#exemples-de-base) • [Composants d'interface](#composants-dinterface) • [Applications complètes](#applications-complètes)

</div>

---

## Exemples de base

### Architecture hybride en action

Exemple montrant comment l'architecture API REST + WebSocket fonctionne en pratique.

```tsx
// src/components/DataFlowExample.tsx
import React, { useEffect } from 'react';
import { useIbex } from '@absconse/ibex-sdk';

function DataFlowExample() {
  const { user, balance, transactions, operations, isWebSocketConnected, isLoading } =
    useIbex(config);

  useEffect(() => {
    console.log('🔄 Flux de données:');
    console.log('📊 Données initiales (API REST):');
    console.log('  - Opérations:', operations.length);
    console.log('🌐 Mises à jour temps réel (WebSocket):');
    console.log('  - Connexion:', isWebSocketConnected);
    console.log('  - Solde:', balance);
    console.log('  - Transactions:', transactions.length);
  }, [operations, transactions, balance, isWebSocketConnected]);

  return (
    <div>
      <h3>Architecture hybride en action</h3>
      <p>Opérations (API REST): {operations.length}</p>
      <p>Transactions (WebSocket): {transactions.length}</p>
      <p>Solde temps réel: {balance} EURe</p>
      <p>WebSocket: {isWebSocketConnected ? '✅ Connecté' : '❌ Déconnecté'}</p>
    </div>
  );
}
```

### Application de connexion simple

Un exemple complet d'authentification avec gestion des états.

```tsx
// src/components/LoginApp.tsx
import React, { useState } from 'react';
import { IbexProvider, useIbex } from '@absconse/ibex-sdk';

const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'votre-domaine.com',
};

function LoginPage() {
  const { user, isLoading, error, signIn, signUp, logout, clearError } = useIbex(config);

  const [showSignUp, setShowSignUp] = useState(false);

  // Gestion des erreurs avec messages personnalisés
  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'NotSupportedError':
        return "Votre navigateur ne supporte pas l'authentification moderne. Veuillez utiliser un navigateur récent.";
      case 'NotAllowedError':
        return "Authentification refusée. Veuillez réessayer et autoriser l'authentification.";
      case 'SecurityError':
        return "Erreur de sécurité. Assurez-vous d'utiliser HTTPS.";
      default:
        return `Erreur: ${error}`;
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Erreur d'authentification</h3>
        <p className="error-message">{getErrorMessage(error)}</p>
        <div className="error-actions">
          <button onClick={clearError} className="btn-primary">
            Réessayer
          </button>
          <button onClick={() => window.location.reload()} className="btn-secondary">
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  // Interface de connexion
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-header">
          <h1>Bienvenue sur IBEX</h1>
          <p>Connectez-vous avec votre passkey pour accéder à votre portefeuille</p>
        </div>

        <div className="auth-section">
          {!showSignUp ? (
            <div className="signin-section">
              <h2>Se connecter</h2>
              <p>Utilisez votre passkey pour vous connecter</p>
              <button onClick={signIn} className="btn-primary btn-large">
                Se connecter avec passkey
              </button>
            </div>
          ) : (
            <div className="signup-section">
              <h2>Créer un compte</h2>
              <p>Configurez votre passkey pour commencer</p>
              <button onClick={() => signUp('Mon Passkey IBEX')} className="btn-primary btn-large">
                Créer un compte
              </button>
            </div>
          )}

          <div className="auth-toggle">
            <button onClick={() => setShowSignUp(!showSignUp)} className="btn-link">
              {showSignUp ? 'Déjà un compte ? Se connecter' : 'Première fois ? Créer un compte'}
            </button>
          </div>
        </div>

        <div className="help-section">
          <h3>Comment ça marche ?</h3>
          <ul>
            <li>✅ Plus besoin de mots de passe</li>
            <li>✅ Authentification par PIN, biométrie ou clé physique</li>
            <li>✅ Sécurité maximale avec chiffrement local</li>
            <li>✅ Synchronisation entre vos appareils</li>
          </ul>
        </div>
      </div>
    );
  }

  // Interface utilisateur connecté
  return (
    <div className="user-container">
      <div className="user-header">
        <h1>Bonjour {user.email || 'Utilisateur'} !</h1>
        <div className="user-status">
          <span className={`status-badge ${user.kyc.status}`}>KYC: {user.kyc.status}</span>
        </div>
      </div>

      <div className="user-info">
        <div className="info-card">
          <h3>Informations du compte</h3>
          <p>
            <strong>ID utilisateur :</strong> {user.id}
          </p>
          <p>
            <strong>Email :</strong> {user.email || 'Non renseigné'}
          </p>
          <p>
            <strong>Statut KYC :</strong> {user.kyc.status}
          </p>
          {user.iban && (
            <p>
              <strong>IBAN :</strong> {user.iban.status}
            </p>
          )}
          {user.wallet && (
            <p>
              <strong>Portefeuille :</strong> {user.wallet.address}
            </p>
          )}
        </div>
      </div>

      <div className="user-actions">
        <button onClick={logout} className="btn-danger">
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <IbexProvider config={config}>
      <LoginPage />
    </IbexProvider>
  );
}

export default App;
```

**Points clés :**

- ✅ Gestion complète des états (chargement, erreurs, utilisateur)
- ✅ Messages d'erreur personnalisés
- ✅ Interface responsive et accessible
- ✅ Code prêt à l'emploi

---

### Dashboard financier complet

Un exemple de tableau de bord avec toutes les fonctionnalités financières.

```tsx
// src/components/FinancialDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useIbex } from '@absconse/ibex-sdk';

function FinancialDashboard() {
  const {
    user,
    balance,
    transactions,
    operations,
    isLoading,
    error,
    send,
    receive,
    withdraw,
    refresh,
    clearError,
    getKycStatusLabel,
  } = useIbex(config);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Actualisation automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  // Formatage des montants
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Formatage des dates
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  // Formatage des adresses
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Gestion des erreurs
  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur du dashboard</h2>
        <p>{error}</p>
        <button onClick={clearError}>Réessayer</button>
      </div>
    );
  }

  // État de chargement
  if (isLoading && !user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement du dashboard...</p>
      </div>
    );
  }

  // Vérification de l'authentification
  if (!user) {
    return (
      <div className="auth-required">
        <h2>Authentification requise</h2>
        <p>Veuillez vous connecter pour accéder au dashboard</p>
      </div>
    );
  }

  return (
    <div className="financial-dashboard">
      {/* En-tête */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard IBEX</h1>
          <p className="user-greeting">Bonjour {user.email || 'Utilisateur'}</p>
          <div className="status-info">
            <span className={`kyc-status ${user.kyc.status}`}>
              KYC: {getKycStatusLabel(user.kyc.level)}
            </span>
            <span className="refresh-info">
              Dernière actualisation: {lastRefresh.toLocaleTimeString('fr-FR')}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button onClick={refresh} className="btn-outline" disabled={isLoading}>
            {isLoading ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </header>

      {/* Section solde */}
      <section className="balance-section">
        <div className="balance-card">
          <div className="balance-header">
            <h2>Votre solde</h2>
            <span className="balance-currency">EURe</span>
          </div>
          <div className="balance-amount">{formatAmount(balance)}</div>
          <div className="balance-actions">
            <button onClick={receive} className="btn-primary">
              Recevoir
            </button>
            <button
              onClick={() => {
                /* Ouvrir modal d'envoi */
              }}
              className="btn-secondary"
            >
              Envoyer
            </button>
          </div>
        </div>
      </section>

      {/* Section actions rapides */}
      <section className="quick-actions-section">
        <h2>Actions rapides</h2>
        <div className="quick-actions-grid">
          <button
            onClick={() => send(100, '0x742d35Cc6634C0532925a3b8D0C0E1c4C5F2A6f')}
            className="action-card"
          >
            <div className="action-icon">💸</div>
            <h3>Envoyer 100€</h3>
            <p>Transfert rapide</p>
          </button>

          <button onClick={receive} className="action-card">
            <div className="action-icon">📥</div>
            <h3>Recevoir</h3>
            <p>Obtenir l'adresse</p>
          </button>

          <button
            onClick={() => withdraw(50, 'FR7612345678901234567890123')}
            className="action-card"
          >
            <div className="action-icon">🏦</div>
            <h3>Retirer vers IBAN</h3>
            <p>Conversion crypto → fiat</p>
          </button>

          <button onClick={refresh} className="action-card">
            <div className="action-icon">🔄</div>
            <h3>Actualiser</h3>
            <p>Mettre à jour les données</p>
          </button>
        </div>
      </section>

      {/* Section transactions */}
      <section className="transactions-section">
        <div className="section-header">
          <h2>Transactions récentes</h2>
          <span className="transaction-count">{transactions.length} transactions</span>
        </div>

        <div className="transactions-list">
          {transactions.slice(0, 10).map(tx => (
            <div key={tx.id} className="transaction-card">
              <div className="transaction-header">
                <div className="transaction-type">
                  <span className={`type-badge ${tx.type.toLowerCase()}`}>{tx.type}</span>
                  <span className={`status-badge ${tx.status}`}>{tx.status}</span>
                </div>
                <div className="transaction-amount">{formatAmount(tx.amount)}</div>
              </div>

              <div className="transaction-details">
                <div className="transaction-addresses">
                  <p>
                    <strong>De :</strong> {formatAddress(tx.from)}
                  </p>
                  <p>
                    <strong>Vers :</strong> {formatAddress(tx.to)}
                  </p>
                </div>
                <div className="transaction-meta">
                  <p>
                    <strong>Date :</strong> {formatDate(tx.date)}
                  </p>
                  <p>
                    <strong>Hash :</strong> {formatAddress(tx.hash)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section opérations */}
      <section className="operations-section">
        <div className="section-header">
          <h2>Opérations récentes</h2>
          <span className="operation-count">{operations.length} opérations</span>
        </div>

        <div className="operations-list">
          {operations.slice(0, 5).map(op => (
            <div key={op.id} className="operation-card">
              <div className="operation-header">
                <div className="operation-type">
                  <span className={`type-badge ${op.type.toLowerCase()}`}>{op.type}</span>
                  <span className={`status-badge ${op.status}`}>{op.status}</span>
                </div>
                {op.amount && <div className="operation-amount">{formatAmount(op.amount)}</div>}
              </div>

              <div className="operation-details">
                <p>
                  <strong>Créée :</strong> {formatDate(op.createdAt)}
                </p>
                <p>
                  <strong>ID :</strong> {op.id}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default FinancialDashboard;
```

**Points clés :**

- ✅ Dashboard complet avec toutes les fonctionnalités
- ✅ Actualisation automatique des données
- ✅ Formatage intelligent des données
- ✅ Interface utilisateur moderne

---

## Composants de transactions

### Composant d'envoi de fonds

```tsx
// src/components/SendMoney.tsx
import React, { useState } from 'react';
import { useIbex } from '@absconse/ibex-sdk';

interface SendMoneyProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

function SendMoney({ onSuccess, onCancel }: SendMoneyProps) {
  const { send, wallet, error: sdkError, clearError } = useIbex(config);

  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation de l'adresse
  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Validation du montant
  const isValidAmount = (amount: string) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  // Gestion de l'envoi
  const handleSend = async () => {
    // Validation des champs
    if (!to.trim()) {
      setError("Veuillez saisir l'adresse de destination");
      return;
    }

    if (!amount.trim()) {
      setError('Veuillez saisir le montant');
      return;
    }

    if (!isValidAddress(to)) {
      setError('Adresse de destination invalide');
      return;
    }

    if (!isValidAmount(amount)) {
      setError('Montant invalide');
      return;
    }

    const numAmount = parseFloat(amount);

    // Confirmation avant envoi
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir envoyer ${numAmount} EURe à ${to.slice(0, 6)}...${to.slice(-4)} ?`
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);
    clearError();

    try {
      await send(numAmount, to);

      // Succès
      alert('Transfert envoyé avec succès !');

      // Réinitialiser le formulaire
      setTo('');
      setAmount('');
      setDescription('');

      // Callback de succès
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du transfert');
    } finally {
      setLoading(false);
    }
  };

  // Calcul des frais estimés
  const estimatedFees = parseFloat(amount) * 0.001; // 0.1% de frais estimés

  return (
    <div className="send-money-modal">
      <div className="modal-header">
        <h2>Envoyer des fonds</h2>
        <button onClick={onCancel} className="close-button">
          ×
        </button>
      </div>

      <div className="modal-content">
        {/* Informations du portefeuille */}
        {wallet && (
          <div className="wallet-info">
            <h3>Votre portefeuille</h3>
            <p className="wallet-address">
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </p>
          </div>
        )}

        {/* Formulaire */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="form-group">
            <label htmlFor="to">Adresse de destination</label>
            <input
              id="to"
              type="text"
              placeholder="0x..."
              value={to}
              onChange={e => setTo(e.target.value)}
              disabled={loading}
              className={!to || isValidAddress(to) ? '' : 'invalid'}
            />
            {to && !isValidAddress(to) && <p className="field-error">Adresse invalide</p>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Montant (EURe)</label>
            <div className="amount-input">
              <input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={loading}
                step="0.01"
                min="0"
                className={!amount || isValidAmount(amount) ? '' : 'invalid'}
              />
              <span className="currency">EURe</span>
            </div>
            {amount && isValidAmount(amount) && (
              <p className="amount-info">Frais estimés: {estimatedFees.toFixed(4)} EURe</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optionnel)</label>
            <input
              id="description"
              type="text"
              placeholder="Raison du transfert"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Gestion des erreurs */}
          {(error || sdkError) && <div className="error-message">{error || sdkError}</div>}

          {/* Boutons d'action */}
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !to || !amount || !isValidAddress(to) || !isValidAmount(amount)}
              className="btn-primary"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SendMoney;
```

**Points clés :**

- ✅ Validation complète des champs
- ✅ Gestion des erreurs détaillée
- ✅ Interface utilisateur intuitive
- ✅ Calcul des frais estimés

---

### Composant de réception

```tsx
// src/components/ReceiveMoney.tsx
import React, { useState } from 'react';
import { useIbex } from '@absconse/ibex-sdk';

function ReceiveMoney() {
  const { receive, wallet } = useIbex(config);
  const [receiveAddress, setReceiveAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Obtenir l'adresse de réception
  const handleGetReceiveAddress = async () => {
    setLoading(true);
    try {
      const address = await receive();
      setReceiveAddress(address);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'adresse:", error);
      alert("Erreur lors de la récupération de l'adresse de réception");
    } finally {
      setLoading(false);
    }
  };

  // Copier l'adresse dans le presse-papiers
  const copyToClipboard = async () => {
    if (receiveAddress) {
      try {
        await navigator.clipboard.writeText(receiveAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
        alert("Impossible de copier l'adresse");
      }
    }
  };

  // Générer un QR code (nécessite une librairie externe)
  const generateQRCode = () => {
    // Implémentation du QR code
    console.log('Génération du QR code pour:', receiveAddress);
  };

  return (
    <div className="receive-money">
      <div className="receive-header">
        <h2>Recevoir des fonds</h2>
        <p>Partagez votre adresse pour recevoir des EURe</p>
      </div>

      {wallet && (
        <div className="wallet-info">
          <h3>Votre portefeuille</h3>
          <p className="wallet-address">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </p>
        </div>
      )}

      <div className="receive-content">
        {!receiveAddress ? (
          <div className="get-address-section">
            <div className="address-icon">📥</div>
            <h3>Obtenir l'adresse de réception</h3>
            <p>
              Cliquez sur le bouton ci-dessous pour générer une adresse de réception unique pour
              cette transaction.
            </p>
            <button
              onClick={handleGetReceiveAddress}
              disabled={loading}
              className="btn-primary btn-large"
            >
              {loading ? 'Génération...' : "Obtenir l'adresse"}
            </button>
          </div>
        ) : (
          <div className="address-display-section">
            <div className="address-header">
              <h3>Adresse de réception</h3>
              <div className="address-actions">
                <button
                  onClick={copyToClipboard}
                  className={`btn-secondary ${copied ? 'copied' : ''}`}
                >
                  {copied ? '✓ Copié' : 'Copier'}
                </button>
                <button onClick={generateQRCode} className="btn-secondary">
                  QR Code
                </button>
              </div>
            </div>

            <div className="address-display">
              <div className="address-text">{receiveAddress}</div>
            </div>

            <div className="address-info">
              <h4>Instructions :</h4>
              <ul>
                <li>✅ Cette adresse est spécifique à cette transaction</li>
                <li>✅ Seuls les EURe peuvent être envoyés à cette adresse</li>
                <li>✅ La transaction sera visible dans votre historique</li>
                <li>⚠️ Vérifiez toujours l'adresse avant d'envoyer</li>
              </ul>
            </div>

            <div className="address-actions-bottom">
              <button onClick={() => setReceiveAddress(null)} className="btn-outline">
                Générer une nouvelle adresse
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="receive-help">
        <h3>Comment recevoir des fonds ?</h3>
        <div className="help-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Générer une adresse</h4>
              <p>Cliquez sur "Obtenir l'adresse" pour créer une adresse unique</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Partager l'adresse</h4>
              <p>Copiez l'adresse ou partagez le QR code avec l'expéditeur</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Recevoir les fonds</h4>
              <p>Les fonds apparaîtront dans votre solde une fois confirmés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiveMoney;
```

**Points clés :**

- ✅ Génération d'adresses de réception uniques
- ✅ Copie dans le presse-papiers
- ✅ Instructions claires pour l'utilisateur
- ✅ Interface intuitive

---

## Composants d'interface

### Composant de notification

```tsx
// src/components/Notification.tsx
import React, { useEffect, useState } from 'react';
import { useIbex } from '@absconse/ibex-sdk';

interface NotificationProps {
  autoHide?: boolean;
  duration?: number;
}

function Notification({ autoHide = true, duration = 5000 }: NotificationProps) {
  const { error, clearError } = useIbex(config);
  const [show, setShow] = useState(false);
  const [notificationType, setNotificationType] = useState<'error' | 'success' | 'info'>('error');

  useEffect(() => {
    if (error) {
      setShow(true);
      setNotificationType('error');

      if (autoHide) {
        const timer = setTimeout(() => {
          setShow(false);
          clearError();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [error, clearError, autoHide, duration]);

  const handleClose = () => {
    setShow(false);
    clearError();
  };

  const getNotificationIcon = () => {
    switch (notificationType) {
      case 'error':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  if (!show || !error) return null;

  return (
    <div className={`notification notification-${notificationType}`}>
      <div className="notification-content">
        <div className="notification-icon">{getNotificationIcon()}</div>
        <div className="notification-text">
          <h4>Notification</h4>
          <p>{error}</p>
        </div>
        <button onClick={handleClose} className="notification-close">
          ×
        </button>
      </div>
    </div>
  );
}

export default Notification;
```

### Composant de chargement

```tsx
// src/components/LoadingSpinner.tsx
import React from 'react';
import { useIbex } from '@absconse/ibex-sdk';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

function LoadingSpinner({ message, size = 'medium' }: LoadingSpinnerProps) {
  const { isLoading } = useIbex(config);

  if (!isLoading) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'spinner-small';
      case 'large':
        return 'spinner-large';
      default:
        return 'spinner-medium';
    }
  };

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className={`spinner ${getSizeClass()}`}></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
}

export default LoadingSpinner;
```

---

## Applications complètes

### Application de portefeuille simple

```tsx
// src/App.tsx
import React from 'react';
import { IbexProvider } from '@absconse/ibex-sdk';
import LoginApp from './components/LoginApp';
import FinancialDashboard from './components/FinancialDashboard';
import Notification from './components/Notification';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

const config = {
  baseURL: process.env.REACT_APP_IBEX_API_URL || 'https://api.ibexwallet.org',
  domain: process.env.REACT_APP_IBEX_DOMAIN || 'votre-domaine.com',
  debug: process.env.NODE_ENV === 'development',
};

function App() {
  return (
    <IbexProvider config={config}>
      <div className="app">
        <Notification />
        <LoadingSpinner />
        <main className="app-main">
          <LoginApp />
          <FinancialDashboard />
        </main>
      </div>
    </IbexProvider>
  );
}

export default App;
```

**Points clés :**

- ✅ Application complète et fonctionnelle
- ✅ Gestion des états globaux
- ✅ Composants réutilisables
- ✅ Configuration flexible
