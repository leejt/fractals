var uniforms, material, texture, mesh, zoomAcc, lastTime;
var zoomIn = false;
var zoomOut = false;
var desplacement = false;
var mouseLatsPos = {
		"x" : 0.0,
		"y" : 0.0
	};
var currentEquation = 'exp(z^3)';
var currentNumIterations = 100.0;
var currentEscape = 10000.0;
var currentColorScale = 25.0;
var numTextureColors = 4;
var textureSize = 256;
var currentPalette = 3;
var currentTextureFiltering = false;
var currAR = 1.0;
var currentZoom = 3.5;
var currentDesp = {
		"x" : 0.0,
		"y" : 0.0
	};
var time = 0;
var needsTime = false;
var playing = true;
var oneOff = false;
var rands = {};

var storedWeb3DApp;

function renderImage(web3DApp){
	uniforms.minPoint.value.x = ((-0.5)*currentZoom) + currentDesp.x;
	uniforms.minPoint.value.y = ((-0.5)*currAR*currentZoom) + currentDesp.y;
	uniforms.spaceArea.value.x = 1.0*currentZoom;
	uniforms.spaceArea.value.y = 1.0*currAR*currentZoom;
	web3DApp.renderer.render(storedWeb3DApp.scene, storedWeb3DApp.camera);
}
function screenshot(){
	renderImage(storedWeb3DApp);
	var w = window.open('', '');
	w.document.title = "Screenshot";
	var img = new Image();
	img.src = storedWeb3DApp.renderer.domElement.toDataURL();
	w.document.body.appendChild(img);
}
jsep.removeBinaryOp('^');
jsep.addBinaryOp('^', 11);
jsep.addLiteral('e', Math.exp(1));
jsep.addLiteral('i', 'i')
var e_val = Math.exp(1).toString();
funcs = {};
funcs.exp = ['cexp', 1]
funcs.log = ['clog', 1];
funcs.sin = ['csin', 1];
funcs.cos = ['ccos', 1];
funcs.tan = ['ctan', 1];
funcs.csc = ['ccsc', 1];
funcs.sec = ['csec', 1];
funcs.cot = ['ccot', 1];
funcs.asin = ['casin', 1];
funcs.arcsin = ['casin', 1];
funcs.acos = ['cacos', 1];
funcs.arccos = ['cacos', 1];
funcs.atan = ['catan', 1];
funcs.arctan = ['catan', 1];
funcs.acsc = ['cacsc', 1];
funcs.arccsc = ['cacsc', 1];
funcs.asec = ['casec', 1];
funcs.arcsec = ['casec', 1];
funcs.acot = ['cacot', 1];
funcs.arccot = ['cacot', 1];
funcs.sinh = ['csinh', 1];
funcs.cosh = ['ccosh', 1];
funcs.tanh = ['ctanh', 1];
funcs.csch = ['ccsch', 1];
funcs.sech = ['csech', 1];
funcs.coth = ['ccoth', 1];
funcs.gamma = ['cgamma', 1];
funcs.digamma = ['cdigamma', 1];

