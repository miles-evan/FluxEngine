import { GameObject } from "./GameObject.js";


export class Game {
	static _gameObjects: GameObject[] = [];
	static maxFrameRate: number = 60;
	static isRunning: boolean = false;
	static screen: Element = document.querySelector(".screen") as Element;
	static screenWidth: number = Number(Game.screen.clientWidth);
	static screenHeight: number = Number(Game.screen.clientHeight);
	private static keysDown: Record<Key, number> = {};
	private static lastFrameTimeStamp = 0;
	private static currentFrameTimeStamp = 0;
	static globalStep = () => {};
	
	
	static {
		document.addEventListener("keydown", event => {
			if(!(event.key in Game.keysDown))
				Game.keysDown[event.key] = Date.now();
		});
		document.addEventListener("keyup", event => {
			delete Game.keysDown[event.key];
		});
		document.addEventListener('touchstart', _ => {
			if(!("touch" in Game.keysDown))
				Game.keysDown["touch"] = Date.now();
		});
		document.addEventListener('touchend', _ => {
			delete Game.keysDown["touch"];
		});
	}
	
	
	static _addGameObjects(...gameObjects: GameObject[]): void {
		gameObjects.forEach(gameObject => Game._gameObjects.push(gameObject));
	}
	
	static _removeGameObject(gameObject: GameObject): void {
		gameObject._object.remove();
		Game._gameObjects = Game._gameObjects.filter(element => element !== gameObject);
	}
	
	static removeAllGameObjects(): void {
		Game._gameObjects.forEach(gameObject => gameObject._object.remove());
		Game._gameObjects = [];
	}
	
	
	static start(): void {
		if(Game.isRunning) return;
		Game.isRunning = true;
		Game.doSteps();
	}
	
	static stop(): void {
		Game.isRunning = false;
	}
	
	
	static objectCollidedWithType(gameObject: GameObject, type: GameObjectConstructor): boolean {
		return Game._gameObjects.some(other =>
			other instanceof type
			&& gameObject !== other
			&& gameObject.collidedWith(other)
		);
	}
	
	
	static isKeyDown(key: Key): boolean {
		return key in Game.keysDown;
	}
	
	static isKeyPressed(key: Key) {
		const timePressed: number | undefined = Game.keysDown[key];
		if(timePressed === undefined)
			return false;
		return timePressed >= Game.lastFrameTimeStamp && timePressed <= Game.currentFrameTimeStamp;
	}
	
	
	static get deltaTime(): number {
		if(Game.lastFrameTimeStamp === 0)
			return 1000 / Game.maxFrameRate;
		return Game.currentFrameTimeStamp - Game.lastFrameTimeStamp;
	}
	
	private static updateDeltaTime(): void {
		Game.lastFrameTimeStamp = Game.currentFrameTimeStamp;
		Game.currentFrameTimeStamp = Date.now();
	}
	
	
	private static doSteps() {
		Game.globalStep();
		Game._gameObjects.forEach(gameObject => gameObject.step());
		Game._gameObjects.forEach(gameObject => gameObject.updatePosition());
		Game.updateDeltaTime();
		if(Game.isRunning)
			setTimeout(Game.doSteps, Math.max(0, 1000 / Game.maxFrameRate - Game.deltaTime));
	}
}