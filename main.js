var THREE = require('three');
var app = require('./js/app');
var OrbitControls = require('./js/orbitcontrols');
var panellum = require('pannellum');
// var MapControls = require('./js/mapControls');

// initialize stuff
const canvas = document.getElementById('navCanvas');

// marker positions

const markers = [
    { x: 100, z: 100, id: 'p1', imageUrl: 'dist/demo4', vaov: 180, vOffset: 0, maxpitch: 40, minpitch: -90, htmlContent: '' },
    { x: 100, z: 200, id: 'p2', imageUrl: 'dist/demo4', vaov: 180, vOffset: 0, maxpitch: 40, minpitch: -90, htmlContent: '' },
    { x: 200, z: 100, id: 'p3', imageUrl: 'dist/demo4', vaov: 180, vOffset: 0, maxpitch: 40, minpitch: -90, htmlContent: '' },
    { x: 200, z: 200, id: 'p4', imageUrl: 'dist/demo4', vaov: 180, vOffset: 0, maxpitch: 40, minpitch: -90, htmlContent: '' },
];


var MapControls = function ( object, domElement ) {

	OrbitControls.call( this, object, domElement );

	this.mouseButtons.LEFT = THREE.MOUSE.PAN;
	this.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;

	// this.touches.ONE = THREE.TOUCH.PAN;
	// this.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;

};

MapControls.prototype = Object.create( THREE.EventDispatcher.prototype );
MapControls.prototype.constructor = MapControls;

const closeButton = document.getElementById('closeButton');
const popup = document.getElementById('panoramaPopup');
let popupIsOpen = false;

closeButton.addEventListener('click', closePopup);

function closePopup() {
    popup.classList.remove('visible');
    popupIsOpen = false;
    // TODO: destroy the panorama here
    if(panoramaViewer) {
        panoramaViewer.destroy();
    }
}

function openPopup(userData) {
    console.log(userData);
    popupIsOpen = true;
    
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
        "strings": {
            "loadButtonLabel": "Ielādēt",
            "loadingLabel": "Ielādē...",
            "bylineLabel": "",    
        
            "noPanoramaError": "",
            "fileAccessError": "Nav iespējams ielādēt attēlu.",
            "malformedURLError": "",
            "iOS8WebGLError": "",
            "genericWebGLError": "Jūsu interneta pārlūks neatbalsta nepieciešamās WebGL funkcijas.",
            "textureSizeError": "Ielādētais attēls ir pārāk liels Jūsu ierīcei.",
            "unknownError": "Neizdevās ielādēt panorāmu."
        }
    });

    popup.classList.add('visible');
}


class PickHelper {
    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera, time) {
        if(!popupIsOpen) {
            if (this.pickedObject) {
                this.pickedObject = undefined;
              }
           
            this.raycaster.setFromCamera(normalizedPosition, camera);
            const intersectedObjects = this.raycaster.intersectObjects(scene.children);
            if (intersectedObjects.length) {
            this.pickedObject = intersectedObjects[0].object;
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
}
 
function clearPickPosition() {
  pickPosition.x = -100000;
  pickPosition.y = -100000;
}
 
window.addEventListener('click', setPickPosition);
window.addEventListener('mouseup', clearPickPosition);
// window.addEventListener('mouseleave', clearPickPosition);

// window.addEventListener('touchstart', (event) => {
//     // prevent the window from scrolling
//     event.preventDefault();
//     setPickPosition(event.touches[0]);
//   }, {passive: false});
   
  window.addEventListener('touchmove', (event) => {
    setPickPosition(event.touches[0]);
  });
   
  window.addEventListener('touchend', clearPickPosition);

  // picker
  const pickHelper = new PickHelper();

app.init();

var camera, controls, scene, renderer;
init();
//render(); // remove when using next line for animation loop (requestAnimationFrame)
animate();
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcccccc );
    scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );
    renderer = new THREE.WebGLRenderer( { canvas: navCanvas, antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 400, 200, 0 );
    // controls
    controls = new MapControls( camera, renderer.domElement );
    // controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.85;
    controls.screenSpacePanning = false;
    controls.minDistance = 500;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;
    // world
    var geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
    geometry.translate( 0, 0.5, 0 );
    var material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
    
    var planeGeometry = new THREE.PlaneGeometry( 300, 300, 32 );
    var planeMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = Math.PI / 2;
    scene.add( plane );

    for(i = 0; i < markers.length; i++) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = markers[i].x;
        mesh.position.y = 0;
        mesh.position.z = markers[i].z;
        mesh.scale.x = 20;
        mesh.scale.y = 100;
        mesh.scale.z = 20;
        mesh.userData.id = markers[i].id;
        mesh.userData.imageUrl = markers[i].imageUrl;
        mesh.userData.vaov = markers[i].vaov;
        mesh.userData.vOffset = markers[i].vOffset;
        mesh.userData.maxpitch = markers[i].maxpitch;
        mesh.userData.minpitch = markers[i].minpitch;
        mesh.userData.htmlContent = markers[i].htmlContent;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
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
    //
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
    controls.update();
    render();
}

function render(time) {
    time *= 0.001;
    pickHelper.pick(pickPosition, scene, camera, time);
    renderer.render( scene, camera );
}