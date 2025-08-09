import { Game } from "./Game.js";


type ObjectOptions = {
	hitboxWidth?: number,
	hitboxHeight?: number,
	originX?: number,
	originY?: number
}


export abstract class GameObject {
	
	_object: HTMLDivElement;
	left: number = 0;
	top: number = 0;
	#width: number = 0;
	#height: number = 0;
	rotation: number = 0;
	_hitboxLeft: number = 0;
	_hitboxTop: number = 0;
	_hitboxRight: number = 0;
	_hitboxBottom: number = 0;
	originX: number;
	originY: number;
	
	
	constructor(x=0, y=0, width=0, height=0, sprite="",
	            { hitboxWidth, hitboxHeight, originX=0, originY=0 }: ObjectOptions = {}) {
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
	
	
	updatePosition(): void {
		this._object.style.left = this.left + "px";
		this._object.style.top = this.top + "px";
		this._object.style.transform = "rotate(" + this.rotation + "deg)";
	}
	
	
	get x(): number {
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
	
	
	collidedWith(other: GameObject) {
		return this.hitboxRight > other.hitboxLeft
			&& this.hitboxLeft < other.hitboxRight
			&& this.hitboxBottom > other.hitboxTop
			&& this.hitboxTop < other.hitboxBottom;
	}
	
	
	collidedWithType(type: GameObjectConstructor): boolean {
		return Game.objectCollidedWithType(this, type);
	}
	
	
	kill() {
		Game._removeGameObject(this);
	}
	
	
	abstract step(): void;
	
}
