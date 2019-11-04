var THREE = require('three');
var markerOptions = require('./js/markers');
var panoramaOrder = require('./js/order');
var placeNames = require('./js/names');
var panellumTranslations = require('./js/translations');
var OrbitControls = require('./js/orbitcontrols');
var panellum = require('pannellum');
var polyfill = require('url-polyfill');

// Polyfills

function objectValues(obj) {
    return Object.keys(obj).map(function(k) {
       return obj[k];
    });
};

// https://tc39.github.io/ecma262/#sec-array.prototype.findindex
if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
      value: function(predicate) {
       // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }
  
        var o = Object(this);
  
        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;
  
        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }
  
        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
        var thisArg = arguments[1];
  
        // 5. Let k be 0.
        var k = 0;
  
        // 6. Repeat, while k < len
        while (k < len) {
          // a. Let Pk be ! ToString(k).
          // b. Let kValue be ? Get(O, Pk).
          // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
          // d. If testResult is true, return k.
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return k;
          }
          // e. Increase k by 1.
          k++;
        }
  
        // 7. Return -1.
        return -1;
      },
      configurable: true,
      writable: true
    });
  }

// Get params

var url_string = window.location.href;
var url = new URL(url_string);
// Is autoplay enabled?
var autoplayFlag = url.searchParams.get("autoplay") == '1' ? true : false;
// How long is idle time?
var idleTimeInSeconds = url.searchParams.get("wait") ? parseInt(url.searchParams.get("wait")) : 300;
var idleTime = idleTimeInSeconds * 1000; // convert to milliseconds
// How fast should panoramas autorotate?
var autoRotateSpeed = url.searchParams.get("speed") ? parseInt(url.searchParams.get("speed")) : 1;

// Set up idle timer

var isAutoPlaying = false;
var panoramaInterval;
// When autorotating, time for rotating a full circle equals 360deg / speed(deg/s) + few seconds of loading
var slideTime = ((360 / autoRotateSpeed) * 1000) + 2000; // convert to milliseconds
var waitTimeout;

function startAutoplay() {
    console.log('started autoplay');
    isAutoPlaying = true;
    if(popupIsOpen) {
        openNextPanorama();
        panoramaInterval = setInterval(openNextPanorama, slideTime);
    } else {
        openPopup(baseMeshes[0].userData);
        panoramaInterval = setInterval(openNextPanorama, slideTime);
    }
}

// needs to be called after any interaction
function resetWaitTimeout() {
    // console.log('clearing timeout');
    clearTimeout(waitTimeout);
    waitTimeout = setTimeout(startAutoplay, idleTime);
    if(isAutoPlaying) { 
        isAutoPlaying = false;
        clearInterval(panoramaInterval);
    };
}

if(autoplayFlag) {
    // set initial timeout
    waitTimeout = setTimeout(startAutoplay, idleTime);
    // set event listeners
    ['touchstart', 'mousedown'].forEach(function(ev) {
        window.addEventListener(ev, function() {
            resetWaitTimeout();
        })
    })
}


// Get device type

var isIos = false;
var imagePath = '';

var standalone = window.navigator.standalone,
    userAgent = window.navigator.userAgent.toLowerCase(),
    safari = /safari/.test( userAgent ),
    ios = /iphone|ipod|ipad/.test( userAgent );

if( ios ) {
    isIos = true;  
} 

if (isIos || window.screen.width < 600 ) {
    imagePath = 'assets/small_panoramas/';
} else {
    imagePath = 'assets/';
}

// initialize stuff
const canvas = document.getElementById('navCanvas');
let panoramaViewer = null;
let mobileInfoIsOpen = false;

// Place names

const places = objectValues(placeNames.namePlanes);

// marker positions

const markers = objectValues(markerOptions.options);
const panoramaCount = markers.length -1;
var baseMeshes = [];
var placeMeshes = [];

var panellumStrings = panellumTranslations.strings;

// panorama order

const pOrder = objectValues(panoramaOrder.order);

// Event listeners

const closeButton = document.getElementById('closeButton');
const mobileOpenDescription = document.getElementById('mobileToggleDescription');
const popup = document.getElementById('panoramaPopup');
const popupLogosElement = document.getElementById('panoramaLogos');
const panoramaPrevButton = document.getElementById('panoramaPrev');
const panoramaNextButton = document.getElementById('panoramaNext');
let popupIsOpen = false;

// Static elements

const infoTitle = document.getElementById('infoTitle');
const infoDescription = document.getElementById('infoDescription');
const infoContainer = document.getElementById('infoContainer');

// Holds the value of the currently opened panoramas index
let currentUserData = 1; // This is at first updated by the user clicking on a marker.


closeButton.addEventListener('click', closePopup);
mobileOpenDescription.addEventListener('click', handleInfoToggling);
panoramaPrevButton.addEventListener('click', openPrevPanorama);
panoramaNextButton.addEventListener('click', openNextPanorama);

