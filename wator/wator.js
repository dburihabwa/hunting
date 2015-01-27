var intervalId = null;
var turns = 0;

function Animal(x, y, color, gestation) {
	Agent.call(this, x, y, color);
	this.gestation = gestation;
	this.age = 0;
}

Animal.prototype = Object.create(Agent.prototype);
Animal.prototype.constructor = Animal;

Animal.prototype.update = function (engine) {
	this.age++;
	this.gestation--;
};


function Shark(x, y) {
	Animal.call(this, x, y, '#CFCFCF', 10);
	this.starvation = 3;
}

Shark.prototype = Object.create(Animal.prototype);
Shark.prototype.constructor = Shark;

Shark.prototype.update = function (engine) {
	var surroundings = getAnimalSurroundings(engine.grid, this.x, this.y);
	var next, coord, length;
	if (this.gestation === 0) {
		this.gestation = 10;
		if (surroundings.free.length > 0) {
			length = surroundings.free.length;
			next = Math.floor(Math.random() * length);
			coord = {
				x: surroundings.free[next].x,
				y: surroundings.free[next].y
			};
			engine.grid[coord.x][coord.y] = new Shark(coord.x, coord.y);
			surroundings.free.splice(next, 1);
			engine.sharks++;
		}
	}
	if (surroundings.tunas.length !== 0) {
		length = surroundings.tunas.length;
		next = Math.floor(Math.random() * length);
		coord = {
			x: surroundings.tunas[next].x,
			y: surroundings.tunas[next].y
		};
		engine.agents[engine.agents.indexOf(engine.grid[coord.x][coord.y])] = null;
		engine.grid[coord.x][coord.y] = this;
		engine.grid[this.x][this.y] = null;
		this.starvation = 3;
		this.x = coord.x;
		this.y = coord.y;
		engine.tunas--;
	} else if (!this.starvation || this.starvation <= 0) {
		engine.grid[this.x][this.y] = null;
		engine.sharks--;
		return;
	} else if (surroundings.free.length !== 0) {
		length = surroundings.free.length;
		next = Math.floor(Math.random() * length);
		coord = {
			x: surroundings.free[next].x,
			y: surroundings.free[next].y
		};
		engine.grid[coord.x][coord.y] = engine.grid[this.x][this.y];
		engine.grid[this.x][this.y] = null;
		this.starvation--;
		this.x = coord.x;
		this.y = coord.y;
	} else {
		this.starvation--;
	}
	Animal.prototype.update.apply(this, engine);
};

function Tuna(x, y) {
	Animal.call(this, x, y, '#F28466', 3);
}

Tuna.prototype = Object.create(Agent.prototype);
Tuna.prototype.constructor = Tuna;

Tuna.prototype.update = function (engine) {
	var surroundings = getAnimalSurroundings(engine.grid, this.x, this.y);
	var coord, next;
	if (this.gestation === 0) {
		this.gestation = 3;
		if (surroundings.free.length > 0) {
			var length = surroundings.free.length;
			next = Math.floor(Math.random() * length);
			coord = {
				x: surroundings.free[next].x,
				y: surroundings.free[next].y
			};
			engine.grid[coord.x][coord.y] = new Tuna(coord.x, coord.y);
			surroundings.free.splice(next, 1);
			engine.tunas++;
		}
	}
	if (surroundings.free.length !== 0) {
		var length = surroundings.free.length;
		next = Math.floor(Math.random() * length);
		coord = {
			x: surroundings.free[next].x,
			y: surroundings.free[next].y
		};
		engine.grid[coord.x][coord.y] = this;
		engine.grid[this.x][this.y] = null;
		this.x = coord.x;
		this.y = coord.y;
	}
	Animal.prototype.update.apply(this, engine);
};

function Wator(width, height, sharks, tunas) {
	Engine.call(this, width, height, 'simulation');
	this.population = [];
	this.ratio = [];
	this.agePyramid = {};
	this.sharks = sharks;
	this.tunas = tunas;
	var i, j;
	while (tunas > 0) {
		while (true) {
			i = Math.floor(Math.random() * width);
			j = Math.floor(Math.random() * height);
			if (!(this.grid[i][j] instanceof Tuna) && !(this.grid[i][j] instanceof Shark)) {
				break;	
			}
		}
		var tuna = new Tuna(i, j);
		this.grid[i][j] = tuna;
		tunas--;
	}
	while (sharks > 0) {
		while (true) {
			i = Math.floor(Math.random() * width);
			j = Math.floor(Math.random() * height);
			if (!(this.grid[i][j] instanceof Tuna) && !(this.grid[i][j] instanceof Shark)) {
				break;	
			}
		}
		var shark = new Shark(i, j);
		this.grid[i][j] = shark;
		sharks--;
	}
	this.draw();
	var engine = this;
	this.onUpdate = function (agent) {
		if (!agent) {
			return;
		}
		var typeKey = null;
		if (agent instanceof Shark) {
			typeKey = 'shark';
		} else {
			typeKey = 'tuna';
		}
		var ageGroup = engine.agePyramid[agent.age];
		if (!ageGroup) {
			ageGroup = {
				'shark': 0,
				'tuna': 0
			};
		}
		ageGroup[typeKey] = ageGroup[typeKey] + 1;
		engine.agePyramid[agent.age] = ageGroup;
	};
}

Wator.prototype = Object.create(Engine.prototype);
Wator.prototype.constructor = Wator;

