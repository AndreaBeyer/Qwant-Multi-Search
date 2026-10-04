# Build — Documentation détaillée

Ce document décrit le fonctionnement interne des scripts de build de **Qwant Multi-Search**.

## Vue d'ensemble

Le projet est maintenu avec un `manifest.json` unique à la racine, au format **Firefox** (background en `scripts`). Les scripts de build génèrent deux variantes :

- **Chrome** : background en `service_worker` + `minimum_chrome_version`
- **Firefox** : background en `scripts` + `browser_specific_settings`

Chaque build produit un dossier dans `dist/` et une archive ZIP prête à être soumise aux stores (`manifest.json` à la racine du ZIP).

```
dist/
├── chrome/                                  # Extension Chrome/Chromium
├── firefox/                                 # Extension Firefox
├── Qwant-Multi-Search-v{version}-chrome.zip
└── Qwant-Multi-Search-v{version}-firefox.zip
```

## build.py (recommandé)

```bash
python3 build.py             # Chrome + Firefox
python3 build.py chrome     # Chrome uniquement
python3 build.py firefox    # Firefox uniquement
```

Aucune dépendance externe : uniquement la bibliothèque standard Python (`json`, `shutil`, `zipfile`, `pathlib`).

### Déroulé pas à pas

1. **Validation des sources** (`validate_source`) — le script vérifie que tous les fichiers requis sont présents (`manifest.json`, `background.js`, `helpers.js`, `script.js`, `styles.css`, `popup.html`, `options.*`, `_locales`). S'il en manque un seul, il échoue immédiatement avec un message clair, avant toute écriture.
2. **Lecture de la version** (`get_version`) — la version est lue directement dans `manifest.json` (`"version": "x.y.z"`). C'est la seule source de vérité : les ZIP sont toujours nommés avec la version réelle de l'extension.
3. **Nettoyage** — si `dist/` existe, il est supprimé intégralement puis recréé. Les builds sont toujours reproductibles depuis zéro.
4. **Copie sélective** (`copy_directory`) — les fichiers sources sont copiés récursivement dans `dist/chrome` et `dist/firefox`, en excluant tout ce qui ne doit pas être distribué :

   | Exclu | Raison |
   |---|---|
   | `.git`, `.gitignore`, `.gitattributes` | métadonnées Git |
   | `build.py`, `build.sh`, `build.js` | scripts de build |
   | `package.json`, `package-lock.json`, `node_modules` | outillage Node |
   | `dist` | sortie du build |
   | `BUILD.md`, `README.md`, `PRIVACY.md` | documentation |

5. **Génération du manifest Chrome** (`generate_chrome_manifest`) :
   - supprime `browser_specific_settings` (inconnu de Chrome, rejeté par le store) ;
   - convertit `background.scripts` en `background.service_worker` (format MV3 Chrome) ;
   - ajoute `"minimum_chrome_version": "122"`.
6. **Génération du manifest Firefox** (`generate_firefox_manifest`) :
   - s'assure que `browser_specific_settings` existe (avec l'ID Gecko `qwant-search-enhancer@andreabeyer.fr` et `data_collection_permissions`) ;
   - si le manifest source était en `service_worker`, le reconvertit en `scripts` ;
   - supprime `minimum_chrome_version` s'il est présent.
7. **Écriture des manifests** (`save_json`) — chaque manifest est réécrit en JSON indenté (2 espaces, `ensure_ascii=False` pour préserver accents et emojis).
8. **Création des ZIP** (`create_zip`) — parcours récursif du dossier cible, compression `ZIP_DEFLATED`. Les entrées sont relatives au dossier (`arcname`), donc `manifest.json` se retrouve à la **racine de l'archive**, exactement ce qu'attendent le Chrome Web Store et AMO.
9. **Rapport final** — chemins des dossiers et des ZIP, code de retour 0 (succès) ou 1 (échec).

### Sortie console type

```
🚀 Starting build...
Version: 1.1.2
📄 Copying source files and generating manifests...
✓ Chrome manifest: .../dist/chrome/manifest.json
✓ Firefox manifest: .../dist/firefox/manifest.json
📦 Creating ZIP archives...
✓ Created ...
✅ Build completed successfully!
```

## build.sh

Équivalent en Bash :

```bash
chmod +x build.sh
./build.sh
```

- Dépend de l'outil externe `zip` (paquet `zip` sur Debian/Ubuntu) ;
- Même logique : copie sélective → génération des manifests → ZIP versionné dans `dist/` ;
- Construit toujours les deux navigateurs, sans sélection de cible.

## build.js (Node.js)

```bash
npm run build
```

- Utilise le module `fs` de Node et `child_process.execSync` pour appeler `zip` ;
- ⚠️ La version y est codée en dur (`const VERSION = ...`) — pense à la mettre à jour manuellement, ou privilégie `build.py` qui lit `manifest.json` ;
- ⚠️ Le ZIP est créé avec un dossier racine inclus (`zip -r ... <dossier>`), ce qui peut poser problème lors de la soumission sur certains stores. `build.py` est le script de référence pour générer les archives de publication.

## Dépannage

| Problème | Solution |
|---|---|
| `Missing required files: ...` | Un fichier source requis est absent ou renommé — rétablir le fichier ou mettre à jour `REQUIRED_FILES` dans `build.py` |
| ZIP refusé par le store | Utiliser `build.py` (manifest à la racine du ZIP), pas `build.js` |
| Mauvaise version dans le nom du ZIP | `build.py` lit `manifest.json` — vérifier la clé `version` du manifest |
| `zip: command not found` (`build.sh` / `build.js`) | Installer le paquet `zip` ou utiliser `build.py` (aucune dépendance) |
