var SIZE = 501;
var W = SIZE + 2
var H = SIZE + 2
var add = 1/3.14159265358979;

var colormap = [
        [0.000, [1.00, 0.00, 0.16]],
        [0.030, [1.00, 0.00, 0.00]],
        [0.215, [1.00, 1.00, 0.00]],
        [0.400, [0.00, 1.00, 0.00]],
        [0.586, [0.00, 1.00, 1.00]],
        [0.770, [0.00, 0.00, 1.00]],
        [0.954, [1.00, 0.00, 1.00]],
        [1.000, [1.00, 0.00, 0.75]]
];

function getColorMap(map, val) {
	for (var i = 0; i < map.length - 1; i++) {
		if (map[i][0] <= val && map[i+1][0] >= val) {
			var flux = (val-map[i][0])/(map[i+1][0]-map[i][0]);
			var red = map[i][1][0] + flux * (map[i+1][1][0] - map[i][1][0]);
			var blue = map[i][1][1] + flux * (map[i+1][1][1] - map[i][1][1]);
			var green = map[i][1][2] + flux * (map[i+1][1][2] - map[i][1][2]);
			return [red*255, blue*255, green*255];
		}
	}
}

function drawImage(board, ctx, imgData) {
	for (var i = 0; i < SIZE + 2; i++) {
		for (var j = 0; j < SIZE + 2; j++) {
			var colors = getColorMap(colormap, board[i*W+j])
			imgData.data[4*(W*i+j)] = colors[0];
			imgData.data[4*(W*i+j)+1] = colors[1];
			imgData.data[4*(W*i+j)+2] = colors[2];
			imgData.data[4*(W*i+j)+3] = 255;
		}
	}
	ctx.putImageData(imgData, 0, 0);
}

window.onload = function() {
	var canvas = document.getElementsByTagName("canvas")[0];
	var ctx = canvas.getContext("2d");

	canvas.width = SIZE + 2;
	canvas.height = SIZE + 2;

	var imgData = ctx.getImageData(0, 0, W, H);

	var board = new Float64Array(W*W);	
	var altBoard = new Float64Array(W*W);

	board[(Math.floor(SIZE/2)+1)*W+Math.floor(SIZE/2)+1] = 1.0;
	console.log((Math.floor(SIZE/2)+1)*W+Math.floor(SIZE/2)+1)
	drawImage(board, ctx, imgData);

	// for (var it = 0; it < ITERS; it++) {
	// 	for (var i = 1; i < SIZE+1; i++) {
	// 		for (var j = 1; j < SIZE+1; j++) {
	// 			val = ((board[W*(i+1)+j]+board[W*(i-1)+j]+board[W*i+j+1]+board[W*i+j-1])/4.0 + add) % 1;
	// 			altBoard[W*i+j] = val;
	// 		}
	// 	}
	// 	var tmp = board;
	// 	board = altBoard;
	// 	altBoard = tmp;
	// 	drawImage(board, ctx, imgData);
	// }

	var c = setInterval(function() {
		for (var i = 1; i < SIZE+1; i++) {
			for (var j = 1; j < SIZE+1; j++) {
				val = ((board[W*(i+1)+j]+board[W*(i-1)+j]+board[W*i+j+1]+board[W*i+j-1])/4.0 + add) % 1;
				altBoard[W*i+j] = val;
			}
		}
		var tmp = board;
		board = altBoard;
		altBoard = tmp;
		drawImage(board, ctx, imgData);
	}, 100);
}
