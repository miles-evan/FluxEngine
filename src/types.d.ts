import GameObject from "./GameObject.ts";

export {};

declare global {
	type ObjectOptions = {
		hitboxWidth?: number,
		hitboxHeight?: number,
		originX?: number,
		originY?: number
	}
	type Constructor<T> = abstract new (...args: any[]) => T;
	type Key = KeyboardEvent["key"] | "touch";
	type AnyFunction = (...args: any[]) => any;
	type RepeatableId = number;
	type Hertz = number;
	type Time = number; // milliseconds since epoch
	type Seconds = number;
	type Milliseconds = number;
	type Pixels = number;
	type PixelsPerSecond = number;
	type Degrees = number;
	type Radians = number;
	type Frames = number;
	type FramesPerSecond = number;
	type Repeatable = {
		fn: AnyFunction,
		timesPerSecond: Hertz,
		timeOfLastFrameIdeally: Time,
	}
}