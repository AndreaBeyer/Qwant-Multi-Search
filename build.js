#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_DIR = __dirname;
const SOURCE_DIR = PROJECT_DIR;
const CHROME_DIR = path.join(PROJECT_DIR, 'dist', 'chrome');
const FIREFOX_DIR = path.join(PROJECT_DIR, 'dist', 'firefox');
const VERSION = '1.1.2'; // Mettre à jour selon la version

// Fichiers à exclure des builds
const EXCLUDE_FILES = ['.git', '.gitignore', '.gitattributes', 'build.js', 'dist', 'node_modules'];

// Fonction pour copier récursivement
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    fs.readdirSync(src).forEach(childItem => {
      // Exclure les fichiers/dossiers spécifiés
      if (EXCLUDE_FILES.includes(childItem)) {
        return;
      }
      copyRecursiveSync(path.join(src, childItem), path.join(dest, childItem));
    });
  } else {
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
    fs.copyFileSync(src, dest);
  }
}

// Fonction pour générer le manifest Chrome
function generateChromeManifest() {
  const manifestPath = path.join(SOURCE_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Supprimer browser_specific_settings (spécifique à Firefox)
  delete manifest.browser_specific_settings;
  
  // Changer background.scripts en service_worker
  if (manifest.background && manifest.background.scripts) {
    manifest.background = {
      service_worker: manifest.background.scripts[0]
    };
  }
  
  // Ajouter minimum_chrome_version
  manifest.minimum_chrome_version = "122";
  
  return manifest;
}

// Fonction pour générer le manifest Firefox
function generateFirefoxManifest() {
  const manifestPath = path.join(SOURCE_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // S'assurer que browser_specific_settings existe
  if (!manifest.browser_specific_settings) {
    manifest.browser_specific_settings = {
      gecko: {
        id: "qwant-search-enhancer@andreabeyer.fr",
        data_collection_permissions: {
          required: ["searchTerms"],
          optional: []
        }
      }
    };
  }
  
  // S'assurer que background utilise scripts (pas service_worker)
  if (manifest.background) {
    // Si c'est déjà au format service_worker
    if (manifest.background.service_worker) {
      manifest.background = {
        scripts: [manifest.background.service_worker]
      };
    }
  }
  
  // Supprimer minimum_chrome_version s'il existe
  delete manifest.minimum_chrome_version;
  
  return manifest;
}

// Fonction pour créer un ZIP
function createZip(sourceDir, outputPath) {
  console.log(`Création de ${outputPath}...`);
  
  // Supprimer l'ancien ZIP s'il existe
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
  
  try {
    // Changer de répertoire et créer le ZIP
    const originalDir = process.cwd();
    process.chdir(path.dirname(sourceDir));
    
    const dirName = path.basename(sourceDir);
    const zipCommand = `zip -r "${outputPath}" "${dirName}"`;
    
    console.log(`Exécution: ${zipCommand}`);
    execSync(zipCommand, { 
      cwd: path.dirname(sourceDir),
      stdio: 'inherit' 
    });
    
    process.chdir(originalDir);
    console.log(`✓ ZIP créé: ${outputPath}`);
  } catch (error) {
    console.error(`Erreur lors de la création du ZIP: ${error.message}`);
    throw error;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Début du build...');
    
    // Créer les dossiers de distribution
    console.log('📁 Création des dossiers de distribution...');
    
    // Nettoyer l'ancien dossier dist
    const distDir = path.join(PROJECT_DIR, 'dist');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(distDir, { recursive: true });
    
    // Créer les dossiers Chrome et Firefox
    fs.mkdirSync(CHROME_DIR, { recursive: true });
    fs.mkdirSync(FIREFOX_DIR, { recursive: true });
    
    // Copier les fichiers source vers les dossiers de build
    console.log('📄 Copie des fichiers...');
    
    // Pour Chrome
    copyRecursiveSync(SOURCE_DIR, CHROME_DIR);
    
    // Pour Firefox  
    copyRecursiveSync(SOURCE_DIR, FIREFOX_DIR);
    
    // Générer et écrire les manifests spécifiques
    console.log('⚙️  Génération des manifests spécifiques...');
    
    // Manifest Chrome
    const chromeManifest = generateChromeManifest();
    const chromeManifestPath = path.join(CHROME_DIR, 'manifest.json');
    fs.writeFileSync(chromeManifestPath, JSON.stringify(chromeManifest, null, 2));
    console.log(`✓ Manifest Chrome généré: ${chromeManifestPath}`);
    
    // Manifest Firefox
    const firefoxManifest = generateFirefoxManifest();
    const firefoxManifestPath = path.join(FIREFOX_DIR, 'manifest.json');
    fs.writeFileSync(firefoxManifestPath, JSON.stringify(firefoxManifest, null, 2));
    console.log(`✓ Manifest Firefox généré: ${firefoxManifestPath}`);
    
    // Créer les ZIP
    console.log('📦 Création des archives ZIP...');
    
    const chromeZipName = `Qwant-Multi-Search-v${VERSION}-chrome.zip`;
    const firefoxZipName = `Qwant-Multi-Search-v${VERSION}-firefox.zip`;
    
    const chromeZipPath = path.join(PROJECT_DIR, chromeZipName);
    const firefoxZipPath = path.join(PROJECT_DIR, firefoxZipName);
    
    createZip(CHROME_DIR, chromeZipPath);
    createZip(FIREFOX_DIR, firefoxZipPath);
    
    console.log('✅ Build terminé avec succès !');
    console.log(`📁 Dossier Chrome: ${CHROME_DIR}`);
    console.log(`📁 Dossier Firefox: ${FIREFOX_DIR}`);
    console.log(`📦 ZIP Chrome: ${chromeZipPath}`);
    console.log(`📦 ZIP Firefox: ${firefoxZipPath}`);
    
    // Mettre à jour le todo
    console.log('\n📋 Résumé:');
    console.log('✓ Script de build créé');
    console.log('✓ Manifestes Chrome et Firefox générés');
    console.log('✓ Dossiers de distribution créés');
    console.log('✓ Archives ZIP générées');
    
  } catch (error) {
    console.error('❌ Erreur lors du build:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
main();