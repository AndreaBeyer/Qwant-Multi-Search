#!/bin/bash

# Script de build pour générer les versions Chrome et Firefox de Qwant Search Enhancer
# Ce script copiera les fichiers et modifiera les manifest.json selon le navigateur

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$PROJECT_DIR"
VERSION="1.1.2"

echo "🚀 Début du build depuis: $PROJECT_DIR"

# Créer le dossier dist
DIST_DIR="$PROJECT_DIR/dist"
CHROME_DIR="$DIST_DIR/chrome"
FIREFOX_DIR="$DIST_DIR/firefox"

# Nettoyer les anciens dossiers
rm -rf "$DIST_DIR"
mkdir -p "$CHROME_DIR"
mkdir -p "$FIREFOX_DIR"

# Fonction pour copier les fichiers en excluant certains
copy_files() {
    local src="$1"
    local dest="$2"
    
    # Copier tous les fichiers et dossiers
    cp -r "$src"/* "$dest/" 2>/dev/null || true
    cp -r "$src".* "$dest/" 2>/dev/null || true
    
    # Supprimer les fichiers/dossiers exclus
    cd "$dest"
    rm -rf .git .gitignore .gitattributes build.js build.sh build.py dist node_modules package.json BUILD.md
    cd - >/dev/null
}

echo "📄 Copie des fichiers pour Chrome..."
copy_files "$SOURCE_DIR" "$CHROME_DIR"

echo "📄 Copie des fichiers pour Firefox..."
copy_files "$SOURCE_DIR" "$FIREFOX_DIR"

# Générer le manifest Chrome
echo "⚙️  Génération du manifest Chrome..."
cat > "$CHROME_DIR/manifest.json" << 'EOF'
{
  "name": "__MSG_extensionName__",
  "default_locale": "en",
  "version": "1.1.2",
  "author": "Andréa Beyer",
  "description": "__MSG_extensionDescription__",
  "manifest_version": 3,
  "permissions": [
    "storage"
  ],
  "web_accessible_resources": [
    {
      "resources": [
        "svgs/*.svg"
      ],
      "matches": [
        "https://www.qwant.com/*"
      ]
    }
  ],
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  "action": {
    "default_title": "__MSG_actionTitle__",
    "default_popup": "popup.html",
    "default_icon": {
      "16": "images/action16.png",
      "32": "images/action32.png",
      "48": "images/action48.png"
    }
  },
  "content_scripts": [
    {
      "matches": [
        "https://www.qwant.com/",
        "https://www.qwant.com/*"
      ],
      "run_at": "document_start",
      "js": [
        "helpers.js",
        "script.js"
      ],
      "css": [
        "styles.css"
      ]
    }
  ],
  "icons": {
    "16": "images/icon16.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png"
  },
  "host_permissions": [
    "https://oneshot-free.www.deepl.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "minimum_chrome_version": "122"
}
EOF

# Générer le manifest Firefox
echo "⚙️  Génération du manifest Firefox..."
cat > "$FIREFOX_DIR/manifest.json" << 'EOF'
{
  "name": "__MSG_extensionName__",
  "default_locale": "en",
  "version": "1.1.2",
  "author": "Andréa Beyer",
  "description": "__MSG_extensionDescription__",
  "manifest_version": 3,
  "permissions": [
    "storage"
  ],
  "web_accessible_resources": [
    {
      "resources": [
        "svgs/*.svg"
      ],
      "matches": [
        "https://www.qwant.com/*"
      ]
    }
  ],
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  "action": {
    "default_title": "__MSG_actionTitle__",
    "default_popup": "popup.html",
    "default_icon": {
      "16": "images/action16.png",
      "32": "images/action32.png",
      "48": "images/action48.png"
    }
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "qwant-search-enhancer@andreabeyer.fr",
      "data_collection_permissions": {
        "required": [
          "searchTerms"
        ],
        "optional": []
      }
    }
  },
  "content_scripts": [
    {
      "matches": [
        "https://www.qwant.com/",
        "https://www.qwant.com/*"
      ],
      "run_at": "document_start",
      "js": [
        "helpers.js",
        "script.js"
      ],
      "css": [
        "styles.css"
      ]
    }
  ],
  "icons": {
    "16": "images/icon16.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png"
  },
  "host_permissions": [
    "https://oneshot-free.www.deepl.com/*"
  ],
  "background": {
    "scripts": [
      "background.js"
    ]
  }
}
EOF

# Créer les ZIP
echo "📦 Création des archives ZIP..."

CHROME_ZIP="$DIST_DIR/Qwant-Multi-Search-v${VERSION}-chrome.zip"
FIREFOX_ZIP="$DIST_DIR/Qwant-Multi-Search-v${VERSION}-firefox.zip"

# Supprimer les anciens ZIP s'ils existent
rm -f "$CHROME_ZIP" "$FIREFOX_ZIP"

# Vérifier si zip est disponible
if command -v zip &> /dev/null; then
    # Utiliser zip natif (plus rapide) - changer de dossier pour avoir les fichiers à la racine
    cd "$CHROME_DIR"
    zip -r "$CHROME_ZIP" * > /dev/null 2>&1
    cd "$FIREFOX_DIR"
    zip -r "$FIREFOX_ZIP" * > /dev/null 2>&1
    cd "$PROJECT_DIR"
    echo "✓ ZIP Chrome créé: $CHROME_ZIP"
    echo "✓ ZIP Firefox créé: $FIREFOX_ZIP"
else
    # Utiliser Python comme fallback (portable)
    echo "   Utilisation de Python pour créer les ZIP..."
    export CHROME_DIR FIREFOX_DIR CHROME_ZIP FIREFOX_ZIP
    python3 << 'PYTHON_EOF'
import os
import zipfile

CHROME_DIR = os.environ.get('CHROME_DIR', '')
CHROME_ZIP = os.environ.get('CHROME_ZIP', '')
FIREFOX_DIR = os.environ.get('FIREFOX_DIR', '')
FIREFOX_ZIP = os.environ.get('FIREFOX_ZIP', '')

def create_zip(source_dir, output_path):
    """Create ZIP archive from directory with files at root"""
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # Create relative path from source_dir to have files at root of ZIP
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

if CHROME_DIR and CHROME_ZIP:
    create_zip(CHROME_DIR, CHROME_ZIP)
    print(f"✓ Created {CHROME_ZIP}")

if FIREFOX_DIR and FIREFOX_ZIP:
    create_zip(FIREFOX_DIR, FIREFOX_ZIP)
    print(f"✓ Created {FIREFOX_ZIP}")
PYTHON_EOF
    cd "$PROJECT_DIR"
fi

echo ""
echo "✅ Build terminé avec succès !"
echo "📁 Dossier Chrome: $CHROME_DIR"
echo "📁 Dossier Firefox: $FIREFOX_DIR"

if command -v zip &> /dev/null; then
    echo "📦 ZIP Chrome: $PROJECT_DIR/Qwant-Multi-Search-v${VERSION}-chrome.zip"
    echo "📦 ZIP Firefox: $PROJECT_DIR/Qwant-Multi-Search-v${VERSION}-firefox.zip"
fi