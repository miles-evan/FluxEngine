import { GameObject } from "./GameObject.js";

export {};

declare global {
	type Key = KeyboardEvent["key"] | "touch";
	type GameObjectConstructor = new (...args: any[]) => GameObject;
}