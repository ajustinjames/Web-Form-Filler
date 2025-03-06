# Web Form Filler

A Chrome extension to easily save and fill web forms. Compatible with Manifest V3.

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

## Privacy & Data Collection

This extension:
- Does not collect any personal data
- Does not track user behavior
- Does not send any information to external servers
- All form data remains locally on your device
- No analytics or telemetry are implemented

## Credits

Forked from [abzubarev/web-developer-form-filler-ext](https://github.com/abzubarev/web-developer-form-filler-ext)

## License

See [LICENSE.md](LICENSE.md) for details.

## Font Awesome
The "pen-to-square" icon is from Font Awesome Free 6.5.1 by @fontawesome
- License: https://fontawesome.com/license/free (Icons: CC BY 4.0)
- Copyright: Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
