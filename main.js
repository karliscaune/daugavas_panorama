var THREE = require('three');
var markerOptions = require('./js/markers');
var panoramaOrder = require('./js/order');
var panellumTranslations = require('./js/translations');
var OrbitControls = require('./js/orbitcontrols');
var panellum = require('pannellum');

// initialize stuff
const canvas = document.getElementById('navCanvas');
let panoramaViewer = null;

// marker positions

const markers = Object.values(markerOptions.options);
var baseMeshes = [];

var panellumStrings = panellumTranslations.strings;

// panorama order

const pOrder = Object.values(panoramaOrder.order);


// var MapControls = function ( object, domElement ) {

// 	OrbitControls.call( this, object, domElement );

// 	this.mouseButtons.LEFT = THREE.MOUSE.PAN;
// 	this.mouseButtons.RIGHT = THREE.MOUSE.PAN;

// 	// this.touches.ONE = THREE.TOUCH.PAN;
// 	// this.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;

// };

// MapControls.prototype = Object.create( THREE.EventDispatcher.prototype );
// MapControls.prototype.constructor = MapControls;

const closeButton = document.getElementById('closeButton');
const popup = document.getElementById('panoramaPopup');
const popupLogosElement = document.getElementById('panoramaLogos');
const panoramaPrevButton = document.getElementById('panoramaPrev');
const panoramaNextButton = document.getElementById('panoramaNext');
let popupIsOpen = false;
// Holds the value of the currently opened panoramas index
let currentUserData = 1; // This is at first updated by the user clicking on a marker.


closeButton.addEventListener('click', closePopup);
panoramaPrevButton.addEventListener('click', openPrevPanorama);
panoramaNextButton.addEventListener('click', openNextPanorama);

panoramaPrevButton.addEventListener('touchstart', openPrevPanorama);
panoramaNextButton.addEventListener('touchstart', openNextPanorama);
closeButton.addEventListener('touchstart', closePopup);


function openPrevPanorama() {
    openAnotherPanorama(-1);
}

function openNextPanorama() {
    openAnotherPanorama(1);
}

function equals(n) {
    return n == currentUserData;
}

function openAnotherPanorama(increment) {
    const nextIndex = pOrder.findIndex(equals) + increment;
    let indexToOpen = 0;
    if(nextIndex < 0) {
        indexToOpen = pOrder[24];
    } else {
        if(nextIndex > 24) {
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
            "panorama": userData.imageUrl + '.jpg',
            "vaov": userData.vaov,
            "vOffset": userData.vOffset,
            "maxPitch": userData.maxpitch,
            "minPitch": userData.minpitch,
            "showZoomCtrl": false,
            "showFullscreenCtrl": false,
            "autoLoad": true,
            "autoRotate": 1,
            "friction": 0.05,
            "strings": panellumStrings,
        });
    }    
}

function closePopup() {
    popup.classList.remove('visible');
    popupLogosElement.classList.remove('visible');
    popupIsOpen = false;
    if(panoramaViewer) {
        panoramaViewer.destroy();
    }
}

function openPopup(userData) {
    console.log(userData);
    popupIsOpen = true;
    currentUserData = userData.index;
    
    panoramaViewer = pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": userData.imageUrl + '.jpg',
        "vaov": userData.vaov,
        "vOffset": userData.vOffset,
        "maxPitch": userData.maxpitch,
        "minPitch": userData.minpitch,
        "showZoomCtrl": false,
        "showFullscreenCtrl": false,
        "autoLoad": true,
        "autoRotate": 1,
        "friction": 0.05,
        "strings": panellumStrings,
    });

    panoramaViewer.on('load',
    function () {
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
                console.log(intersectedObjects);
                // save its color
                // this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
                // set its emissive color to flashing red/yellow
                // this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
                // check if the picked object is the ground plane
                if (this.pickedObject.userData.id) {
                    console.log(this.pickedObject.userData.id);
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

    // effects

    // const composer = new THREE.EffectComposer(renderer);

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
        mesh.userData.htmlContent = markers[i].htmlContent;
        mesh.userData.index = markers[i].index;

        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        baseMeshes.push(mesh);
        scene.add( mesh );
        scene.add(shadowMesh);
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
    console.log(controls);
}

function animate() {
    requestAnimationFrame( animate );
    // scene.children.forEach(el => {
    //     if(el.name == 'base-object') {
    //         // el.lookAt(camera.position);
    //         el.updateMatrix();
    //     };

    // });
    controls.update();
    render();
}

function render() {
    renderer.render( scene, camera );
}