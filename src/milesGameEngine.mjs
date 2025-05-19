
//
// Light weight "game engine" that makes it easy to make some simple games
// Author: Miles Todtfeld
//
// IMPORTANT: this will only work if in the HTML you make a div with class="screen"
//
// Contains Game class responsible for storing and managing game objects
// Contains GameObject class in which you should extend in order to create objects that will appear on screen and will
// have "step" functions that run every frame.
//
// In order to add a game object to the scene, simply call new SomethingThatExtendsGameObject(...), and the superclass's
// constructor will handle adding itself to the Game class's listing.
//
// Any method or instance variable starting with _ is something that you can use but probably shouldn't. for example,
// every GameObject has a _object which holds the html element. You probably shouldn't interact directly with it, but
// if there's something you need to do that I haven't implemented, then go ahead.
//

export class Game {
    static _gameObjects = [];
    static maxFrameRate = 60;
    static isRunning = false;
    static screen = document.querySelector(".screen");
    static screenWidth = Number(Game.screen.clientWidth);
    static screenHeight = Number(Game.screen.clientHeight);
    static #keysDown = {};
    static #lastFrameTimeStamp = 0;
    static #currentFrameTimeStamp = 0;
    static globalStep = () => {};

    static {
        document.addEventListener("keydown", (event) => {
            if(!(event.key in Game.#keysDown))
                Game.#keysDown[event.key] = Date.now();
        });
        document.addEventListener("keyup", (event) => {
            delete Game.#keysDown[event.key];
        });
        document.addEventListener('touchstart', (event) => {
            if(!("touch" in Game.#keysDown))
                Game.#keysDown["touch"] = Date.now();
        });
        document.addEventListener('touchend', (event) => {
            delete Game.#keysDown["touch"];
        });
    }
    static _addGameObjects(...gameObjects) {
        gameObjects.forEach(gameObject => Game._gameObjects.push(gameObject));
    }
    static _removeGameObject(gameObject) {
        gameObject._object.remove();
        Game._gameObjects = Game._gameObjects.filter(element => element !== gameObject);
    }
    static removeAllGameObjects() {
        Game._gameObjects.forEach(gameObject => gameObject._object.remove());
        Game._gameObjects = [];
    }
    static start() {
        if(Game.isRunning) return;
        Game.isRunning = true;
        Game.#doSteps();
    }
    static stop() {
        Game.isRunning = false;
    }
    static objectCollidedWithType(gameObject, type) {
        for(const other of Game._gameObjects) {
            if(other.constructor.name === type && gameObject !== other && gameObject.collidedWith(other)) {
                return true;
            }
        }
        return false;
    }
    static isKeyDown(key) {
        return key in Game.#keysDown;
    }
    static isKeyPressed(key) {
        if(!(key in Game.#keysDown)) return false;
        const timePressed = Game.#keysDown[key];
        return timePressed >= Game.#lastFrameTimeStamp && timePressed <= Game.#currentFrameTimeStamp;
    }
    static get deltaTime() {
        if(Game.#lastFrameTimeStamp === 0) return 1000 / Game.maxFrameRate;
        return Game.#currentFrameTimeStamp - Game.#lastFrameTimeStamp;
    }
    static #updateDeltaTime() {
        Game.#lastFrameTimeStamp = Game.#currentFrameTimeStamp;
        Game.#currentFrameTimeStamp = Date.now();
    }
    static #doSteps() {
        Game.globalStep();
        Game._gameObjects.forEach(gameObject => {
            gameObject.step();
        });
        Game._gameObjects.forEach(gameObject => gameObject.updatePosition());
        Game.#updateDeltaTime();
        if(Game.isRunning) {
            setTimeout(Game.#doSteps, Math.max(0, 1000 / Game.maxFrameRate - Game.deltaTime));
        }
    }
}



// ----------------------------------------------------------



export class GameObject {
    _object;
    #width;
    #height;
    rotation = 0;
    _hitboxLeft;
    _hitboxTop;
    _hitboxRight;
    _hitboxBottom;
    constructor(x=0, y=0, width=0, height=0, sprite="", {hitboxWidth, hitboxHeight, originX=0, originY=0} = {}) {
        this._object = document.createElement("div");
        this._object.classList.add("game-object");
        this.originX = originX;
        this.originY = originY;
        this.x = x;
        this.y = y;
        this.updatePosition();
        this.width = width;
        this.height = height;
        this._object.style.backgroundImage = "url(" + sprite + ")";
        this.setHitbox(hitboxWidth, hitboxHeight);
        Game.screen.append(this._object);
        Game._addGameObjects(this);
    }
    updatePosition() {
        this._object.style.left = this.left + "px";
        this._object.style.top = this.top + "px";
        this._object.style.transform = "rotate(" + this.rotation + "deg)";
    }
    get x() {
        return this.left + this.originX;
    }
    set x(x) {
        this.left = x - this.originX;
    }
    get y() {
        return this.top + this.originY;
    }
    set y(y) {
        this.top = y - this.originY;
    }
    get right() {
        return this.left + this.width;
    }
    set right(right) {
        this.left = right - this.width;
    }
    get bottom() {
        return this.top + this.height;
    }
    set bottom(bottom) {
        this.top = bottom - this.height;
    }
    get width() {
        return this.#width;
    }
    set width(width) {
        this._hitboxLeft = this._hitboxLeft * width / this.width;
        this._hitboxRight = this._hitboxRight * width / this.width;
        this.#width = width;
        this._object.style.width = width + "px";
    }
    get height() {
        return this.#height;
    }
    set height(height) {
        this._hitboxTop = this._hitboxTop * height / this.height;
        this._hitboxBottom = this._hitboxBottom * height / this.height;
        this.#height = height;
        this._object.style.height = height + "px";
    }
    setHitbox(hitboxWidth=this.width, hitboxHeight=this.height)  {
        this._hitboxLeft = this.width/2 - hitboxWidth/2;
        this._hitboxTop = this.height/2 - hitboxHeight/2;
        this._hitboxRight = this._hitboxLeft + hitboxWidth;
        this._hitboxBottom = this._hitboxTop + hitboxHeight;
    }
    get hitboxLeft() {
        return this.left + this._hitboxLeft;
    }
    get hitboxTop() {
        return this.top + this._hitboxTop;
    }
    get hitboxRight() {
        return this.left + this._hitboxRight;
    }
    get hitboxBottom() {
        return this.top + this._hitboxBottom;
    }
    collidedWith(other) {
        return this.hitboxRight > other.hitboxLeft
            && this.hitboxLeft < other.hitboxRight
            && this.hitboxBottom > other.hitboxTop
            && this.hitboxTop < other.hitboxBottom;
    }
    collidedWithType(type) {
        return Game.objectCollidedWithType(this, type);
    }
    kill() {
        Game._removeGameObject(this);
    }
    step() {
        // implement in subclass
    }
}
