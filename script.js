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
	engine.marked = [];
	for (var i = 0; i < engine.width; i++) {
		engine.marked[i] = [];
		for (var j = 0; j < engine.height; j++) {
			engine.marked[i].push(Number.MAX_VALUE);
		}
	}
	console.time(name);
	engine.dijkstra(this.x, this.y, 0);
	console.timeEnd(name);
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
	this.marked = [];
	for (var i = 0; i < this.width; i++) {
		this.marked[i] = [];
		for (var j = 0; j < this.height; j++) {
			this.marked[i].push(Number.MAX_VALUE);
		}
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
		return;
	}
	this.turns++;
	Engine.prototype.tick.apply(this);
};

HuntingSeason.prototype.dijkstra = function (i, j, value) {
	if (this.marked[i][j] < value) {
		return;
	}
	this.marked[i][j] = value;
	var surroundings = getSurroundings(this.grid, i, j);
	var toExplore = [];
	for (var k = 0; k < surroundings.free.length; k++) {
		var coords = surroundings.free[k];
		if ((value + 1) < this.marked[coords.x][coords.y]) {
			this.marked[coords.x][coords.y] = value + 1;
			toExplore.push(coords);
		}
	}
	for (var k = 0; k < toExplore.length; k++) {
		var coords = toExplore[k];
		this.dijkstra(coords.x, coords.y, value + 1);
	}
};

HuntingSeason.prototype.draw = function () {
	Engine.prototype.draw.apply(this);
	var lastColor;
	for (var i = 0; i < this.width; i++) {
		var column = i * GLOBAL.cellSize;
		for (var j = 0; j < this.height; j++) {
			if (!this.grid[i][j] || !this.grid[i][j].color) {
				if (this.marked[i][j] === Number.MAX_VALUE) {
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

window.onload = function () {
	var engine = new HuntingSeason(25, 25, 1, 2, 250);
	document.getElementById('startButton').onclick = function () {
		engine.draw();
		engine.tick();
		engine.draw();
	};
};