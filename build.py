#!/usr/bin/env python3
"""
Build script for Qwant Search Enhancer
Generates Chrome and Firefox versions from the source files.
"""

import os
import json
import shutil
import zipfile
import sys
from pathlib import Path

# Configuration
PROJECT_DIR = Path(__file__).parent.absolute()
VERSION = "1.1.2"

# Files to exclude from build
EXCLUDE_FILES = {
    '.git', '.gitignore', '.gitattributes',
    'build.js', 'build.sh', 'build.py',
    'package.json', 'node_modules',
    'dist', 'BUILD.md'
}

def load_json(filepath):
    """Load JSON file safely"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    """Save JSON file with formatting"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def copy_directory(src, dest):
    """Copy directory recursively, excluding specified files"""
    dest.mkdir(parents=True, exist_ok=True)
    
    for item in src.iterdir():
        if item.name in EXCLUDE_FILES:
            continue
        if item.is_dir():
            copy_directory(item, dest / item.name)
        else:
            shutil.copy2(item, dest / item.name)

def generate_chrome_manifest():
    """Generate Chrome-specific manifest"""
    source_manifest = load_json(PROJECT_DIR / 'manifest.json')
    manifest = source_manifest.copy()
    
    # Remove Firefox-specific settings
    manifest.pop('browser_specific_settings', None)
    
    # Convert background to service_worker format
    if 'background' in manifest:
        if 'scripts' in manifest['background']:
            manifest['background'] = {
                'service_worker': manifest['background']['scripts'][0]
            }
    
    # Add Chrome-specific settings
    manifest['minimum_chrome_version'] = "122"
    
    return manifest

def generate_firefox_manifest():
    """Generate Firefox-specific manifest"""
    source_manifest = load_json(PROJECT_DIR / 'manifest.json')
    manifest = source_manifest.copy()
    
    # Ensure browser_specific_settings exist
    if 'browser_specific_settings' not in manifest:
        manifest['browser_specific_settings'] = {
            'gecko': {
                'id': 'qwant-search-enhancer@andreabeyer.fr',
                'data_collection_permissions': {
                    'required': ['searchTerms'],
                    'optional': []
                }
            }
        }
    
    # Convert background to scripts format (if it's service_worker)
    if 'background' in manifest:
        if 'service_worker' in manifest['background']:
            manifest['background'] = {
                'scripts': [manifest['background']['service_worker']]
            }
    
    # Remove Chrome-specific settings
    manifest.pop('minimum_chrome_version', None)
    
    return manifest

def create_zip(source_dir, output_path):
    """Create ZIP archive"""
    print(f"Creating {output_path}...")
    
    # Remove existing ZIP if it exists
    if output_path.exists():
        output_path.unlink()
    
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Remove excluded directories from the walk
            dirs[:] = [d for d in dirs if d not in EXCLUDE_FILES]
            
            for file in files:
                if file not in EXCLUDE_FILES:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(source_dir.parent)
                    zipf.write(file_path, arcname)
    
    print(f"✓ Created {output_path}")

def main():
    """Main build function"""
    try:
        print("🚀 Starting build...")
        
        # Create dist directories
        dist_dir = PROJECT_DIR / 'dist'
        chrome_dir = dist_dir / 'chrome'
        firefox_dir = dist_dir / 'firefox'
        
        # Clean up old dist directory
        if dist_dir.exists():
            shutil.rmtree(dist_dir)
        
        dist_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy source files
        print("📄 Copying source files...")
        copy_directory(PROJECT_DIR, chrome_dir)
        copy_directory(PROJECT_DIR, firefox_dir)
        
        # Generate manifests
        print("⚙️  Generating manifests...")
        
        # Chrome manifest
        chrome_manifest = generate_chrome_manifest()
        save_json(chrome_dir / 'manifest.json', chrome_manifest)
        print(f"✓ Chrome manifest: {chrome_dir / 'manifest.json'}")
        
        # Firefox manifest
        firefox_manifest = generate_firefox_manifest()
        save_json(firefox_dir / 'manifest.json', firefox_manifest)
        print(f"✓ Firefox manifest: {firefox_dir / 'manifest.json'}")
        
        # Create ZIP files
        print("📦 Creating ZIP archives...")
        chrome_zip = PROJECT_DIR / f'Qwant-Multi-Search-v{VERSION}-chrome.zip'
        firefox_zip = PROJECT_DIR / f'Qwant-Multi-Search-v{VERSION}-firefox.zip'
        
        create_zip(chrome_dir, chrome_zip)
        create_zip(firefox_dir, firefox_zip)
        
        print("✅ Build completed successfully!")
        print(f"📁 Chrome directory: {chrome_dir}")
        print(f"📁 Firefox directory: {firefox_dir}")
        print(f"📦 Chrome ZIP: {chrome_zip}")
        print(f"📦 Firefox ZIP: {firefox_zip}")
        
        return 0
        
    except Exception as e:
        print(f"❌ Build failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())