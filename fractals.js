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
var currentColorScale = 25.0;
var numTextureColors = 4;
var textureSize = 256;
var currentPalette = 1;
var currentTextureFiltering = false;
var currAR = 1.0;
var currentZoom = 3.5;
var currentDesp = {
		"x" : 0.0,
		"y" : 0.0
	};
var currentRealSeed = 0.0;
var currentImaginarySeed = 0.0;
var randomAnimation = false;
var animationValues = {
		"x" : 0.0,
		"y" : 0.0
	};

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
funcs.sinh = ['csinh', 1];
funcs.gamma = ['cgamma', 1];
function parseEquation(eq) {
	if (eq.type == 'Literal') {
		if (eq.imag) {
			return `vec2(0, ${eq.value.toFixed(1)})`;
		}
		if (eq.value == 'i') {
			return 'vec2(0, 1)';
		}
		return eq.value.toFixed(1);
	}
	if (eq.type == 'Identifier') {
		if (eq.name != 'z' && eq.name != 'c') {
			throw new Error(`Translation error: variable must be z or c (got ${eq.name})`)
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
	
	var colorTable;
	if(currentPalette == 1){
		colorTable= [0.0, 0.392156862745098, 0.0, 1.0, 
					 0.3450980392156863, 0.7372549019607844, 0.0, 1.0,
					 1.0, 0.8862745098039215, 0.0, 1.0,
					 1.0, 0.4, 0.0, 1.0];
	}else if(currentPalette == 2){
		colorTable= [0.0, 0.1, 0.0, 1.0, 
					 0.5, 0.2, 0.0, 1.0,
					 1.0, 0.5, 0.0, 1.0,
					 1.0, 0.0, 0.0, 1.0];
	}else if(currentPalette == 3){
		colorTable= [0.0, 0.05, 0.5, 1.0, 
					 0.75, 1.0, 1.0, 1.0,
					 1.0, 0.75, 0.1, 1.0,
					 0.35, 0.0, 0.35, 1.0];
	}
		
	var canvas = document.createElement( 'canvas' );
	canvas.width = textureSize;
	canvas.height = 1;
	var context = canvas.getContext('2d');
	var chunkSize = textureSize/numTextureColors;
	for( var x = 0; x < textureSize; x++ ){
		
		var index = Math.floor(x/chunkSize)%numTextureColors;
		var percent = (x/chunkSize)%1;
		var color1 = [colorTable[index*4], colorTable[(index*4)+1], colorTable[(index*4)+2], colorTable[(index*4)+3]];
		index = (index+1)%numTextureColors;
		var color2 = [colorTable[index*4], colorTable[(index*4)+1], colorTable[(index*4)+2], colorTable[(index*4)+3]];
		var finalColor = [
			((color1[0]*(1.0-percent)) + (color2[0]*percent))*255.0, 
			((color1[1]*(1.0-percent)) + (color2[1]*percent))*255.0, 
			((color1[2]*(1.0-percent)) + (color2[2]*percent))*255.0, 
			((color1[3]*(1.0-percent)) + (color2[3]*percent))];
		var colorStr = 'rgba(' + Math.floor(finalColor[0]).toString() + ',' 
				+ Math.floor(finalColor[1]).toString() + ','
				+ Math.floor(finalColor[2]).toString() + ','
				+ finalColor[3].toFixed(2).toString()  + ')';
		context.fillStyle = colorStr;
		context.fillRect( x, 0, 1, 1 );
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
	material.fragmentShader = "#define MAX_ITERATIONS " + currentNumIterations.toFixed(1).toString() + "\n #define INTERVALAS_PER_COLOR " 
		+ currentColorScale.toFixed(1).toString() + "\n #define NUM_COLORS " + numTextureColors.toFixed(1).toString() 
		+ "\n " + document.getElementById('fragmentShader').textContent.replace("$INSERT$", parseEquation(jsep(currentEquation)));
	material.needsUpdate = true;
	
	renderImage(storedWeb3DApp);
}

function realNumberChanged(){
	var newValue = parseFloat(document.getElementById('input_seed_real').value);
	if(newValue == NaN){
		newValue = currentRealSeed;
	}
	currentRealSeed = newValue;
	document.getElementById('input_seed_real').value = currentRealSeed.toString();
	uniforms.seed.value.x = currentRealSeed;
	renderImage(storedWeb3DApp);
}

function imaginaryNumberChanged(){
	var newValue = parseFloat(document.getElementById('input_seed_imaginary').value);
	if(newValue == NaN){
		newValue = currentImaginarySeed;
	}
	currentImaginarySeed = newValue;
	document.getElementById('input_seed_imaginary').value = currentImaginarySeed.toString();
	uniforms.seed.value.y = currentImaginarySeed;
	renderImage(storedWeb3DApp);
}


function onRandomAnimationClick(){
	randomAnimation = !randomAnimation;
	
	if(randomAnimation){
		currentRealSeed = 0.0;
		currentImaginarySeed = 0.0;
		animationValues.x = Math.random();
		animationValues.x = ((animationValues.x*2.0)-1.0)*0.001;
		animationValues.y = ((Math.random()*2.0)-1.0)*0.001;
		document.getElementById('random_animation').className = "radio_select";
	}else{
		document.getElementById('random_animation').className = "radio_no_select";
	}
}

function palette1Sel(){
	document.getElementById('palette_1_radio').className = "radio_select";
	document.getElementById('palette_2_radio').className = "radio_no_select";
	document.getElementById('palette_3_radio').className = "radio_no_select";
	currentPalette = 1;
	uniforms.texture.value = generateTexture();
	renderImage(storedWeb3DApp);
}

function palette2Sel(){
	document.getElementById('palette_1_radio').className = "radio_no_select";
	document.getElementById('palette_2_radio').className = "radio_select";
	document.getElementById('palette_3_radio').className = "radio_no_select";
	currentPalette = 2;
	uniforms.texture.value = generateTexture();
	renderImage(storedWeb3DApp);
}

function palette3Sel(){
	document.getElementById('palette_1_radio').className = "radio_no_select";
	document.getElementById('palette_2_radio').className = "radio_no_select";
	document.getElementById('palette_3_radio').className = "radio_select";
	currentPalette = 3;
	uniforms.texture.value = generateTexture();
	renderImage(storedWeb3DApp);
}

function texFiltering(){
	currentTextureFiltering = !currentTextureFiltering;
	if(currentTextureFiltering){
		document.getElementById('texture_filtering').className = "radio_select";
	}else{
		document.getElementById('texture_filtering').className = "radio_no_select";
	}
	uniforms.texture.value = generateTexture();
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

function onColorScaleChanged(event)
{
	var newValue = parseInt(document.getElementById('input_color_scale').value);
	if(newValue == NaN || newValue < 1 || newValue > 100){
		newValue = currentColorScale;
	}
	currentColorScale = newValue;
	document.getElementById('input_color_scale').value = currentColorScale.toString();
};

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
		seed: {type: "v2", value: new THREE.Vector2()},
		texture: {type: "t", value: generateTexture()}
	};
	
	checkHeihgt();
	
	currAR = web3DApp.winHeight/web3DApp.winWidth;
	uniforms.resolution.value.x = web3DApp.winWidth;
	uniforms.resolution.value.y = web3DApp.winHeight;
	uniforms.seed.value.x = currentRealSeed;
	uniforms.seed.value.y = currentImaginarySeed;

	material = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: "#define MAX_ITERATIONS 100.0\n #define INTERVALAS_PER_COLOR 25.0\n #define NUM_COLORS 4.0\n " 
			+ document.getElementById('fragmentShader').textContent.replace("$INSERT$", parseEquation(jsep(currentEquation)))
	} );

	mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
	web3DApp.scene.add(mesh);
	
	lastTime = Date.now();
	
	zoomAcc = 0.001;

	document.getElementById('input_equation').addEventListener('blur', onEquationChanged, false);
	document.getElementById('input_iterations').addEventListener('blur', onIterationsChanged, false);
	document.getElementById('input_color_scale').addEventListener('blur', onColorScaleChanged, false);
	document.getElementById('palette_1_radio').addEventListener('click', palette1Sel, false);
	document.getElementById('palette_2_radio').addEventListener('click', palette2Sel, false);
	document.getElementById('palette_3_radio').addEventListener('click', palette3Sel, false);
	document.getElementById('input_recompile_shader').addEventListener('click', updateValues, false);
	document.getElementById('texture_filtering').addEventListener('click', texFiltering, false);
	document.getElementById('make_screenshot').addEventListener('click', screenshot, false);
	
	var inputRealSeed = document.getElementById('input_seed_real');
	if(inputRealSeed != undefined){
		inputRealSeed.addEventListener('blur', realNumberChanged, false);
	}
	
	var inputImaginarySeed = document.getElementById('input_seed_imaginary');
	if(inputImaginarySeed != undefined){
		inputImaginarySeed.addEventListener('blur', imaginaryNumberChanged, false);
	}
	
	var animateSeed = document.getElementById('random_animation');
	if(animateSeed != undefined){
		animateSeed.addEventListener('click', onRandomAnimationClick, false);
	}
	
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
	
	if(randomAnimation){
		elapsed = elapsed*0.1;
		currentRealSeed += animationValues.x * elapsed;
		currentImaginarySeed += animationValues.y * elapsed;
		
		document.getElementById('input_seed_real').value = currentRealSeed.toString();
		document.getElementById('input_seed_imaginary').value = currentImaginarySeed.toString();
		
		uniforms.seed.value.x = currentRealSeed;
		uniforms.seed.value.y = currentImaginarySeed;
	}
	
	if(zoomIn || zoomOut || desplacement || randomAnimation){
		renderImage(web3DApp);
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