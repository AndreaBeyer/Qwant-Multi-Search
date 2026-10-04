# Build Instructions for Qwant Search Enhancer

This document explains how to build the browser extension for Chrome and Firefox.

## Quick Start

### Using the build script (recommended)

1. **Run the build script:**
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

2. **Output:**
   - Chrome extension: `dist/chrome/`
   - Firefox extension: `dist/firefox/`
   - Chrome ZIP: `Qwant-Multi-Search-v1.1.2-chrome.zip` (if zip is available)
   - Firefox ZIP: `Qwant-Multi-Search-v1.1.2-firefox.zip` (if zip is available)

### Manual build without zip

If you don't have `zip` installed, the build script will only create the directories. You can manually create ZIP files:

```bash
cd dist
zip -r ../Qwant-Multi-Search-v1.1.2-chrome.zip chrome/
zip -r ../Qwant-Multi-Search-v1.1.2-firefox.zip firefox/
```

## File Structure

After building, you'll have:

```
Qwant-search-enhancer/
├── dist/
│   ├── chrome/          # Chrome/Chromium extension files
│   │   ├── manifest.json (with service_worker & minimum_chrome_version)
│   │   ├── background.js
│   │   ├── script.js
│   │   ├── helpers.js
│   │   ├── popup.html
│   │   ├── options.html
│   │   ├── options.js
│   │   ├── options.css
│   │   ├── styles.css
│   │   ├── images/
│   │   ├── svgs/
│   │   ├── _locales/
│   │   ├── LICENSE
│   │   └── README.md
│   │
│   └── firefox/         # Firefox extension files
│       ├── manifest.json (with browser_specific_settings)
│       ├── background.js
│       └── ... (same files as chrome)
├── build.sh            # Build script
├── build.js            # Node.js build script (alternative)
└── package.json        # Node.js project configuration
```

## Key Differences Between Chrome and Firefox

### Chrome/Chromium
- Uses Manifest V3
- Background script as `service_worker`
- Requires `minimum_chrome_version`
- No `browser_specific_settings`

### Firefox
- Uses Manifest V3
- Background script as `scripts` array
- Requires `browser_specific_settings.gecko.id` for signed extensions
- Includes `data_collection_permissions`

## Testing the Extensions

### Chrome/Chromium
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked extension"
4. Select the `dist/chrome/` directory

### Firefox
1. Go to `about:debugging`
2. Click "This Firefox" (left sidebar)
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` in `dist/firefox/`

## Creating Signed Extensions

### For Chrome Web Store
1. Create a ZIP of the `dist/chrome/` directory
2. Upload to Chrome Web Store developer dashboard
3. Submit for review

### For Firefox Add-ons
1. Create a ZIP of the `dist/firefox/` directory
2. Upload to Firefox Add-ons developer hub
3. Sign the extension
4. Submit for review

## Version Management

Update the version in these locations:
1. `manifest.json` (all versions) - `"version"` field
2. `build.sh` - `VERSION` variable
3. ZIP filenames - automatically uses the version variable

## Clean Build

To clean up and rebuild from scratch:

```bash
rm -rf dist *.zip
./build.sh
```

## Troubleshooting

### "zip command not found"
Install zip on your system:

- **Ubuntu/Debian:** `sudo apt-get install zip`
- **Fedora:** `sudo dnf install zip`
- **macOS:** Already included
- **Windows:** Use 7-Zip or install Git Bash (includes zip)

### Permission denied on build.sh
```bash
chmod +x build.sh
```

### Node.js build (alternative)
If you prefer Node.js, you can use the build.js script:
```bash
npm install
node build.js
```

## Continuous Integration

For CI/CD pipelines, you can use:

```yaml
# GitHub Actions example
name: Build Extension

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Install zip
      run: sudo apt-get update && sudo apt-get install -y zip
    - name: Build extensions
      run: chmod +x build.sh && ./build.sh
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: chrome-extension
        path: dist/chrome/
    - name: Upload Firefox artifact
      uses: actions/upload-artifact@v3
      with:
        name: firefox-extension
        path: dist/firefox/
```

## Contact

For issues or questions, please open a GitHub issue on the project repository.