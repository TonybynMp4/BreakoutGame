import { Game } from './core/game.ts';
import type { GameConfig } from './types/index.ts';

const root = document.getElementById('app')!;
const config: GameConfig = {
	width: (70 * 9) + (6 * 7) + 20,
	height: 600,
	paddleWidth: 100,
	paddleHeight: 12,
	ballRadius: 7,
	brickRows: 4,
	brickCols: 8,
	brickWidth: 70,
	brickHeight: 20,
	brickGap: 6,
	ballSpeed: 1,
	paddleSpeed: 4,
	levelLayouts: [
		[
			[1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 1, 0, 2, 4, 2, 0, 1, 1],
			[1, 1, 1, 2, 0, 2, 1, 1, 1]
		],
		[
			[2, 1, 2, 1, 0, 2, 1, 2, 1],
			[1, 2, 1, 2, 0, 1, 2, 1, 2],
			[2, 1, 2, 1, 0, 2, 1, 2, 1],
			[1, 2, 1, 2, 0, 1, 2, 1, 2]
		],
		[
			[3, 1, 1, 1, 1, 1, 1, 1, 3],
			[4, 3, 2, 3, 4, 3, 2, 3, 4],
			[4, 1, 3, 4, 4, 4, 3, 1, 4],
			[2, 1, 1, 3, 3, 3, 1, 1, 2]
		],
	],
};

const game = new Game(root, config);
game.start();