# Chase

A multi agent hunting simulation where simple predators chase very stupid preys.

## Requirements

* A modern web browser with javascript enabled (other than IE 10)

## Run

Load chase.html in a web browser and tweak the settings in the form.
From the form, you should be able to set the area, the number of preys and predators as well as the number of wall blocks.
Bare in mind that the number of elements must be lower than the actual number of blocks the simulation grid can contain.
Once you have specified the settings for your simulation, click on the start button.

The simulation will then start running for the number of iterations you chose.

Please remember that the simulation only ends if all the preys have been caught by predators.
This means that if the randomly generated grid contains a unreachable prey, the simulation will not end.

## Implementation
The HuntingSeason engine relies on the core engine (defined in core.js).
The core engine already has functions to randomly ask each agent to run once on each turn and to render the state of the simulation.
You can pass function to the engine's tick method in order to gather results when every agents updates itself or at the end of the turn.
```javascript
var engine = new Engine(width, heigth, simulationDiv);
var onUpdate = function (agent) {};//Called when an agent has been updated
var onCompletion = function () {};//Called when all agents have been updated
engine.tick(onUpdate, onCompletion);
```   

HuntingSeason only implements a few extra functions to compute the distance to the nearest preys and display them on the grid.
