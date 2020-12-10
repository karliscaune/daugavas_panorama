# Daugavas panorāma

Interface for a virtual exhibition of panoramas of Daugava
https://karliscaune.github.io/daugavas_panorama/

## Build

Uses browserify to bundle all js in `dist/bundle.js`

`browserify main.js -o dist/bundle.js`

For production, run an uglifier and ES5 transpiler as well:

`browserify main.js -t [ babelify --presets [ @babel/preset-env ] ] | uglifyjs > dist/bundle.js`

## Run in a local server for development

`python -m SimpleHTTPServer`

Open `0.0.0.0:8000` to see the page.

## Run in kiosk mode on Windows 10, Chrome

Needs Tinyweb server from here - https://www.ritlabs.com/download/tinyweb/tinyweb-1-94.zip

Put tiny.exe in root directory and the project folder in C:\

Execute run.bat on startup.

## Configuration

The application supports automatically cycling through panoramas after a specified amount of idle time. Timer is reset after any `touchstart` or `mousedown` event.

`autoplay=1` param enables autoplay.

`wait=[integer]` specifies after how many seconds of being idle autoplay should begin. The default is `300` (5 minutes).

`speed=[integer]` specifies how fast should a panorama autorotate in degrees / second. Default is 1.

Example: set autoplay to kick in after 1 minute and set panorama autorotation speed to 3.

`http://0.0.0.0:8000/?autoplay=1&wait=60&speed=3`

## Licensing

All photographic panorama images are the work of Uģis Bērziņš and may not be distributed, altered or used commercially without the authors permission.