# Daugavas panorāma

Interface for a virtual exhibition of panoramas of Daugava

## Build

Uses browserify to bundle all js in `dist/bundle.js`

`browserify main.js -o dist/bundle.js`

For production, run an uglifier and ES5 transpiler as well:

`browserify main.js -t [ babelify --presets [ @babel/preset-env ] ] | uglifyjs > dist/bundle.js`

## Run in a local server

`python -m SimpleHTTPServer`

Open `0.0.0.0:8000` to see the page.
