import type { Brick } from '../types.ts';
import { clamp } from '../utils/clamp.ts';

export class DomRenderer {
	root: HTMLElement;
	infos: HTMLElement;
	controls: HTMLElement;
	muteBtn: HTMLButtonElement;
	volInput: HTMLInputElement;
	status: HTMLElement;
	playArea: HTMLElement;
	paddleEl: HTMLElement;
	ballEl: HTMLElement;
	bricksContainer: HTMLElement;

	// Overlay de fin
	modal: HTMLDialogElement;
	private onWinRestartCb: (() => void) | null = null;


	// initialisation de l'UI
	constructor(root: HTMLElement, config: { width: number; height: number; }) {
		this.root = root;

		// infos
		this.infos = document.createElement('div');
		this.infos.className = 'infos';
		this.root.appendChild(this.infos);

		// mute + volume
		this.controls = document.createElement('div');
		this.controls.style.display = 'flex';
		this.controls.style.gap = '8px';
		this.controls.style.alignItems = 'center';
		this.controls.style.justifyContent = 'center';
		this.controls.style.marginBottom = '6px';

		this.muteBtn = document.createElement('button');
		this.muteBtn.textContent = '🔊';
		this.muteBtn.title = 'Mute / Unmute';
		this.muteBtn.className = 'mute-btn';

		this.volInput = document.createElement('input');
		this.volInput.type = 'range';
		this.volInput.min = '0';
		this.volInput.max = '1';
		this.volInput.step = '0.05';
		this.volInput.value = '1';
		this.volInput.style.width = '140px';
		this.volInput.style.accentColor = '#3f51b5';

		this.status = document.createElement('div');
		this.status.id = 'status';
		this.status.style.textAlign = 'center';

		this.controls.appendChild(this.muteBtn);
		this.controls.appendChild(this.volInput);
		this.infos.appendChild(this.controls);
		this.infos.appendChild(this.status);

		// Zone de jeu
		this.playArea = document.createElement('div');
		this.playArea.className = 'playArea';
		this.playArea.style.width = config.width + 'px';
		this.playArea.style.height = config.height + 'px';
		this.root.appendChild(this.playArea);
		const subtext = document.createElement('p');
		subtext.style.fontSize = '12px';
		subtext.style.textAlign = 'center';
		subtext.style.marginTop = '4px';
		subtext.textContent = 'Barre espace pour démarrer, fleches gauche/droite pour déplacer la raquette!';
		this.root.appendChild(subtext);

		this.paddleEl = document.createElement('div');
		this.paddleEl.className = 'paddle';
		this.playArea.appendChild(this.paddleEl);

		this.ballEl = document.createElement('div');
		this.ballEl.className = 'ball';
		this.playArea.appendChild(this.ballEl);

		this.bricksContainer = document.createElement('div');
		this.bricksContainer.className = 'bricks';
		this.playArea.appendChild(this.bricksContainer);

		// Overlay (victoire)
		this.modal = document.createElement('dialog');
		this.modal.className = 'overlay';
		this.playArea.appendChild(this.modal);

		const title = document.createElement('div');
		title.className = 'title';
		title.textContent = `Breakout de wish`;
		this.root.prepend(title);
	}

	updateInfos(score: number, lives: number, level: number) {
		const status = document.getElementById('status') as HTMLElement | null;
		status!.textContent = `Score: ${score} | Vies: ${lives} | Niveau: ${level}`;
	}

	onVolumeChange(cb: (volume: number) => void) {
		this.volInput.addEventListener('input', () => {
			const v = parseFloat(this.volInput.value);
			cb(clamp(v, 0, 1));
		});
	}

	onToggleMute(cb: (muted: boolean) => void) {
		let muted = this.muteBtn.textContent === '🔇';
		this.muteBtn.addEventListener('click', () => {
			muted = !muted;
			this.setMuteIcon(muted);
			cb(muted);
		});
	}

	// Méthodes pour synchroniser l'UI depuis l'état audio initial
	setMuteIcon(muted: boolean) {
		this.muteBtn.textContent = muted ? '🔇' : '🔊';
	}

	setVolumeSlider(v: number) {
		this.volInput.value = clamp(v, 0, 1).toString();
	}

	// Met à jour la position
	updatePaddle(x: number, y: number, w: number, h: number) {
		Object.assign(this.paddleEl.style, {
			left: `${x}px`,
			top: `${y}px`,
			width: `${w}px`,
			height: `${h}px`
		});
	}

	// Met à jour la position
	updateBall(x: number, y: number, r: number) {
		const d = r * 2;
		Object.assign(this.ballEl.style, {
			left: `${x - r}px`,
			top: `${y - r}px`,
			width: `${d}px`,
			height: `${d}px`
		});
	}

	// Crée les éléments DOM pour les briques
	renderBricks(bricks: Brick[]) {
		this.bricksContainer.innerHTML = '';
		for (let i = 0; i < bricks.length; i++) {
			const b = bricks[i];
			if (!b.alive) continue; // ça devrait pas arriver mais on sait jamais
			const el = document.createElement('div');
			el.className = 'brick';
			el.style.left = `${b.x}px`;
			el.style.top = `${b.y}px`;
			el.style.width = `${b.width}px`;
			el.style.height = `${b.height}px`;
			el.dataset.hits = String(b.hits);
			el.dataset.idx = String(i);
			this.bricksContainer.appendChild(el);
		}
	}

	// Met à jour une brique existante (couleur via data-hits) ou la supprime si détruite
	updateBrick(index: number, brick: Brick) {
		const el = this.bricksContainer.querySelector(`[data-idx="${index}"]`) as HTMLElement | null;
		if (!brick.alive) {
			if (el) el.remove();
			return;
		}
		if (!el) {
			// Si l'élément n'existe pas (rare), on le crée
			const newEl = document.createElement('div');
			newEl.className = 'brick';
			newEl.style.left = `${brick.x}px`;
			newEl.style.top = `${brick.y}px`;
			newEl.style.width = `${brick.width}px`;
			newEl.style.height = `${brick.height}px`;
			newEl.dataset.hits = brick.hits.toString();
			newEl.dataset.idx = index.toString();
			this.bricksContainer.appendChild(newEl);
			return;
		}
		// l'attribut data-hits permet de changer la couleur via CSS
		el.dataset.hits = brick.hits.toString();
		// Déclenche un léger flash visuel pour indiquer l'impact
		el.classList.remove('hit');
		el.classList.add('hit');
		const once = () => {
			el.classList.remove('hit');
			el.removeEventListener('animationend', once);
		};
		el.addEventListener('animationend', once);
	}

	showWinOverlay(finalScore: number) {
		this.modal.innerHTML = `
				<h2>Bravo ! Jeu terminé 🎉</h2>
				<p class="final-score">Score final: ${finalScore}</p>
				<p class="hint">Cliquez sur Rejouer pour recommencer au niveau 1!</p>
				<button class="btn btn-primary" id="win-restart-btn">Rejouer</button>
		`;
		const btn = document.getElementById('win-restart-btn') as HTMLButtonElement;
		btn.addEventListener('click', () => {
			if (this.onWinRestartCb) this.onWinRestartCb();
		});
		this.modal.showModal();
	}

	hideOverlay() {
		this.modal.close();
	}

	//
	setWinRestart(cb: () => void) {
		this.onWinRestartCb = cb;
	}
}
