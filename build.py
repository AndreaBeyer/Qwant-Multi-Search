#!/usr/bin/env python3
"""
Build script for Qwant Multi-Search
Generates Chrome and Firefox versions from the source files.

Usage:
    python3 build.py             # build both Chrome and Firefox
    python3 build.py chrome     # build Chrome only
    python3 build.py firefox    # build Firefox only
"""

import json
import os
import shutil
import sys
import zipfile
from pathlib import Path

# Configuration
PROJECT_DIR = Path(__file__).parent.absolute()
MANIFEST_PATH = PROJECT_DIR / 'manifest.json'

# Files/dirs to exclude from build
EXCLUDE_FILES = {
    '.git', '.gitignore', '.gitattributes',
    'build.js', 'build.sh', 'build.py',
    'package.json', 'package-lock.json', 'node_modules',
    'dist', 'BUILD.md', 'README.md', 'PRIVACY.md',
}

# Files that must exist for a valid build
REQUIRED_FILES = [
    'manifest.json',
    'background.js',
    'helpers.js',
    'script.js',
    'styles.css',
    'popup.html',
    'options.html',
    'options.js',
    'options.css',
    '_locales',
]


def load_json(filepath):
    """Load JSON file safely"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(filepath, data):
    """Save JSON file with formatting"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')


def get_version():
    """Read the version directly from manifest.json (single source of truth)"""
    return load_json(MANIFEST_PATH)['version']


def validate_source():
    """Fail early if required files are missing"""
    missing = [name for name in REQUIRED_FILES if not (PROJECT_DIR / name).exists()]
    if missing:
        raise FileNotFoundError(f"Missing required files: {', '.join(missing)}")


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
    manifest = load_json(MANIFEST_PATH)

    # Remove Firefox-specific settings
    manifest.pop('browser_specific_settings', None)

    # Convert background to service_worker format
    if 'background' in manifest and 'scripts' in manifest['background']:
        manifest['background'] = {
            'service_worker': manifest['background']['scripts'][0]
        }

    # Add Chrome-specific settings
    manifest['minimum_chrome_version'] = "122"

    return manifest


def generate_firefox_manifest():
    """Generate Firefox-specific manifest"""
    manifest = load_json(MANIFEST_PATH)

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
    if 'background' in manifest and 'service_worker' in manifest['background']:
        manifest['background'] = {
            'scripts': [manifest['background']['service_worker']]
        }

    # Remove Chrome-specific settings
    manifest.pop('minimum_chrome_version', None)

    return manifest


def create_zip(source_dir, output_path):
    """Create ZIP archive with manifest.json at the root (store-ready)"""
    print(f"Creating {output_path}...")

    if output_path.exists():
        output_path.unlink()

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_FILES]
            for file in files:
                if file not in EXCLUDE_FILES:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(source_dir)
                    zipf.write(file_path, arcname)

    print(f"✓ Created {output_path}")


def build_target(browser, dist_dir, manifest):
    """Copy sources into dist/<browser> and write its specific manifest"""
    target_dir = dist_dir / browser
    copy_directory(PROJECT_DIR, target_dir)
    save_json(target_dir / 'manifest.json', manifest)
    print(f"✓ {browser.capitalize()} manifest: {target_dir / 'manifest.json'}")
    return target_dir


def main():
    """Main build function"""
    try:
        # Optional target selection: chrome / firefox / both
        target = sys.argv[1].lower() if len(sys.argv) > 1 else 'all'
        if target not in ('all', 'chrome', 'firefox'):
            print(f"❌ Unknown target: {target}. Use 'chrome', 'firefox' or no argument.")
            return 1

        print("🚀 Starting build...")

        validate_source()
        version = get_version()
        print(f"Version: {version}")

        dist_dir = PROJECT_DIR / 'dist'
        if dist_dir.exists():
            shutil.rmtree(dist_dir)
        dist_dir.mkdir(parents=True, exist_ok=True)

        targets = []
        if target in ('all', 'chrome'):
            targets.append(('chrome', generate_chrome_manifest()))
        if target in ('all', 'firefox'):
            targets.append(('firefox', generate_firefox_manifest()))

        print("📄 Copying source files and generating manifests...")
        built_dirs = [build_target(browser, dist_dir, manifest)
                      for browser, manifest in targets]

        print("📦 Creating ZIP archives...")
        for (browser, _), target_dir in zip(targets, built_dirs):
            create_zip(target_dir, dist_dir / f'Qwant-Multi-Search-v{version}-{browser}.zip')

        print("✅ Build completed successfully!")
        for (browser, _), target_dir in zip(targets, built_dirs):
            print(f"📁 {browser.capitalize()} directory: {target_dir}")
            print(f"📦 {browser.capitalize()} ZIP: {dist_dir / f'Qwant-Multi-Search-v{version}-{browser}.zip'}")

        return 0

    except Exception as e:
        print(f"❌ Build failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
