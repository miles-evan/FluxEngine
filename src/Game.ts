import type GameObject from "./GameObject.ts";


export default class Game {
	static _gameObjects: GameObject[] = [];
	static instanceCount: number = 0;
	static _instanceCounts: Record<string, number> = {};
	static maxFrameRate: FramesPerSecond = 60;
	static isRunning: boolean = false;
	static _screen: HTMLElement | null;
	static screenWidth: Pixels;
	static screenHeight: Pixels;
	static mouseX: Pixels;
	static mouseY: Pixels;
	static lockPositionsToVirtualPixels: boolean = false;
	private static keysDown: Record<Key, Time> = {};
	private static lastFrameTimeStamp: Time = 0;
	private static currentFrameTimeStamp: Time = 0;
	private static timeoutId: number | null = null;
	private static onKeyDown: (e: KeyboardEvent) => void;
	private static onKeyUp: (e: KeyboardEvent) => void;
	private static onTouchStart: (e: TouchEvent) => void;
	private static onTouchEnd: (e: TouchEvent) => void;
	private static onMouseMove: (e: MouseEvent) => void;
	static #frameCount: number = 0;
	static globalSteps: AnyFunction[] = [];
	static #timeStart: Time = 0;
	
	
	static init(screen: HTMLElement): boolean {
		if(Game._screen) return false;
		
		Game._screen = screen;
		Game.screenWidth = screen.clientWidth;
		Game.screenHeight = screen.clientHeight;
		screen.style.position = "relative";
		screen.style.overflow = "hidden";
		screen.style.position = "relative";
		
		Game.onKeyDown = (e: KeyboardEvent): void => {
			if(!(e.key in Game.keysDown))
				Game.keysDown[e.key as Key] = Date.now();
		};
		Game.onKeyUp = (e: KeyboardEvent): void => {
			delete Game.keysDown[e.key as Key];
		};
		Game.onTouchStart = (): void => {
			if(!("touch" in Game.keysDown))
				Game.keysDown["touch"] = Date.now();
		};
		Game.onTouchEnd = (): void => {
			delete Game.keysDown["touch"];
		};
		Game.onMouseMove = (e: MouseEvent): void => {
			const rect: DOMRect = screen.getBoundingClientRect();
			Game.mouseX = (e.clientX - rect.left) / Game.virtualScreenSizeMultiplier;
			Game.mouseY = (e.clientY - rect.top) / Game.virtualScreenSizeMultiplier;
		}
		window.addEventListener("keydown", Game.onKeyDown);
		window.addEventListener("keyup", Game.onKeyUp);
		screen.addEventListener("touchstart", Game.onTouchStart);
		screen.addEventListener("touchend", Game.onTouchEnd);
		screen.addEventListener('mousemove', Game.onMouseMove);
		
		return true;
	}
	
	static destroy(): boolean {
		Game.stop();
		if(!Game._screen) return false;
		window.removeEventListener("keydown", Game.onKeyDown);
		window.removeEventListener("keyup", Game.onKeyUp);
		Game._screen.removeEventListener("touchstart", Game.onTouchStart);
		Game._screen.removeEventListener("touchend", Game.onTouchEnd);
		Game._screen.removeEventListener("mousemove", Game.onMouseMove);
		Game._screen = null;
		Game._gameObjects.forEach(gameObject => gameObject.destroy());
		Game._gameObjects = [];
		Game._instanceCounts = {};
		Game.instanceCount = 0;
		return true;
	}
	
	
	static _appendGameObject(gameObject: GameObject): void {
		Game.instanceCount ++;
		Game._instanceCounts[gameObject.constructor.name] =
			1 + (Game._instanceCounts[gameObject.constructor.name] ?? 0);
		Game._gameObjects.push(gameObject);
	}
	
	static _popGameObject(gameObject: GameObject): void {
		Game.instanceCount --;
		Game._instanceCounts[gameObject.constructor.name] =
			-1 + (Game._instanceCounts[gameObject.constructor.name] ?? 0);
		gameObject._object.remove();
		Game._gameObjects = Game._gameObjects.filter(element => element !== gameObject);
	}
	
	
	static start(): boolean {
		if(Game.isRunning) return false;
		Game.isRunning = true;
		Game.#timeStart = Date.now();
		Game.doSteps();
		return true;
	}
	
