var _initFunction = function(web3DApp) {};
var _updateFunction = function(web3DApp) {};
var _resizeFunction = function(web3DApp){};
var _mousedownFunction = function(web3DApp, event){};
var _mouseupFunction = function(web3DApp, event){};
var _mousemoveFunction = function(web3DApp, event){};

window.onload = function() {

	var container = document.getElementById('CanvasDiv');

	var web3DApp = {
		'winWidth'	:	window.innerWidth,
		'winHeight'	:	window.innerHeight,
		'renderer'	:	0,
		'scene'		:	0,
		'camera'	:	0
		};
		
	web3DApp.renderer = new THREE.WebGLRenderer();
	web3DApp.camera = new THREE.PerspectiveCamera(
		45.0, web3DApp.winWidth/web3DApp.winHeight, 0.1, 10.0);
	web3DApp.camera.position.z = 5;
	web3DApp.camera.updateProjectionMatrix();
	
	web3DApp.scene = new THREE.Scene();
	web3DApp.scene.add(web3DApp.camera);

	web3DApp.renderer.setSize(web3DApp.winWidth, web3DApp.winHeight);

	container.appendChild(web3DApp.renderer.domElement);
	
	_initFunction(web3DApp);
	
	var animate = function () {
		requestAnimationFrame(animate);
		_updateFunction(web3DApp);
	};
	
	function onWindowResize() {
		container.width = window.innerWidth;
		container.height = window.innerHeight;
		
		web3DApp.winWidth = window.innerWidth;
		web3DApp.winHeight = window.innerHeight;
		web3DApp.camera.aspect = window.innerWidth / window.innerHeight;
		web3DApp.camera.updateProjectionMatrix();
		web3DApp.renderer.setSize(window.innerWidth, window.innerHeight);
		_resizeFunction(web3DApp);
	}
	
	function onMouseDown(event){
		_mousedownFunction(web3DApp,event);
	}
	
	function onMouseUp(event){
		_mouseupFunction(web3DApp,event);
	}
	
	function onMouseMove(event){
		_mousemoveFunction(web3DApp,event);
	}
	
	function onContextMenu(event){
		event.preventDefault();
	}
	
	window.addEventListener( 'resize', onWindowResize, false );
	web3DApp.renderer.domElement.addEventListener( 'mousedown', onMouseDown, false );
	window.addEventListener( 'mouseup', onMouseUp, false );
	window.addEventListener( 'mousemove', onMouseMove, false );
	window.addEventListener( 'contextmenu', onContextMenu, false );
	
	web3DApp.renderer.render(web3DApp.scene, web3DApp.camera);
	
	animate();
}