closeButton.addEventListener('touchstart', closePopup);
mobileOpenDescription.addEventListener('touchstart', handleInfoToggling);
panoramaPrevButton.addEventListener('touchstart', openPrevPanorama);
panoramaNextButton.addEventListener('touchstart', openNextPanorama);

function handleInfoToggling() {
    if(mobileInfoIsOpen) {
        closeInfoText();
    } else {
        mobileOpenInfoDescription();
    }
}

function closeInfoText() {
    mobileInfoIsOpen = false;
    mobileOpenDescription.classList.remove('close');
    infoContainer.classList.remove('show-description');
}

function mobileOpenInfoDescription() {
    mobileInfoIsOpen = true;
    mobileOpenDescription.classList.add('close');
    infoContainer.classList.add('show-description');
}

function openPrevPanorama() {
    openAnotherPanorama(-1);
}

function openNextPanorama() {
    openAnotherPanorama(1);
}

function equals(n) {
    return n == currentUserData;
}

function updateInfo(userData) {
    infoTitle.innerHTML = userData.title;
    infoDescription.innerHTML = userData.description;
}

function openAnotherPanorama(increment) {
    hideInfo();
    const nextIndex = pOrder.findIndex(equals) + increment;
    let indexToOpen = 0;
    if(nextIndex < 0) {
        indexToOpen = pOrder[panoramaCount];
    } else {
        if(nextIndex > panoramaCount) {
            indexToOpen = pOrder[0];
        } else {
            indexToOpen = pOrder[nextIndex];
        }
    }
    
    // Update currentUserData with the new index
    currentUserData = indexToOpen;

    // Open the panorama
    if(panoramaViewer) {
        panoramaViewer.destroy();
    };

    if(baseMeshes.length > 0) {
        const userData = baseMeshes[currentUserData].userData;
        panoramaViewer = pannellum.viewer('panorama', {
            "type": "equirectangular",
            "panorama": imagePath + userData.imageUrl + '.jpg',
            "vaov": userData.vaov,
            "vOffset": userData.vOffset,
            "maxPitch": userData.maxpitch,
            "minPitch": userData.minpitch,
            "showZoomCtrl": false,
            "showFullscreenCtrl": false,
            "autoLoad": true,
            "autoRotate": autoRotateSpeed,
            "friction": 0.05,
            "strings": panellumStrings,
        });
        // Update text inside popup and hide it
        hideInfo();
        panoramaViewer.on('load', function () {
            updateInfo(userData);
            requestAnimationFrame(function() {
                closeInfoText();
                showInfo();
            });
        });
    }
}

function closePopup() {
    hideInfo();
    popup.classList.remove('visible');
    popupLogosElement.classList.remove('visible');
    popupIsOpen = false;
    if(panoramaViewer) {
        panoramaViewer.destroy();
    }
}

function showInfo() {
    infoContainer.classList.remove("hidden");
    infoContainer.classList.add("visible");
}

function hideInfo() {
    infoContainer.classList.add("hidden");
    infoContainer.classList.remove("visible");
}

function openPopup(userData) {
    popupIsOpen = true;
    currentUserData = userData.index;
    
    panoramaViewer = pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": imagePath + userData.imageUrl + '.jpg',
        "vaov": userData.vaov,
        "vOffset": userData.vOffset,
        "maxPitch": userData.maxpitch,
        "minPitch": userData.minpitch,
        "showZoomCtrl": false,
        "showFullscreenCtrl": false,
        "autoLoad": true,
        "autoRotate": autoRotateSpeed,
        "friction": 0.05,
        "strings": panellumStrings,
    });

    panoramaViewer.on('load', function () {
        updateInfo(userData);
        requestAnimationFrame(function() {
            closeInfoText();
            showInfo();
        });
        popupLogosElement.classList.add('visible');
    }
);

    popup.classList.add('visible');
}


class PickHelper {
    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera) {
        if(!popupIsOpen) {
            if (this.pickedObject) {
                this.pickedObject = undefined;
              }
           
            this.raycaster.setFromCamera(normalizedPosition, camera);
            const intersectedObjects = this.raycaster.intersectObjects(scene.children);
            if (intersectedObjects.length) {
                this.pickedObject = intersectedObjects[0].object;
                // console.log(intersectedObjects);
                if (this.pickedObject.userData.id) {
                    // console.log(this.pickedObject.userData.id);
                    openPopup(this.pickedObject.userData);
                }
                clearPickPosition();
            }
        }
    }
}

const pickPosition = {x: 0, y: 0};
clearPickPosition();
 
 
function getCanvasRelativePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}
 
function setPickPosition(event) {
  const pos = getCanvasRelativePosition(event);
  pickPosition.x = (pos.x / canvas.clientWidth ) *  2 - 1;
  pickPosition.y = (pos.y / canvas.clientHeight) * -2 + 1;  // note we flip Y
  pickHelper.pick(pickPosition, scene, camera);
}
 