Wator.prototype.tick = function () {
	this.agents = [];
	this.agePyramid = {};
	turns++;
	for (var i = 0; i < this.grid.length; i++) {
		for (var j = 0; j < this.grid[i].length; j++) {
			var agent = this.grid[i][j];
			if (agent instanceof Shark || agent instanceof Tuna) {
				this.agents.push(agent);
			}
		}
	}
	Engine.prototype.tick.call(this, this.onUpdate);

	var textArea = document.getElementById('ageDump');
	var pyramid = '';
	var ages = Object.keys(this.agePyramid).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
	for (var i = 0; i < ages.length; i++) {
		var a = ages[i];
		pyramid += a + '\t' + this.agePyramid[a].shark + '\t' + this.agePyramid[a].tuna + '\n';
	}
	textArea.innerHTML = pyramid;
	this.population.push([turns, this.sharks, this.tunas]);
	this.ratio.push([this.sharks, this.tunas]);
	if (this.sharks === 0 || this.tunas === 0) {
		this.drawPopulation();
		this.drawRatio();
		try {
			this.drawAge();
		} catch (error) {
			console.trace(error);
		}
		var startButton = document.getElementById('startButton');
		startButton.onclick = startSimulation;
		startButton.innerHTML = 'Start';
		console.log('End of simulation after ' + turns + ' turns (sharks = ' + this.sharks + ', tunas = ' + this.tunas + ')');
		clearInterval(intervalId);
	}
};

Wator.prototype.drawPopulation = function () {
	var data = this.population;
	var g = new Dygraph(document.getElementById('population'),
		data,
		{
			'title': 'Population de requins et de thons',
			'labels': ['turns', 'sharks', 'tunas']
		}
	);
	var dump = '';
	this.population.forEach(function (element){
		dump += element.join('\t') + '\n';
	});
	document.getElementById('populationDump').innerHTML = dump;
};

Wator.prototype.drawRatio = function () {
	var data = this.ratio;
	var g = new Dygraph (document.getElementById('ratio'),
		data,
		{
			'title': 'Ratio requins/thons',
			'drawPoints': true,
			'width': 1000
		}
	);
	var dump = '';
	this.ratio.forEach(function (element) {
		dump += element.join('\t') + '\n';
	});

	document.getElementById('ratioDump').innerHTML = dump;
};

Wator.prototype.drawAge = function () {
	var ageCategories = Object.keys(this.agePyramid).map(function (element) { return element + '';});
	var sharkAges = [];
	var tunaAges = [];
	var engineAge = this.agePyramid;
	var max = -1;
	ageCategories.forEach(function (age) {
		if (engineAge[age].shark > max) {
			max = engineAge[age].shark;
		}
		sharkAges.push(engineAge[age].shark);
		tunaAges.push(engineAge[age].tuna * -1);		
		if (engineAge[age].tuna > max) {
			max = engineAge[age].tuna;
		}
	});
    var categories = ageCategories;
    $('#pyramid').highcharts({
        chart: {
            type: 'bar'
        },
        title: {
            text: 'AgeGroups'
        },
        xAxis: [{
            categories: categories,
            reversed: false,
            labels: {
                step: 1
            }
        }, {
            opposite: true,
            reversed: false,
            categories: categories,
            linkedTo: 0,
            labels: {
                step: 1
            }
        }],
        yAxis: {
            title: {
                text: null
            },
            min: (max * - 1),
            max: max
        },

        plotOptions: {
            series: {
                stacking: 'normal'
            }
        },

        series: [{
            name: 'Shark',
            data: sharkAges
        }, {
            name: 'Tuna',
            data: tunaAges
        }]
    });
};

/**
 * List the cells surrounding cell (i, j) sorting them into 3 classes: free, tunas and sharks.
 * @parm {array[array]} grid - Grid
 * @param {Integer} i - First dimension coordinate
 * @param {Integer} j - Second dimension coordianate
 * @return {Object} - An object classifying the cells surrounding grid[i][j] in free, tunas and sharks.
 */
function getAnimalSurroundings(grid, i, j) {
	var surroundings = {
		'free': [],
		'tunas': [],
		'sharks': []
	};
	for (var k = i - 1; k <= i + 1; k++) {
		if (k < 0 || k >= grid.length) {
			continue;
		}
		for (var l = j - 1; l <= j + 1; l++) {
			if (l < 0 || l >= grid[i].length) {
				continue;
			}
			if (i === k && j === l) {
				continue;
			}
			var cell = {'x': k, 'y': l};
			if (grid[k][l] instanceof Shark) {
				surroundings.sharks.push(cell);
			} else if (grid[k][l] instanceof Tuna) {
				surroundings.tunas.push(cell);
			} else {
				surroundings.free.push(cell);						
			}
		}
	}
	return surroundings;
}


function shuffle(o) {
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function startSimulation(event) {
	var divSimulation = document.getElementById('simulation');
	while (divSimulation.firstChild) {
		divSimulation.removeChild(divSimulation.firstChild);
	}
	var x = parseInt(document.getElementById('engine.x').value, 10);
	var y = parseInt(document.getElementById('engine.y').value, 10);
	var sharks = parseInt(document.getElementById('engine.sharks').value, 10)
	var tunas = parseInt(document.getElementById('engine.tunas').value, 10);
	var engine = new Wator(x, y, sharks, tunas);
	var startButton = document.getElementById('startButton');
	var pauseSimulation = function () {
		this.innerHTML = 'Resume';
		clearInterval(intervalId);
		this.onclick = resumeSimulation;
		engine.drawPopulation();
		engine.drawRatio();
		engine.drawAge();
		return false;
	};
	var resumeSimulation = function () {
		this.innerHTML = 'Pause';
		this.onclick = pauseSimulation;
		intervalId = setInterval(function () {
			engine.draw();
			engine.tick();
		}, 10);
		return false;
	};
	startButton.onclick = resumeSimulation;
	startButton.onclick();
	return false;
}

window.onload = function () {
	document.getElementById('settings').onsubmit = startSimulation;
};