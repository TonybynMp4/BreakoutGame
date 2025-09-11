export interface Vector2 { x: number; y: number; }

export interface Ball extends Vector2 {
	radius: number;
	vx: number;
	vy: number;
	speed: number;
}

export interface Paddle {
	width: number;
	height: number;
	x: number;
	y: number;
	speed: number;
}

export interface Brick {
	x: number;
	y: number;
	width: number;
	height: number;
	hits: number; // remaining hits (1..n)
	alive: boolean;
}

export interface PlayerState {
	score: number;
	lives: number;
	level: number;
}

export type Direction = 'left' | 'right' | 'none';

export interface GameConfig {
	width: number;
	height: number;
	paddleWidth: number;
	paddleHeight: number;
	ballRadius: number;
	brickRows: number;
	brickCols: number;
	brickWidth: number;
	brickHeight: number;
	brickGap: number;
	ballSpeed: number;
	paddleSpeed: number;
	levelLayouts: levelLayout[]; // Array of level layouts
}

type levelRow = number[];
type levelLayout = levelRow[];