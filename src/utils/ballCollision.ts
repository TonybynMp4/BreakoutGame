import { clamp } from "./clamp";

// calcul de collision entre la balle et une brique
export function circleRectCollision(cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number) {
	const closestX = clamp(cx, rx, rx + rw);
	const closestY = clamp(cy, ry, ry + rh);
	const dx = cx - closestX;
	const dy = cy - closestY;
	return dx * dx + dy * dy <= cr * cr;
}