import Game from "./Game.ts";


export default abstract class GameObject {
	
	_object: HTMLDivElement;
	left: Pixels = 0;
	top: Pixels = 0;
	#width: Pixels = 0;
	#height: Pixels = 0;
	rotation: Degrees = 0;
	xVelocity: PixelsPerSecond = 0;
	yVelocity: PixelsPerSecond = 0;
	_hitboxLeft: Pixels = 0;
	_hitboxTop: Pixels = 0;
	_hitboxRight: Pixels = 0;
	_hitboxBottom: Pixels = 0;
	originX: Pixels;
	originY: Pixels;
	sprite: string | null = null;
	#spriteImages: string[] | null = null;
	#imageSpeed: Hertz = 1;
	private animationRepeatableId: RepeatableId | null = null;
	imageIndex: number = 0;
	opacity: number = 1;
	onClick: AnyFunction | null = null;
	onRightClick: AnyFunction | null = null;
	onMiddleClick: AnyFunction | null = null;
	
	protected constructor(
		x: Pixels = 0, y: Pixels = 0, width: Pixels = 0, height: Pixels = 0, sprite: string = "",
		{ hitboxWidth, hitboxHeight, originX=0, originY=0 }: ObjectOptions = {}
	) {
		this._object = document.createElement("div");
		this._object.style.position = "absolute"
		this._object.style.backgroundRepeat = "no-repeat"
		this._object.style.backgroundSize = "100% 100%"
		
		this.originX = originX;
		this.originY = originY;
		
		this.x = x;
		this.y = y;
		this.update();
		
		this.width = width;
		this.height = height;
		
		this.sprite = sprite;
		
		this.setHitbox(hitboxWidth, hitboxHeight);
		
		this._object.addEventListener("mousedown", e => {
			if(e.button === 0) this.onClick?.();
			if(e.button === 1) this.onMiddleClick?.();
			if(e.button === 2) this.onRightClick?.();
		});
		
		if(!Game._screen)
			throw new Error("Must initialize screen");
		Game._screen.append(this._object);
		
		Game._appendGameObject(this);
	}
	
	
	// updates things like position and sprite
	update(): void {
		this.x += (this.xVelocity / 1000) * Game.deltaTime;
		this.y += (this.yVelocity / 1000) * Game.deltaTime;
		
		const roundOrNot: (x: Pixels) => Pixels = Game.lockPositionsToVirtualPixels? Math.round : x => x;
		this._object.style.left = roundOrNot(this.left) * Game.virtualScreenSizeMultiplier + "px";
		this._object.style.top = roundOrNot(this.top) * Game.virtualScreenSizeMultiplier + "px";
		this._object.style.width = roundOrNot(this.#width) * Game.virtualScreenSizeMultiplier + "px";
		this._object.style.height = roundOrNot(this.#height) * Game.virtualScreenSizeMultiplier + "px";
		this._object.style.transform = "rotate(" + this.rotation + "deg)";
		this._object.style.backgroundImage = "url(" + this.sprite + ")";
		this._object.style.opacity = String(this.opacity);
	}
	
	
	get x(): Pixels {
		return this.left + this.originX;
	}
	set x(x: Pixels) {
		this.left = x - this.originX;
	}
	
	get y(): Pixels {
		return this.top + this.originY;
	}
	set y(y: Pixels) {
		this.top = y - this.originY;
	}
	
	get right(): Pixels {
		return this.left + this.width;
	}
	set right(right: Pixels) {
		this.left = right - this.width;
	}
	
	get bottom(): Pixels {
		return this.top + this.height;
	}
	set bottom(bottom: Pixels) {
		this.top = bottom - this.height;
	}
	
	get middleX(): Pixels {
		return (this.left + this.right) / 2;
	}
	set middleX(middleX: Pixels) {
		this.left = middleX - this.width / 2;
	}
	
	get middleY(): Pixels {
		return (this.top + this.bottom) / 2;
	}
	set middleY(middleY: Pixels) {
		this.top = middleY - this.height / 2;
	}
	
	get width(): Pixels {
		return this.#width;
	}
	set width(width: Pixels) {
		this._hitboxLeft = this._hitboxLeft * width / this.width;
		this._hitboxRight = this._hitboxRight * width / this.width;
		this.#width = width;
	}
	
	get height(): Pixels {
		return this.#height;
	}
	set height(height: Pixels) {
		this._hitboxTop = this._hitboxTop * height / this.height;
		this._hitboxBottom = this._hitboxBottom * height / this.height;
		this.#height = height;
	}
	
	
	get speed(): PixelsPerSecond {
		return Math.sqrt(this.xVelocity ** 2 + this.yVelocity ** 2);
	}
	set speed(speed: PixelsPerSecond) {
		const angle: Degrees = this.velocityAngle;
		this.xVelocity = speed * Math.cos(angle);
		this.yVelocity = speed * Math.sin(angle);
	}
	
	get velocityAngle(): Degrees {
		if(this.xVelocity === 0 && this.yVelocity === 0)
			return 0; // TODO is this really how we want that to work?
		const radians: Radians = Math.atan2(this.yVelocity, this.xVelocity);
		return (180 / Math.PI) * radians;
	}
	set velocityAngle(angle: Degrees) {
		const radians: Radians = (Math.PI / 180) * angle;
		const speed: PixelsPerSecond = this.speed;
		this.xVelocity = speed * Math.cos(radians);
		this.yVelocity = speed * Math.sin(radians);
	}
	
	
	setHitbox(hitboxWidth: Pixels = this.width, hitboxHeight: Pixels = this.height): void  {
		this._hitboxLeft = this.width/2 - hitboxWidth/2;
		this._hitboxTop = this.height/2 - hitboxHeight/2;
		this._hitboxRight = this._hitboxLeft + hitboxWidth;
		this._hitboxBottom = this._hitboxTop + hitboxHeight;
	}
	
	get hitboxLeft(): Pixels {
		return this.left + this._hitboxLeft;
	}
	
	get hitboxTop(): Pixels {
		return this.top + this._hitboxTop;
	}
	
	get hitboxRight(): Pixels {
		return this.left + this._hitboxRight;
	}
	
	get hitboxBottom(): Pixels {
		return this.top + this._hitboxBottom;
	}
	
	
	get relativeMouseX(): Pixels {
		return Game.mouseX - this.x;
	}
	
	get relativeMouseY(): Pixels {
		return Game.mouseY - this.x;
	}
	
	
	get mouseHovered(): boolean {
		return Game.mouseX > this.left && Game.mouseX < this.right
			&& Game.mouseY > this.top && Game.mouseY < this.bottom;
	}
	
	
	set animatedSprite(spriteImages: string[]) {
		if(spriteImages.length === 0)
			throw new Error("can't set animation without sprites");
		this.#spriteImages = spriteImages;
		this.sprite = spriteImages[0]!;
		Game.removeRepeatable(this.animationRepeatableId);
		this.animationRepeatableId = null;
		this.animationRepeatableId = Game.addRepeatable(() => {
			if(!this.#spriteImages) throw new Error("sprite images for animation not set")
			this.imageIndex = (this.imageIndex + 1) % this.#spriteImages.length;
			this.sprite = this.#spriteImages[this.imageIndex]!;
		}, this.imageSpeed);
	}
	
	get imageSpeed() {
		return this.#imageSpeed;
	}
	set imageSpeed(imageSpeed: Hertz) {
		this.#imageSpeed = imageSpeed;
		if(this.animationRepeatableId)
			Game._repeatables[this.animationRepeatableId]!.timesPerSecond = imageSpeed;
	}
	
	
	// higher depth = further into the screen (further behind)
	get depth(): number {
		return -Number(this._object.style.zIndex);
	}
	set depth(depth: number) {
		this._object.style.zIndex = String(-depth);
	}
	
	
	collidedWith(other: GameObject): boolean {
		return this.hitboxRight > other.hitboxLeft
			&& this.hitboxLeft < other.hitboxRight
			&& this.hitboxBottom > other.hitboxTop
			&& this.hitboxTop < other.hitboxBottom;
	}
	
	
	collidedWithType(type: Constructor<GameObject>, x?: Pixels, y?: Pixels): boolean {
		return Game.objectCollidedWithType(this, type, x, y);
	}
	getCollisionsWithType<T extends GameObject>(type: Constructor<T>, x?: Pixels, y?: Pixels): T[] {
		return Game.getObjectsCollisionsWithType(this, type, x, y);
	}
	
	
	withTempPosition<T>(x: Pixels | undefined, y: Pixels | undefined, fn: (...args: any[]) => T): T {
		const [originalX, originalY] = [this.x, this.y];
		if(x) this.x = x;
		if(y) this.y = y;
		
		const result: any = fn();
		
		[this.x, this.y] = [originalX, originalY];
		
		return result;
	}
	
	
	destroy(): void {
		this._object.remove();
		Game._popGameObject(this);
		Game.removeRepeatable(this.animationRepeatableId);
	}
	
	
	abstract step(): void;
	
}
