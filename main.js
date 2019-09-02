var THREE = require('three');
var app = require('./js/app');
var OrbitControls = require('./js/orbitcontrols');
// var MapControls = require('./js/mapControls');

// initialize stuff
const canvas = document.getElementById('navCanvas');

// marker positions

const markers = [
    { x: 100, z: 100, id: 'p1'},
    { x: 100, z: 200, id: 'p2'},
    { x: 200, z: 100, id: 'p3'},
    { x: 200, z: 200, id: 'p4'},
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


class PickHelper {
    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera, time) {
      // restore the color if there is a picked object
      if (this.pickedObject) {
        this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
        this.pickedObject = undefined;
      }
   
      // cast a ray through the frustum
      this.raycaster.setFromCamera(normalizedPosition, camera);
      // get the list of objects the ray intersected
      const intersectedObjects = this.raycaster.intersectObjects(scene.children);
      if (intersectedObjects.length) {
        // pick the first object. It's the closest one
        this.pickedObject = intersectedObjects[0].object;
        // save its color
        this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
        // set its emissive color to flashing red/yellow
        // this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
        console.log(this.pickedObject.userData.id);
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
  // unlike the mouse which always has a position
  // if the user stops touching the screen we want
  // to stop picking. For now we just pick a value
  // unlikely to pick something
  pickPosition.x = -100000;
  pickPosition.y = -100000;
}
 
window.addEventListener('mousedown', setPickPosition);
window.addEventListener('mouseup', clearPickPosition);
// window.addEventListener('mouseleave', clearPickPosition);

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
				controls.dampingFactor = 0.95;
				controls.screenSpacePanning = false;
				controls.minDistance = 500;
				controls.maxDistance = 500;
                controls.maxPolarAngle = Math.PI / 2;
				// world
				var geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
				geometry.translate( 0, 0.5, 0 );
				var material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
				// for ( var i = 0; i < 100; i ++ ) {
				// 	var mesh = new THREE.Mesh( geometry, material );
				// 	mesh.position.x = Math.random() * 1600 - 800;
				// 	mesh.position.y = 0;
				// 	mesh.position.z = Math.random() * 1600 - 800;
				// 	mesh.scale.x = 20;
				// 	mesh.scale.y = Math.random() * 80 + 10;
				// 	mesh.scale.z = 20;
				// 	mesh.updateMatrix();
				// 	mesh.matrixAutoUpdate = false;
				// 	scene.add( mesh );
                // }
                
                // generate objects with x / z coordinates and IDs

                for(i = 0; i < markers.length; i++) {
                    var mesh = new THREE.Mesh(geometry, material);
                    mesh.position.x = markers[i].x;
                    mesh.position.y = 0;
                    mesh.position.z = markers[i].z;
                    mesh.scale.x = 20;
					mesh.scale.y = 100;
                    mesh.scale.z = 20;
                    mesh.userData.id = markers[i].id;
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
				controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
				render();
            }

			function render(time) {
                time *= 0.001;  // convert to seconds;
                pickHelper.pick(pickPosition, scene, camera, time);
				renderer.render( scene, camera );
			}