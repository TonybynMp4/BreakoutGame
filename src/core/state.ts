import type { Ball, Brick, GameConfig, Paddle, PlayerState } from '../types/index.ts';

export class GameState {
	public readonly config: GameConfig;
	public player: PlayerState;
	public ball: Ball;
	public paddle: Paddle;
	public bricks: Brick[] = [];
	public running = false;
	public awaitingStart = true;

	constructor(config: GameConfig) {
		this.config = config;
		const startLevel = 1;
		const baseLives = 3 + 2 * (startLevel - 1);
		this.player = { score: 0, lives: baseLives, level: startLevel };

		this.paddle = {
			width: config.paddleWidth,
			height: config.paddleHeight,
			x: (config.width - config.paddleWidth) / 2,
			y: config.height - config.paddleHeight - 10,
			speed: config.paddleSpeed
		};

		this.ball = {
			x: this.paddle.x + config.paddleWidth / 2,
			y: this.paddle.y - config.ballRadius - 2,
			radius: config.ballRadius,
			vx: 0,
			vy: -0,
			speed: config.ballSpeed
		};
	}

	resetBallOnPaddle() {
		this.awaitingStart = true;
		this.ball.x = this.paddle.x + this.paddle.width / 2;
		this.ball.y = this.paddle.y - this.ball.radius - 2;
		this.ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
		this.ball.vy = -3;
	}
}