function clearPickPosition() {
  pickPosition.x = -1000000;
  pickPosition.y = -1000000;
}
 
window.addEventListener('mousedown', setPickPosition);
window.addEventListener('mouseup', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);

window.addEventListener('touchstart', (event) => {
    // prevent the window from scrolling
    event.preventDefault();
    setPickPosition(event.touches[0]);
  }, {passive: false});
   
window.addEventListener('touchmove', (event) => {
setPickPosition(event.touches[0]);
});

window.addEventListener('touchend', clearPickPosition);

// picker
const pickHelper = new PickHelper();

var camera, controls, scene, renderer;



init();
//render(); // remove when using next line for animation loop (requestAnimationFrame)
animate();
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( "rgb(255, 255, 255)" );
    // scene.fog = new THREE.FogExp2( scene.background, 0.0027 );
    scene.fog = new THREE.Fog(scene.background, 0, 2000);
    renderer = new THREE.WebGLRenderer( { canvas: navCanvas, antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.set( 400, 200, 0 );
    // controls
    controls = new OrbitControls( camera, renderer.domElement );
    // controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; 
    controls.dampingFactor = 0.75;
    controls.screenSpacePanning = false;
    controls.minDistance = 500;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = false;
    controls.enableKeys = false;
    controls.rotateLeft(Math.PI / 2.8);

    // world
    
    var bgTexture = new THREE.TextureLoader().load( "assets/bg2.jpg" );

    var maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
	bgTexture.anisotropy = maxAnisotropy;

    // Pin geometry and materials
    var baseGeometry = new THREE.PlaneGeometry(37, 60, 1);
    var shadowGeometry = new THREE.PlaneGeometry(60, 60, 1);
    
    var baseTexture = new THREE.TextureLoader().load( "assets/base-texture-2.png" );
    baseTexture.anisotropy = maxAnisotropy;
    var baseMaterial = new THREE.MeshBasicMaterial( { map: baseTexture, side: THREE.DoubleSide, transparent: true } );

    var shadowTexture = new THREE.TextureLoader().load( "assets/shadow.png" );
    var shadowMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, map: shadowTexture, side: THREE.DoubleSide, transparent: true } );
    
    var groundPlaneGeometry = new THREE.PlaneGeometry( 4000, 4000, 1, 1 );
    var groundPlaneMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff,  map: bgTexture, side: THREE.DoubleSide} );
    var groundPlane = new THREE.Mesh( groundPlaneGeometry, groundPlaneMaterial );
    groundPlane.rotation.x = - Math.PI / 2;
    scene.add( groundPlane );

    for(let i = 0; i < markers.length; i++) {
        var mesh = new THREE.Mesh(baseGeometry, baseMaterial);
        var shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);

        mesh.name = 'base-object';

        mesh.position.x = markers[i].x;
        mesh.position.y = 35;
        mesh.position.z = markers[i].z;

        shadowMesh.position.x = markers[i].x;
        shadowMesh.position.z = markers[i].z;
        shadowMesh.position.y = 1;
        shadowMesh.rotation.x = Math.PI / 2;

        mesh.userData.id = markers[i].id;
        mesh.userData.imageUrl = markers[i].imageUrl;
        mesh.userData.vaov = markers[i].vaov;
        mesh.userData.vOffset = markers[i].vOffset;
        mesh.userData.maxpitch = markers[i].maxpitch;
        mesh.userData.minpitch = markers[i].minpitch;
        mesh.userData.title = markers[i].title;
        mesh.userData.description = markers[i].description;
        mesh.userData.index = markers[i].index;

        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        baseMeshes.push(mesh);
        scene.add( mesh );
        scene.add(shadowMesh);
    }

    for(let i = 0; i < places.length; i++) {
        const texture = new THREE.TextureLoader().load( places[i].imageUrl + ".png" );
        const material = new THREE.MeshBasicMaterial( {color: 0xffffff,  map: texture, side: THREE.DoubleSide, transparent: true } );
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry( 100, 100, 1, 1 ), material);

        mesh.name = 'place-name';
        mesh.position.x = places[i].x;
        mesh.position.y = 35;
        mesh.position.z = places[i].z;

        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        placeMeshes.push(mesh);
        scene.add( mesh );
    }

    // lights
    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 1, 1, 1 );
    scene.add( light );
    var light = new THREE.DirectionalLight( 0x002288 );
    light.position.set( - 1, - 1, - 1 );
    scene.add( light );
    var light = new THREE.AmbientLight( 0x222222 );
    scene.add( light );
    window.addEventListener( 'resize', onWindowResize, false );
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    // console.log(controls);
}

function animate() {
    requestAnimationFrame( animate );
    // scene.children.forEach(el => {
    //     if(el.name == 'place-name') {
    //         el.lookAt(camera.position);
    //         el.updateMatrix();
    //     };
    // });
    controls.update();
    render();
}

function render() {
    renderer.render( scene, camera );
}