function parseEquation(eq) {
	if (eq.type == 'Literal') {
		if (eq.imag) {
			return `vec2(0, ${eq.value.toFixed(20)})`;
		}
		if (eq.value == 'i') {
			return 'vec2(0, 1)';
		}
		return eq.value.toFixed(20);
	}
	if (eq.type == 'Identifier') {
		if (eq.name != 'z' && eq.name != 'c' && eq.name != 't' && eq.name[0] != "r") {
			throw new Error(`Translation error: variable must be z, c, t or start with r (got ${eq.name})`)
		}
		if (eq.name == 't') {
			needsTime = true;
		}
		if (eq.name[0] == 'r') {
			if (eq.name.length > 1) {
				if (!rands[eq.name]) {
					rands[eq.name] = Math.random();
				}
				return rands[eq.name]
			}
			return Math.random();
		}
		return eq.name
	}
	if (eq.type == 'BinaryExpression') {
		var left = parseEquation(eq.left);
		var right = parseEquation(eq.right);
		if (eq.operator == '+') {
			return `cadd(${left}, ${right})`;
		}
		if (eq.operator == '-') {
			return `csub(${left}, ${right})`;
		}
		if (eq.operator == '*') {
			return `cmul(${left}, ${right})`;
		}
		if (eq.operator == '/') {
			return `cdiv(${left}, ${right})`;
		}
		if (eq.operator == '^') {
			if (left == e_val) {
				return `cexp(${right})`;
			}
			if (right == '2') {
				return `c2(${left})`;
			}
			if (right == '3') {
				return `c3(${left})`;
			}
			return `cpow(${left}, ${right})`;
		}
	}
	if (eq.type == 'UnaryExpression') {
		var argument = parseEquation(eq.argument);
		if (eq.operator == '-') {
			return `-${argument}`;
		}
	}
	if (eq.type == 'CallExpression') {
		var arguments = []
		for (var i = 0; i < eq.arguments.length; i++) {
			arguments.push(parseEquation(eq.arguments[i]));
		}
		var name = eq.callee.name;
		if (funcs[name] == undefined) {
			throw new Error(`Unsupported function: ${name}`);
		}
		if (funcs[name][1] != arguments.length) {
			throw new Error(`Wrong number of arguments for ${name}: got ${arguments.length}, expected ${funcs[name][1]}`)
		}
		name = funcs[name][0];
		return `${name}(${arguments.join(', ')})`;
	}
	throw new Error("Parsing error: couldn't recognize the equation. Make sure to have operators between things!")
}
function generateTexture(){
	
	var colorTable = 
	[[0/6, [1, 0, 0, 1.0]],
	[1/6, [1, 1, 0, 1.0]],
	[2/6, [0, 1, 0, 1.0]],
	[3/6, [0, 1, 1, 1.0]],
	[4/6, [0, 0, 1, 1.0]],
	[5/6, [1, 0, 1, 1.0]],
	[6/6, [1, 0, 0, 1.0]]];

		
	var canvas = document.createElement( 'canvas' );
	canvas.width = textureSize;
	canvas.height = 1;
	var context = canvas.getContext('2d');
	var index = 0;
	for( var x = 0; x < textureSize; x++ ){
		var percent = x / textureSize;
		while (percent > colorTable[index+1][0]) {
			index++;
		}
		var color1 = colorTable[index][1]
		var color2 = colorTable[index+1][1]
		var diff = (percent-colorTable[index][0])/(colorTable[index+1][0]-colorTable[index][0]);
		var finalColor = [
			((color1[0]*(1.0-diff)) + (color2[0]*diff))*255.0, 
			((color1[1]*(1.0-diff)) + (color2[1]*diff))*255.0, 
			((color1[2]*(1.0-diff)) + (color2[2]*diff))*255.0, 
			((color1[3]*(1.0-diff)) + (color2[3]*diff))];
		var colorStr = 'rgba(' + Math.floor(finalColor[0]).toString() + ',' 
				+ Math.floor(finalColor[1]).toString() + ','
				+ Math.floor(finalColor[2]).toString() + ','
				+ finalColor[3].toFixed(2).toString()  + ')';
		context.fillStyle = colorStr;
		context.fillRect(x, 0, 1, 1);
	}
	
	texture = new THREE.Texture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	if(!currentTextureFiltering){
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
	}
	texture.needsUpdate = true;
	return texture;
}

function updateValues(){
	time = 0.0;
	document.getElementById('input_time').value = time.toFixed(3);
	needsTime = false;
	rands = {};
	parsedEquation = parseEquation(jsep(currentEquation));
	material.fragmentShader = "#define MAX_ITERATIONS " + currentNumIterations.toFixed(1)+ "\n #define ESCAPE_RADIUS " 
		+ currentEscape.toFixed(1) + "\n #define INTERVALAS_PER_COLOR " 
		+ currentColorScale.toFixed(1).toString() + "\n #define NUM_COLORS " + numTextureColors.toFixed(1) 
		+ "\n " + document.getElementById('fragmentShader').textContent.replace("$INSERT$", parsedEquation);
	material.needsUpdate = true;
	
	renderImage(storedWeb3DApp);
}

function onEquationChanged()
{
	currentEquation = document.getElementById('input_equation').value;
};

function onIterationsChanged()
{
	var newValue = parseInt(document.getElementById('input_iterations').value);
	if(newValue == NaN){
		newValue = currentNumIterations;
	}
	currentNumIterations = newValue;
	document.getElementById('input_iterations').value = currentNumIterations.toString();
};

function onEscapeChanged()
{
	var newValue = parseInt(document.getElementById('input_escape').value);
	if(newValue == NaN){
		newValue = currentEscape;
	}
	currentEscape = newValue;
	document.getElementById('input_escape').value = currentEscape.toString();
};

function onColorScaleChanged(event)
{
	var newValue = parseInt(document.getElementById('input_color_scale').value);
	if(newValue == NaN || newValue < 1 || newValue > 100){
		newValue = currentColorScale;
	}
	currentColorScale = newValue;
	document.getElementById('input_color_scale').value = currentColorScale.toString();
};

function onPlayPause(event) {
	playing = !playing;
	icon = playing ? 'pause' : 'play';
	document.getElementById("playpause_icon").className = "fa fa-" + icon;
	event.preventDefault();
}

function onRewind(event) {
	time -= 1;
	document.getElementById('input_time').value = time.toFixed(3);
	oneOff = true;
	event.preventDefault();
}

function onTimeSet(event) {
	var newValue = parseFloat(document.getElementById('input_time').value);
	if(newValue == NaN){
		newValue = time;
	}
	time = newValue;
	document.getElementById('input_time').value = time.toFixed(3);
	oneOff = true;
	event.preventDefault();
}

