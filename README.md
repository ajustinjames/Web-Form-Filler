# Web Form Filler

A Chrome extension that helps developers quickly fill out web forms. Compatible with Manifest V3.

## Features

- Easily fill forms on any webpage
- Works with http, https, and local file URLs
- Keyboard shortcuts support via Mousetrap
- Lightweight and fast execution

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Files Structure

- `/bootstrap` - UI framework files
- `/images` - Extension icons (16px, 48px, 128px)
- `/javascripts` - Core extension scripts
  - `background.js` - Service worker script
  - `content_script.js` - Form interaction logic
  - `popup.js` - Extension popup functionality

## Permissions

The extension requires minimal permissions to function:
- Access to web pages for form filling
- Local storage for saving settings

## Credits

Forked from [abzubarev/web-developer-form-filler-ext](https://github.com/abzubarev/web-developer-form-filler-ext)

## License

See [LICENSE.md](LICENSE.md) for details.