	static stop(): void {
		Game.isRunning = false;
		if(Game.timeoutId) {
			clearTimeout(Game.timeoutId);
			Game.timeoutId = null;
		}
	}
	
	
	static objectCollidedWithType(
		gameObject: GameObject, type: Constructor<GameObject>, x?: Pixels, y?: Pixels
	): boolean {
		
		return gameObject.withTempPosition(x, y, () => {
			return Game._gameObjects.some(other =>
				other instanceof type
				&& gameObject !== other
				&& gameObject.collidedWith(other));
		})
	}
	
	static getObjectsCollisionsWithType<T extends GameObject>(
		gameObject: GameObject, type: Constructor<T>, x?: Pixels, y?: Pixels
	): T[] {
		
		return gameObject.withTempPosition(x, y, () => {
			const objectsCollidedWith: T[] = [];
			Game._gameObjects.forEach(other => {
				if(other instanceof type
					&& gameObject !== other
					&& gameObject.collidedWith(other))
					objectsCollidedWith.push(other);
			});
			return objectsCollidedWith;
		});
	}
	
	
	static isKeyDown(key: Key): boolean {
		return key in Game.keysDown;
	}
	
	static isKeyPressed(key: Key): boolean {
		const timePressed: Time | undefined = Game.keysDown[key];
		if(timePressed === undefined)
			return false;
		return Game.justHappened(timePressed);
	}
	
	
	static get virtualScreenSizeMultiplier(): number {
		if(!Game._screen)
			throw new Error("Must initialize screen");
		return Game._screen.clientHeight / Game.screenHeight;
	}
	
	
	// milliseconds since last frame
	static get deltaTime(): Milliseconds {
		return Game.lastFrameTimeStamp?
			Game.currentFrameTimeStamp - Game.lastFrameTimeStamp
			: 1000 / Game.maxFrameRate;
	}
	
	private static updateDeltaTime(): void {
		Game.lastFrameTimeStamp = Game.currentFrameTimeStamp;
		Game.currentFrameTimeStamp = Date.now();
	}
	
	
	// in milliseconds
	static get timeSinceStart(): Milliseconds {
		return Date.now() - Game.#timeStart;
	}
	
	
	// returns whether a time occured between the last frame and current frame
	static justHappened(time: Time): boolean {
		return time >= Game.lastFrameTimeStamp && time <= Game.currentFrameTimeStamp;
	}
	
	
	static get frameCount(): number {
		return Game.#frameCount;
	}
	
	
	static getInstanceCount<T extends GameObject>(type: Constructor<T>): number {
		return Game._instanceCounts[type.name] ?? 0;
	}
	
	
	// repeatables are functions that get called at a set rate like 5 times per second
	// use this instead of setInterval because this will time more accurately alongside the game's framerate
	static _repeatables: Record<RepeatableId, Repeatable> = {}
	private static nextRepeatableId: RepeatableId = 0;
	static addRepeatable(fn: AnyFunction, timesPerSecond: Hertz): RepeatableId {
		Game._repeatables[Game.nextRepeatableId] = {
			fn, timesPerSecond, timeOfLastFrameIdeally: Date.now(),
		};
		return Game.nextRepeatableId ++;
	}
	static removeRepeatable(id: RepeatableId | null): void {
		if(id !== null) delete Game._repeatables[id];
	}
	private static runRepeatables(): void {
		Object.values(Game._repeatables).forEach(repeatable => {
			const now: Time = Date.now();
			const period: Milliseconds = 1000 / repeatable.timesPerSecond;
			if(now - repeatable.timeOfLastFrameIdeally >= period) {
				repeatable.fn();
				repeatable.timeOfLastFrameIdeally += period;
				// so you don't get too behind if low framerate:
				if(now - repeatable.timeOfLastFrameIdeally > period)
					repeatable.timeOfLastFrameIdeally = now;
			}
		});
	}
	
	
	private static doSteps(): void {
		Game.updateDeltaTime();
		Game.globalSteps.forEach(step => step());
		Game._gameObjects.forEach(gameObject => gameObject.step());
		Game._gameObjects.forEach(gameObject => gameObject.update());
		Game.runRepeatables();
		if(Game.isRunning) {
			const timeSinceFrameStart: Milliseconds = Date.now() - Game.currentFrameTimeStamp;
			Game.timeoutId = setTimeout(Game.doSteps, Math.max(0, 1000 / Game.maxFrameRate - timeSinceFrameStart));
		}
		Game.#frameCount ++;
	}
}