# The Corner Notifier - Extension Chrome

Cette extension vous notifie lorsque vous visitez un site partenaire The Corner de Boursobank.

## Fonctionnalités

- Détection automatique des sites partenaires
- Notifications avec les détails de l'offre
- Liste complète des partenaires accessible via le popup
- Pas de notification répétée pour le même site pendant 24h

## Installation

1. Clonez ce dépôt ou téléchargez les fichiers
2. Créez un dossier `icons` et ajoutez les icônes suivantes :
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)
   Vous pouvez utiliser une icône simple avec le symbole € ou % sur fond bleu
3. Dans Chrome, allez dans `chrome://extensions/`
4. Activez le "Mode développeur" en haut à droite
5. Cliquez sur "Charger l'extension non empaquetée"
6. Sélectionnez le dossier contenant les fichiers de l'extension

## Utilisation

- L'extension fonctionne automatiquement en arrière-plan
- Une notification apparaît lorsque vous visitez un site partenaire
- Cliquez sur l'icône de l'extension pour voir la liste complète des partenaires

## Structure des fichiers

- `manifest.json` : Configuration de l'extension
- `partners.js` : Liste des partenaires et leurs offres
- `content.js` : Script de détection des sites partenaires
- `background.js` : Gestion des notifications
- `popup.html` : Interface utilisateur de l'extension
- `popup.js` : Script pour l'interface utilisateur
- `icons/` : Dossier contenant les icônes de l'extension

## Mise à jour des partenaires

Pour mettre à jour la liste des partenaires, modifiez le fichier `partners.js`. La structure pour chaque partenaire est :

```javascript
"domaine.com": {
  "name": "Nom du Partenaire",
  "offer": "Offre (ex: -5%*)",
  "type": "Type d'offre"
}
```

# The Corner Scraper

Ce script permet d'extraire la liste des partenaires The Corner de Boursobank depuis le site Parraineo.

## Installation

1. Assurez-vous d'avoir Node.js installé sur votre machine
2. Clonez ce dépôt
3. Installez les dépendances :
```bash
npm install
```

## Utilisation

Pour lancer le script :
```bash
npm start
```

Le script va :
1. Se connecter à la page web de Parraineo
2. Extraire toutes les informations des partenaires The Corner
3. Sauvegarder les données dans un fichier `the-corner-partners.json`

## Structure des données

Les données sont organisées par catégorie dans le fichier JSON. Chaque partenaire contient :
- enseigne : Nom du partenaire
- offre : Description de l'offre
- typeOffre : Type de l'offre (Cashback, Bon d'achat, etc.)

# The Corner Partners API

Ce dépôt fournit une API JSON gratuite pour accéder aux offres partenaires de The Corner.

## Utilisation

Les données sont accessibles via l'URL suivante :
```
https://[votre-nom-utilisateur].github.io/[nom-repo]/the-corner-partners.json
```

## Mise à jour

Les données sont mises à jour automatiquement chaque semaine (le dimanche à minuit).

## Format des données

Les données sont structurées par catégories, avec pour chaque enseigne :
- Le nom de l'enseigne
- L'offre en cours
- Le type d'offre (Bon d'achat, Remise immédiate, Cashback)

## Statut

Vous pouvez vérifier la dernière mise à jour réussie en consultant le fichier `last_update.txt`.

## Contribution

Si vous rencontrez des problèmes ou souhaitez contribuer, n'hésitez pas à ouvrir une issue ou une pull request. 