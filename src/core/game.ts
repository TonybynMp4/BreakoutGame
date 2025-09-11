import type { Brick, Direction, GameConfig } from '../types/index.ts';
import { clamp } from '../utils/clamp.ts';
import { AudioManager } from './audio.ts';
import { DomRenderer } from './dom.ts';
import { GameState } from './state.ts';

export class Game {
	state: GameState;
	dir: Direction = 'none';
	renderer: DomRenderer;
	rafId = 0; // requestAnimationFrame ID
	root: HTMLElement;
	audio = new AudioManager();
	private ending = false; // évite de déclencher fin de jeu + fin de partie

	constructor(root: HTMLElement, config: GameConfig) {
		this.root = root;
		this.state = new GameState(config);
		this.renderer = new DomRenderer(root, { width: config.width, height: config.height });

		// Préchargement audios
		this.audio.loadAll([
			['tap', '/fx/tap.wav'],
			['pop', '/fx/pop.mp3'],
			['win', '/fx/win.wav'],
			['lose', '/fx/lose.wav'],
			['cheer', '/fx/cheer.wav']
		]).catch(err => console.error('Audio load error:', err));

		this.makeLevel(this.state.player.level);

		window.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowLeft') this.dir = 'left';
			if (e.key === 'ArrowRight') this.dir = 'right';
			if (e.key === ' ' && this.state.awaitingStart) {
				this.state.awaitingStart = false;
			}
		});
		window.addEventListener('keyup', (e) => {
			if (e.key === 'ArrowLeft' && this.dir === 'left') this.dir = 'none';
			if (e.key === 'ArrowRight' && this.dir === 'right') this.dir = 'none';
		});

		this.updateInfos();

		this.renderer.onToggleMute((muted) => this.audio.toggleSounds(!muted));
		this.renderer.onVolumeChange((v) => this.audio.setVolume(v));

		// Synchroniser l'UI avec l'état audio initial (persisté)
		this.renderer.setMuteIcon(!this.audio.getEnabled());
		this.renderer.setVolumeSlider(this.audio.getVolume());
	}

	start() { this.state.running = true; this.loop(); }
	stop() { this.state.running = false; cancelAnimationFrame(this.rafId); }

	makeLevel(level: number) {
		const cfg = this.state.config;
		const layout = cfg.levelLayouts[level - 1];
		const bricks: Brick[] = [];

		if (layout && layout.length > 0) {
			const rows = layout.length;
			const maxCols = Math.max(...layout.map(row => row?.length ?? 0)); // spread
			const gridWidth = maxCols * cfg.brickWidth + Math.max(0, maxCols - 1) * cfg.brickGap;
			const offsetX = Math.max(cfg.brickGap, Math.floor((cfg.width - gridWidth) / 2));
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < (layout[r]?.length ?? 0); c++) {
					const cell = layout[r][c] ?? 0;
					if (cell <= 0) continue; // 0 = vide
					bricks.push({
						x: offsetX + c * (cfg.brickWidth + cfg.brickGap),
						y: r * (cfg.brickHeight + cfg.brickGap) + cfg.brickGap + 40,
						width: cfg.brickWidth,
						height: cfg.brickHeight,
						hits: cell,
						alive: true
					});
				}
			}
		}

		this.state.bricks = bricks;
		this.renderer.renderBricks(bricks);
		this.state.resetBallOnPaddle();
	}

	updateInfos() {
		const { score, lives, level } = this.state.player;
		this.renderer.updateInfos(score, lives, level);
	}

	loop = () => {
		if (!this.state.running) return;
		this.rafId = requestAnimationFrame(this.loop);
		this.update();
		this.draw();
	};

	update() {
		const {
			awaitingStart,
			player,
			paddle,
			ball,
			config,
			bricks
		} = this.state;

		if (this.dir === 'left') paddle.x -= paddle.speed;
		else if (this.dir === 'right') paddle.x += paddle.speed;
		paddle.x = clamp(paddle.x, 0, config.width - paddle.width);

		if (awaitingStart) {
			ball.x = paddle.x + paddle.width / 2;
			ball.y = paddle.y - ball.radius - 2;
			return;
		}

		ball.x += ball.vx * ball.speed;
		ball.y += ball.vy * ball.speed;

		// Wall collisions
		if (ball.x - ball.radius <= 0.1 || ball.x + ball.radius >= config.width) ball.vx *= -1;
		if (ball.y - ball.radius <= 0.1) ball.vy *= -1;

		// collision bas
		if (ball.y - ball.radius > config.height) {
			player.lives -= 1;
			this.updateInfos();
			if (player.lives <= 0) {
				this.gameOver();
			} else {
				this.state.resetBallOnPaddle();
			}
			return;
		}

		// Paddle collision (merci GPT5)
		if (ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height && ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width && ball.vy > 0) {
			ball.vy *= -1;
			const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
			ball.vx = 3 * hitPos;
		}

		// Brick collisions (merci GPT5)
		for (let i = 0; i < bricks.length; i++) {
			const b = bricks[i];
			if (!b.alive) continue;
			if (this.circleRectCollision(ball.x, ball.y, ball.radius, b.x, b.y, b.width, b.height)) {
				// Détermination de l'axe d'impact pour choisir le rebond (horizontal vs vertical)
				const closestX = clamp(ball.x, b.x, b.x + b.width);
				const closestY = clamp(ball.y, b.y, b.y + b.height);
				const dx = ball.x - closestX;
				const dy = ball.y - closestY;
				if (Math.abs(dx) > Math.abs(dy)) {
					// Impact côté gauche/droit → inverser vx et sortir la balle du bloc
					ball.vx *= -1;
					if (dx > 0) ball.x = b.x + b.width + ball.radius; else ball.x = b.x - ball.radius;
				} else {
					// Impact haut/bas → inverser vy et sortir la balle du bloc
					ball.vy *= -1;
					if (dy > 0) ball.y = b.y + b.height + ball.radius; else ball.y = b.y - ball.radius;
				}
				b.hits -= 1;
				if (b.hits <= 0) {
					b.alive = false;
					player.score += 10;
					this.updateInfos();
					this.renderer.updateBrick(i, b);
					this.audio.play('pop', { volume: 0.1 });
				}
				else {
					this.renderer.updateBrick(i, b);
					this.audio.play('tap');
				}
				break;
			}
		}

		// check niveau vide
		if (bricks.every(brick => !brick.alive)) {
			const nextLevel = player.level + 1;
			if (nextLevel > config.levelLayouts.length) {
				if (!this.ending) {
					this.ending = true;
					this.stop();
				}
				this.win()
				return;
			}
			// Vies selon niveau: 3 + (level-1)
			const baseLives = 3 + (nextLevel - 1);
			player.level = nextLevel
			player.lives = baseLives
			this.makeLevel(nextLevel);
			this.updateInfos();
		}
	}

	circleRectCollision(cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number) {
		const closestX = clamp(cx, rx, rx + rw);
		const closestY = clamp(cy, ry, ry + rh);
		const dx = cx - closestX;
		const dy = cy - closestY;
		return dx * dx + dy * dy <= cr * cr;
	}

	draw() {
		const { paddle, ball } = this.state;
		this.renderer.updatePaddle(paddle.x, paddle.y, paddle.width, paddle.height);
		this.renderer.updateBall(ball.x, ball.y, ball.radius);
	}

	reset(alertText: string, isWin?: boolean) {
		this.stop();
		if (isWin) {
			this.audio.play('cheer');
			this.audio.play('win');
		} else {
			this.audio.play('lose');
		}
		setTimeout(() => {
			alert(alertText);
			this.state.player = { score: 0, lives: 3, level: 1 };
			this.makeLevel(1);
			this.updateInfos();
			this.ending = isWin ? true : false;
			this.start();
		}, 50); // délai pour laisser jouer le son avant l'alert
	}


	gameOver() {
		this.reset('Perdu ! Appuyez sur OK pour recommencer.');
	}

	win() {
		this.reset('Bravo ! Jeu terminé.', true);
	}
}