function checkHeihgt()
{
	var menuHeight = document.getElementById('topmenu').style.height;
	var menuHeightInt = parseInt(menuHeight.replace('px',''));
	if(menuHeightInt > storedWeb3DApp.winHeight){
		storedWeb3DApp.winHeight = menuHeightInt;
		storedWeb3DApp.renderer.setSize(storedWeb3DApp.winWidth, storedWeb3DApp.winHeight);
	}
};

_initFunction = function(web3DApp) 
{
	storedWeb3DApp = web3DApp;
	
	uniforms = {
		minPoint: {type: "v2", value: new THREE.Vector2()},
		spaceArea: {type: "v2", value: new THREE.Vector2()},
		resolution: {type: "v2", value: new THREE.Vector2()},
		t: {type: "f", value: 0.0},
		texture: {type: "t", value: generateTexture()}
	};
	
	checkHeihgt();
	
	currAR = web3DApp.winHeight/web3DApp.winWidth;
	uniforms.resolution.value.x = web3DApp.winWidth;
	uniforms.resolution.value.y = web3DApp.winHeight;
	uniforms.t.value = time;

	material = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: "#define MAX_ITERATIONS 100.0\n#define ESCAPE_RADIUS 10000.0\n#define INTERVALAS_PER_COLOR 25.0\n #define NUM_COLORS 4.0\n " 
			+ document.getElementById('fragmentShader').textContent.replace("$INSERT$", parseEquation(jsep(currentEquation)))
	} );

	mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
	web3DApp.scene.add(mesh);
	
	lastTime = Date.now();
	
	zoomAcc = 0.001;

	document.getElementById('input_equation').addEventListener('blur', onEquationChanged, false);
	document.getElementById('input_iterations').addEventListener('blur', onIterationsChanged, false);
	document.getElementById('input_escape').addEventListener('blur', onEscapeChanged, false);
	document.getElementById('input_color_scale').addEventListener('blur', onColorScaleChanged, false);
	document.getElementById('input_recompile_shader').addEventListener('click', updateValues, false);
	document.getElementById('input_playpause').addEventListener('click', onPlayPause, false);
	document.getElementById('input_rewind').addEventListener('click', onRewind, false);
	document.getElementById('input_timeset').addEventListener('click', onTimeSet, false);
	document.getElementById('make_screenshot').addEventListener('click', screenshot, false);
	
	renderImage(web3DApp);
};

_updateFunction = function(web3DApp) 
{
	var currentTime = Date.now();
	var elapsed = currentTime - lastTime;
	lastTime = currentTime;
	
	if(zoomOut){
		currentZoom += zoomAcc * elapsed;
		zoomAcc = currentZoom / 1000.0;
	}else if(zoomIn){
		currentZoom -= zoomAcc * elapsed;
		zoomAcc = currentZoom / 1000.0;
	}
	
	if (needsTime && playing) {
		time += elapsed/1000.0;
		document.getElementById('input_time').value = time.toFixed(3);
	}
	uniforms.t.value = time;
	
	if (zoomIn || zoomOut || desplacement || (needsTime && playing) || oneOff) {
		renderImage(web3DApp);
		oneOff = false;
	}
};

_resizeFunction = function(web3DApp)
{
	checkHeihgt();
	
	currAR = web3DApp.winHeight/web3DApp.winWidth;
	uniforms.resolution.value.x = web3DApp.winWidth;
	uniforms.resolution.value.y = web3DApp.winHeight;
	
	renderImage(web3DApp);
};

_mousedownFunction = function(web3DApp, event)
{
	mouseLatsPos.x = (event.clientX/web3DApp.winWidth);
	mouseLatsPos.y = (event.clientY/web3DApp.winHeight);
	
	if ((event.which && (event.which == 3)) ||
		(event.button && (event.button == 2))){
		zoomOut = true;
	}
	else if ((event.which && (event.which == 1)) ||
		(event.button && (event.button == 0))){
		if(event.shiftKey){
			desplacement = true;
		}else{
			zoomIn = true;
		}
	}
};

_mouseupFunction = function(web3DApp, event)
{
	if ((event.which && (event.which == 3)) ||
		(event.button && (event.button == 2))){
		zoomOut = false;
	}
	else if ((event.which && (event.which == 1)) ||
		(event.button && (event.button == 0))){
		zoomIn = false;
		desplacement = false;
	}
};

_mousemoveFunction = function(web3DApp, event)
{
	if(zoomIn || zoomOut || desplacement){
		var newX = (event.clientX/web3DApp.winWidth);
		var dexpX = (mouseLatsPos.x - newX)*currentZoom;
		var newY = (event.clientY/web3DApp.winHeight);
		var dexpY = (newY - mouseLatsPos.y)*currentZoom*currAR;
		
		currentDesp.x += dexpX;
		currentDesp.y += dexpY;
		
		mouseLatsPos.x = newX;
		mouseLatsPos.y = newY;
	}
};