# Qwant Multi-Search

**Qwant Multi-Search** est une extension de navigateur compatible avec **Firefox, Firefox ESR, Chrome et Chromium** qui permet d'effectuer une recherche en un clic sur **Google, ChatGPT et d'autres services**, directement depuis Qwant.

## ✨ Fonctionnalités

- 🔎 Rechercher rapidement une requête Qwant sur **Google**
- 🤖 Envoyer directement une recherche à **ChatGPT**
- 🌐 Utiliser plusieurs services de recherche depuis une même page
- ⚡ Recherche rapide en un seul clic
- 🦊 Compatible avec **Firefox et Firefox ESR**
- 🌐 Compatible avec **Chrome et Chromium**
- 🇫🇷 **Interface française** et traduction **DeepL français ↔ anglais**, dans les deux sens
- 🇬🇧 **Interface anglaise** et traduction **DeepL français ↔ anglais**, dans les deux sens
- 🇩🇪 **Interface allemande** et traduction **DeepL allemand ↔ anglais**, dans les deux sens
- 🔒 Aucune collecte de données personnelles par l'extension

## 🚀 Comment ça fonctionne ?

Lorsque vous effectuez une recherche sur Qwant, **Qwant Multi-Search** ajoute des possibilités pour utiliser la même requête sur d'autres services.

Cela évite de devoir :

1. Sélectionner la recherche
2. La copier
3. Ouvrir un nouvel onglet
4. Ouvrir un autre service
5. Coller la requête

Avec l'extension, la recherche peut être envoyée directement au service souhaité.

## 🔍 Services

L'extension permet notamment d'utiliser :

- **Qwant**
- **Google**
- **ChatGPT**
- **DeepL**
- D'autres services selon la configuration de l'extension

## 🦊 Installation sur Firefox

### Firefox Add-ons

L'extension est disponible sur Mozilla Add-ons :

👉 [Installer depuis Firefox Add-ons](https://addons.mozilla.org/)

### Installation depuis les sources

Pour tester la dernière version du code :

```bash
git clone https://github.com/AndreaBeyer/Qwant-Multi-Search.git
cd Qwant-Multi-Search
```

Puis :

1. Ouvrez Firefox.
2. Rendez-vous sur `about:debugging`.
3. Cliquez sur **Ce Firefox**.
4. Cliquez sur **Charger un module complémentaire temporaire…**.
5. Sélectionnez le fichier `manifest.json` situé à la racine du projet.

### ⚠️ Linux avec Firefox Flatpak

Si le chargement direct du `manifest.json` pose problème, vous pouvez charger le fichier ZIP de l'extension.

1. Créez le ZIP depuis le dossier du projet :

```bash
cd "$HOME/Documents/GitHub/Qwant-Multi-Search"
zip -r Qwant-Multi-Search.zip Qwant-Multi-Search
```

2. Dans Firefox, ouvrez `about:debugging`.
3. Cliquez sur **Ce Firefox**.
4. Cliquez sur **Charger un module complémentaire temporaire…**.
5. Sélectionnez `Qwant-Multi-Search.zip`.

> Si le ZIP fonctionne alors que le `manifest.json` ne fonctionne pas, le problème peut venir de l'environnement sandboxé de Firefox Flatpak plutôt que de l'extension.

## 🌐 Installation sur Chrome et Chromium

### Chrome Web Store

L'extension est également destinée à être distribuée sur le **Chrome Web Store**.

👉 [Chrome Web Store](https://chromewebstore.google.com/detail/qwant-search-enhancer/kepafadhpgppildfnbkndiebkpojjcgm)

### Installation depuis les sources

Pour tester la dernière version du code :

```bash
git clone https://github.com/AndreaBeyer/Qwant-Multi-Search.git
cd Qwant-Multi-Search
```

Puis :

1. Ouvrez **Chrome** ou **Chromium**.
2. Rendez-vous sur `chrome://extensions/`.
3. Activez le **Mode développeur**.
4. Cliquez sur **Charger l'extension non empaquetée**.
5. Sélectionnez le dossier contenant `manifest.json`.

## 🛠️ Build

Le dépôt contient plusieurs scripts de build qui génèrent les versions **Chrome** et **Firefox** de l'extension dans le dossier `dist/`, avec des `manifest.json` adaptés à chaque navigateur :

- **Chrome** : background en `service_worker` + `minimum_chrome_version`
- **Firefox** : background en `scripts` + `browser_specific_settings`

### Script Python (recommandé)

```bash
python3 build.py
```

Le script lit la version directement depuis `manifest.json` (aucune mise à jour manuelle de version nécessaire). Il accepte aussi une cible optionnelle :

```bash
python3 build.py chrome    # build Chrome uniquement
python3 build.py firefox   # build Firefox uniquement
```

### Script Bash

```bash
chmod +x build.sh
./build.sh
```

### Node.js (npm)

```bash
npm run build
```

### Résultat du build

```
dist/
├── chrome/          # Extension Chrome/Chromium
└── firefox/         # Extension Firefox
```

Les archives suivantes sont également créées dans `dist/` :

- `Qwant-Multi-Search-v{version}-chrome.zip`
- `Qwant-Multi-Search-v{version}-firefox.zip`

Pour plus de détails (structure des fichiers, tests, signature des extensions, CI), consultez [BUILD.md](BUILD.md).

## 🔒 Confidentialité

Qwant Multi-Search est conçu pour respecter la vie privée de ses utilisateurs.

L'extension ne collecte pas et ne transmet pas de données personnelles à un serveur contrôlé par le développeur.

Les préférences de l'utilisateur peuvent être enregistrées localement dans le navigateur afin de mémoriser la configuration de l'extension.

Lorsque l'utilisateur utilise un service externe, sa requête est envoyée directement au service sélectionné, conformément au fonctionnement de celui-ci.

Aucune base de données distante n'est nécessaire au fonctionnement de l'extension.

Pour plus d'informations, consultez notre [politique de confidentialité](PRIVACY.md).

## 🛠️ Développement

Le projet est open source et les contributions sont les bienvenues.

Si vous trouvez un bug ou souhaitez proposer une amélioration, vous pouvez ouvrir une **Issue** ou une **Pull Request** sur GitHub.

👉 [Voir le projet sur GitHub](https://github.com/AndreaBeyer/Qwant-Multi-Search)

## 📄 Licence

Ce projet est distribué sous licence **MIT**.

---

⭐ Si Qwant Multi-Search vous est utile, n'hésitez pas à mettre une étoile au projet !

**Made with ❤️ for Firefox, Chrome, Chromium and Qwant**
