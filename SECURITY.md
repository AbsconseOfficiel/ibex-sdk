# Politique de sécurité

## Signalement des vulnérabilités

Nous prenons la sécurité très au sérieux. Si vous découvrez une vulnérabilité de sécurité, merci de la signaler de manière responsable.

### Comment signaler une vulnérabilité

**⚠️ IMPORTANT : Ne créez PAS d'issue publique pour les vulnérabilités de sécurité.**

#### Méthode recommandée (privée)

1. **LinkedIn** : [Dylan Enjolvin](https://www.linkedin.com/in/dylanenjolvin/)

#### Informations à inclure

- Description détaillée de la vulnérabilité
- Étapes pour reproduire le problème
- Impact potentiel sur les utilisateurs
- Version(s) affectée(s)
- Suggestions de correction (si vous en avez)

### Processus de traitement

1. **Accusé de réception** : Nous confirmerons la réception dans les 48h
2. **Évaluation** : Analyse de la vulnérabilité dans les 7 jours
3. **Correction** : Développement d'un correctif si nécessaire
4. **Publication** : Coordinated disclosure avec les utilisateurs
5. **Reconnaissance** : Crédit public (si souhaité)

### Types de vulnérabilités

#### 🔴 Critique (Réponse immédiate)

- Authentification WebAuthn compromise
- Fuite de données utilisateur
- Injection de code malveillant
- Accès non autorisé aux wallets

#### 🟡 Important (Réponse sous 7 jours)

- Défaillances de validation
- Problèmes de configuration
- Expositions d'informations sensibles
- Déni de service

#### 🟢 Mineur (Réponse sous 30 jours)

- Améliorations de sécurité
- Bonnes pratiques
- Documentation de sécurité

## Bonnes pratiques de sécurité

### Pour les contributeurs

- **Ne jamais** commiter de clés API, mots de passe ou tokens
- **Toujours** valider les entrées utilisateur
- **Utiliser** des types stricts TypeScript
- **Tester** les cas limites et les erreurs
- **Documenter** les changements de sécurité

### Pour les utilisateurs

- **Toujours** utiliser HTTPS en production
- **Maintenir** le SDK à jour
- **Configurer** correctement les domaines autorisés
- **Surveiller** les logs d'erreur
- **Signaler** tout comportement suspect

## Vulnérabilités connues

### Aucune vulnérabilité connue actuellement

Si vous découvrez une vulnérabilité, elle sera listée ici après correction.

## Checklist de sécurité

### Avant chaque release

- [ ] Audit des dépendances (`npm audit`)
- [ ] Vérification des types TypeScript
- [ ] Documentation des changements de sécurité

### Pour les utilisateurs

- [ ] SDK à jour
- [ ] HTTPS configuré
- [ ] Domaines autorisés corrects
- [ ] Monitoring des erreurs

## Programme de reconnaissance

Nous reconnaissons les chercheurs en sécurité qui nous aident à améliorer la sécurité :

### Hall of Fame

_Liste des contributeurs de sécurité (sera mise à jour)_

### Reconnaissance

- Crédit public dans les releases
- Mention dans le CHANGELOG
- Badge de contributeur de sécurité

## Contact

- **LinkedIn** : [Dylan Enjolvin](https://www.linkedin.com/in/dylanenjolvin/)
- **GitHub** : [@AbsconseOfficiel](https://github.com/AbsconseOfficiel)

## 📄 Licence et responsabilité

Cette politique de sécurité est sous licence Apache 2.0. En signalant une vulnérabilité, vous acceptez que nous puissions utiliser ces informations pour améliorer la sécurité du projet.

**Merci de nous aider à maintenir la sécurité de l'IBEX SDK !**

---

_Dernière mise à jour : 30 septembre 2025_
