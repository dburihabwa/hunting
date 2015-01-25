var huntingEngine;
var intervalId;

function Wall(x, y) {
	Agent.call(this, x, y, '#888888');
}

Wall.prototype = Object.create(Agent.prototype);
Wall.prototype.constructor = Wall;

Wall.prototype.update = function (unusedEngine) {};

function Prey(x, y) {
	Agent.call(this, x, y, '#24D666');
}

Prey.prototype = Object.create(Agent.prototype);
Prey.prototype.constructor = Prey;

Prey.prototype.update = function (engine) {
	var surroundings = getSurroundings(engine.grid, this.x, this.y);
	if (surroundings.free.length > 0) {
		var random = Math.floor(Math.random() * surroundings.free.length);
		var cell = surroundings.free[random];
		engine.grid[cell.x][cell.y] = this;
		engine.grid[this.x][this.y] = null;
		this.x = cell.x;
		this.y = cell.y;
	}
	var name = 'prey(' + this.x + ', ' + this.y + ')';
	engine.dijkstra(this.x, this.y, 0);
};

function Predator(x, y) {
	Agent.call(this, x, y, '#E31B23');	
}

Predator.prototype = Object.create(Agent.prototype);
Predator.prototype.constructor = Predator;

Predator.prototype.update = function (engine) {
	var surroundings = getSurroundings(engine.grid, this.x, this.y);

	if (surroundings['#24D666'] && surroundings['#24D666'].length > 0) {
		var targetCell = surroundings['#24D666'][0];
		var prey = engine.grid[targetCell.x][targetCell.y];
		engine.agents[engine.agents.indexOf(prey)] = null;
		engine.preys--;
		engine.grid[targetCell.x][targetCell.y] = this;
		engine.grid[this.x][this.y] = null;
		this.x = targetCell.x;
		this.y = targetCell.y;
		return;
	}
	if (surroundings.free.length > 0) {
		var mostValuableCell = {'x' : this.x, 'y': this.y};
		var bestValue = Number.MAX_VALUE;
		for (var i = 0; i < surroundings.free.length; i++) {
			var cell = surroundings.free[i];
			if (engine.marked[cell.x][cell.y] < bestValue) {
				mostValuableCell = cell;
				bestValue = engine.marked[cell.x][cell.y];
			}
		}
		engine.grid[mostValuableCell.x][mostValuableCell.y] = this;
		engine.grid[this.x][this.y] = null;
		this.x = mostValuableCell.x;
		this.y = mostValuableCell.y;
	}

};

function HuntingSeason(width, height, preys, predators, walls) {
	Engine.call(this, width, height, 'simulation');
	this.preys = preys;
	this.predators = predators;
	this.walls = walls;
	this.marked = new Array(this.width);
	for (var i = 0; i < this.width; i++) {
		this.marked[i] = new Array(this.height);
	}
	this.turns = 0;
	this.place();
}

HuntingSeason.prototype = Object.create(Engine.prototype);
HuntingSeason.prototype.constructor = HuntingSeason;

HuntingSeason.prototype.place = function () {
	var i = 0, x, y;
	while (i < this.walls) {
		while (true) {
			x = Math.floor(Math.random() * this.width);
			y = Math.floor(Math.random() * this.height);
			if (!this.grid[x][y]) {
				this.grid[x][y] = new Wall(x, y);
				this.agents.push(this.grid[x][y]);
				i++;
				break;
			}
		}
	}
	i = 0;
	while (i < this.preys) {
		while (true) {
			x = Math.floor(Math.random() * this.width);
			y = Math.floor(Math.random() * this.height);
			if (!this.grid[x][y]) {
				this.grid[x][y] = new Prey(x, y);
				this.agents.push(this.grid[x][y]);
				i++;
				break;
			}
		}
	}
	i = 0;
	while (i < this.predators) {
		while (true) {
			x = Math.floor(Math.random() * this.width);
			y = Math.floor(Math.random() * this.height);
			if (!this.grid[x][y]) {
				this.grid[x][y] = new Predator(x, y);
				this.agents.push(this.grid[x][y]);
				i++;
				break;
			}
		}
	}
};

HuntingSeason.prototype.tick = function () {
	if (this.preys === 0) {
		console.log('Done after ' + this.turns + ' turns!');
		stopSimulation();
		return;
	}
	this.turns++;
	this.marked = new Array(this.width);
	for (var i = 0; i < this.width; i++) {
		this.marked[i] = new Array(this.height);
	}
	Engine.prototype.tick.apply(this);
};

HuntingSeason.prototype.dijkstra = function (i, j, value) {
	var levels = [];
	this.marked[i][j] = value;
	levels.push([{'x': i, 'y': j }]);
	var level;
	while (true) {
		level = levels.length - 1;
		value++;
		var neighbors = [];
		for (var k = 0; k < levels[level].length; k++) {
			var cell = levels[level][k];
			var unmarkedFree = getUnmarkedFree(this, cell.x, cell.y);
			for (var l = 0; l < unmarkedFree.length; l++) {
				var c = unmarkedFree[l];
				this.marked[c.x][c.y] = value;
			}
			neighbors = neighbors.concat(unmarkedFree);
		}
		if (neighbors.length === 0) {
			break;
		}
		levels.push(neighbors);
	}
};

function getUnmarkedFree(engine, i, j) {
	return getSurroundings(engine.grid, i, j).free.filter(function (cell) {
		return typeof engine.marked[cell.x][cell.y] !== 'number';
	});
}


HuntingSeason.prototype.draw = function () {
	Engine.prototype.draw.apply(this);
	var lastColor;
	for (var i = 0; i < this.width; i++) {
		var column = i * GLOBAL.cellSize;
		for (var j = 0; j < this.height; j++) {
			if (!this.grid[i][j] || !this.grid[i][j].color) {
				if (typeof this.marked[i][j] !== 'number') {
					continue;
				}
				context.fillStyle = '#000000';
				lastColor = '#000000';
				context.fillText(this.marked[i][j], column, (j + 1) * GLOBAL.cellSize);
				continue;
			}
			if (lastColor !== this.grid[i][j].color) {
				context.fillStyle = this.grid[i][j].color;
				lastColor = this.grid[i][j].color;
			}
			context.fillRect(column, j * GLOBAL.cellSize, GLOBAL.cellSize, GLOBAL.cellSize);
		}
	}
};

function tick() {
	huntingEngine.tick();
	huntingEngine.draw();
}

function startSimulation() {
	intervalId = setInterval(function () {
		tick();
	}, 20);
}

function stopSimulation() {
	if (intervalId) {
		clearInterval(intervalId);
	}
	var tickButton = document.getElementById('tick');
	tickButton.hidden = true;
	var startButton = document.getElementById('start');
	startButton.hidden = true;
}

window.onload = function () {
	document.getElementById('settings').onsubmit = function () {
		var x = parseInt(document.getElementById('x').value, 10);
		var y = parseInt(document.getElementById('y').value, 10);
		var walls = parseInt(document.getElementById('walls').value, 10);
		var predators = parseInt(document.getElementById('predators').value, 10);
		if ((walls + predators) > (x * y)) {
			alert('Too many elements and not enough place on the grid!');
			return false;
		}
		huntingEngine = new HuntingSeason(x, y, 1, predators, walls);		
		var tickButton = document.getElementById('tick');
		tickButton.onclick = tick;
		tickButton.hidden = false;
		var startButton = document.getElementById('start');
		startButton.onclick = startSimulation;
		startButton.hidden = false;
		huntingEngine.draw();
		return false;
	};
};