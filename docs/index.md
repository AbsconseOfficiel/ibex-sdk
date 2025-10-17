<div align="center">

# Documentation IBEX SDK

### Guide complet pour intégrer les services IBEX dans vos applications React

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-Stable-green)](https://github.com/AbsconseOfficiel/ibex-sdk)

[Démarrage rapide](#démarrage-rapide) • [Guides disponibles](#guides-disponibles) • [Support](#support-et-communauté)

</div>

---

## Vue d'ensemble

### Qu'est-ce que l'IBEX SDK ?

L'IBEX SDK est une bibliothèque React/TypeScript qui simplifie l'intégration des services financiers IBEX dans vos applications. Il fournit une interface unifiée pour l'authentification, les transactions et la gestion des portefeuilles.

<table>
<tr>
<td width="50%">

### Fonctionnalités principales

- **Authentification WebAuthn** : Plus sécurisé que les mots de passe
- **Architecture modulaire** : 8 features isolées (auth, wallet, safe, privacy, etc.)
- **API simplifiée** : Actions simples via hook + SDK complet
- **Cache intelligent** : Multi-niveaux avec -90% de requêtes
- **Temps réel** : WebSocket optimisé avec reconnexion automatique

</td>
<td width="50%">

### Avantages

- **Simplicité** : API simple pour cas d'usage basiques
- **Puissance** : SDK complet pour fonctionnalités avancées
- **Performance** : -90% requêtes API, -70% temps de chargement
- **TypeScript** : Types stricts et autocomplétion complète
- **Production-ready** : 100% du Swagger IBEX implémenté

</td>
</tr>
</table>

---

## Démarrage rapide

### Installation

```bash
npm install @absconse/ibex-sdk
```

### Configuration minimale

```typescript
import { IbexProvider, useIbex } from '@absconse/ibex-sdk'

const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'votre-domaine.com',
}

function App() {
  return (
    <IbexProvider config={config}>
      <Dashboard />
    </IbexProvider>
  )
}

function Dashboard() {
  const { user, balance, signIn, send, sdk } = useIbex()

  if (!user) {
    return <button onClick={signIn}>Se connecter</button>
  }

  return (
    <div>
      <h1>Bonjour {user.email || 'Utilisateur'} !</h1>
      <p>Solde: {balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
      {user.iban && <p>IBAN: {user.iban.status}</p>}

      {/* Actions simples */}
      <button onClick={() => send(100, '0x...')}>Envoyer 100€</button>

      {/* Actions avancées via SDK */}
      <button
        onClick={async () => {
          const user = await sdk.users.getMe()
          console.log('Mon profil:', user)
        }}
      >
        Voir mon profil
      </button>

      <button
        onClick={async () => {
          const kycUrl = await sdk.privacy.startKyc('fr')
          window.open(kycUrl, '_blank')
        }}
      >
        Compléter le KYC
      </button>
    </div>
  )
}
```

**Résultat attendu :**

- ✅ Application fonctionnelle en quelques lignes
- ✅ Authentification WebAuthn intégrée
- ✅ Interface utilisateur moderne

---

## Guides disponibles

### [Guide de démarrage rapide](./getting-started.md)

**Pour qui :** Débutants, première intégration

**Contenu :**

- Installation et configuration
- Premier composant fonctionnel
- Gestion des erreurs
- Tests de base

**Temps estimé :** 30 minutes

### [Configuration](./configuration.md)

**Pour qui :** Développeurs, configuration avancée

**Contenu :**

- Configuration par environnement
- Variables d'environnement
- Validation et erreurs
- Bonnes pratiques

**Temps estimé :** 15 minutes

### [Guide des hooks](./hooks.md)

**Pour qui :** Développeurs, utilisation avancée

**Contenu :**

- Interface complète du hook useIbex
- Exemples d'utilisation
- Gestion des états
- Bonnes pratiques

**Temps estimé :** 20 minutes

### [Exemples pratiques](./examples.md)

**Pour qui :** Développeurs, cas d'usage concrets

**Contenu :**

- Composants prêts à l'emploi
- Dashboard financier complet
- Gestion des transactions
- Tests et exemples

**Temps estimé :** 45 minutes

### [Authentification](./authentication.md)

**Pour qui :** Développeurs, sécurité

**Contenu :**

- WebAuthn et passkeys
- Configuration de sécurité
- Gestion des sessions
- Bonnes pratiques

**Temps estimé :** 30 minutes

### [Référence API](./api-reference.md)

**Pour qui :** Développeurs, référence technique

**Contenu :**

- Interface complète du SDK
- Types TypeScript
- Méthodes et paramètres
- Exemples d'utilisation

**Temps estimé :** 30 minutes

### [FAQ](./faq.md)

**Pour qui :** Tous, dépannage

**Contenu :**

- Questions fréquentes
- Solutions aux problèmes courants
- Dépannage
- Support

**Temps estimé :** 15 minutes

---

## Parcours d'apprentissage

### Débutant

<table>
<tr>
<td width="50%">

### Étapes recommandées

1. **[Démarrage rapide](./getting-started.md)** - Première intégration
2. **[Configuration](./configuration.md)** - Configuration de base
3. **[Exemples](./examples.md)** - Composants prêts à l'emploi
4. **[FAQ](./faq.md)** - Questions fréquentes

</td>
<td width="50%">

### Temps total

- **Démarrage** : 30 min
- **Configuration** : 15 min
- **Exemples** : 45 min
- **FAQ** : 15 min
- **Total** : 1h45

</td>
</tr>
</table>

### Intermédiaire

<table>
<tr>
<td width="50%">

### Étapes recommandées

1. **[Hooks](./hooks.md)** - Utilisation avancée
2. **[Authentification](./authentication.md)** - Sécurité
3. **[Référence API](./api-reference.md)** - Documentation technique

</td>
<td width="50%">

### Temps total

- **Hooks** : 20 min
- **Authentification** : 30 min
- **Déploiement** : 60 min
- **Référence** : 30 min
- **Total** : 2h20

</td>
</tr>
</table>

### Avancé

<table>
<tr>
<td width="50%">

### Étapes recommandées

1. **[Référence API](./api-reference.md)** - Documentation complète
2. **[Authentification](./authentication.md)** - Sécurité avancée
3. **[Exemples](./examples.md)** - Implémentations complexes

</td>
<td width="50%">

### Temps total

- **Référence** : 30 min
- **Déploiement** : 60 min
- **Authentification** : 30 min
- **Exemples** : 45 min
- **Total** : 2h45

</td>
</tr>
</table>

---

## Outils et ressources

### Outils de développement

<table>
<tr>
<td width="50%">

### 🔧 Outils recommandés

- **VS Code** : Éditeur avec support TypeScript
- **React DevTools** : Débogage des composants
- **Chrome DevTools** : Débogage WebAuthn
- **Postman** : Tests d'API

</td>
<td width="50%">

### Ressources utiles

- **Documentation React** : [reactjs.org](https://reactjs.org/)
- **Documentation TypeScript** : [typescriptlang.org](https://www.typescriptlang.org/)
- **WebAuthn Guide** : [webauthn.guide](https://webauthn.guide/)

</td>
</tr>
</table>

### Support et communauté

<table>
<tr>
<td width="50%">

### Support officiel

- **GitHub Issues** : [Signaler un bug](https://github.com/ibex/sdk/issues)
- **GitHub Discussions** : [Poser une question](https://github.com/ibex/sdk/discussions)
- **Documentation** : [docs/](./docs/)

</td>
<td width="50%">

### Communauté

- **Stack Overflow** : Tag `ibex-sdk`
- **Discord** : Serveur communautaire
- **Twitter** : [@ibex_sdk](https://twitter.com/ibex_sdk)

</td>
</tr>
</table>

---

## Cas d'usage

### Applications financières

<table>
<tr>
<td width="50%">

### Portefeuilles numériques

- Gestion des soldes
- Transactions en temps réel
- Authentification sécurisée
- Interface utilisateur moderne

</td>
<td width="50%">

### Services bancaires

- Virements instantanés
- Retraits vers IBAN
- Gestion des comptes
- Conformité réglementaire

</td>
</tr>
</table>

### E-commerce

<table>
<tr>
<td width="50%">

### Paiements en ligne

- Intégration simple
- Sécurité maximale
- Expérience utilisateur fluide
- Support multi-devices

</td>
<td width="50%">

### Applications mobiles

- PWA supportées
- Authentification biométrique
- Synchronisation cross-platform
- Performance optimisée

</td>
</tr>
</table>

---

## Configuration par environnement

### Développement

```typescript
const config = {
  baseURL: 'https://api-testnet.ibexwallet.org',
  domain: 'localhost',
  debug: true,
}
```

### Staging

```typescript
const config = {
  baseURL: 'https://api-staging.ibexwallet.org',
  domain: 'staging.yourapp.com',
  debug: false,
}
```

### Production

```typescript
const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'yourapp.com',
  debug: false,
}
```

---

## Dépannage

### Problèmes courants

<table>
<tr>
<td width="50%">

### Authentification

**Problème** : WebAuthn ne fonctionne pas
**Solution** : Vérifiez HTTPS et la configuration du domaine

**Problème** : Erreur "NotSupportedError"
**Solution** : Mettez à jour votre navigateur

</td>
<td width="50%">

### Données

**Problème** : Les transactions ne s'affichent pas
**Solution** : Vérifiez l'authentification et le réseau

**Problème** : Solde affiche 0
**Solution** : Rafraîchissez les données avec `refresh()`

</td>
</tr>
</table>

### Obtenir de l'aide

1. **Consultez la [FAQ](./faq.md)** pour les problèmes courants
2. **Regardez les [exemples](./examples.md)** pour des solutions
3. **Ouvrez une [issue GitHub](https://github.com/ibex/sdk/issues)** pour les bugs
4. **Rejoignez les [discussions](https://github.com/ibex/sdk/discussions)** pour les questions
