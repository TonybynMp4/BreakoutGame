import { clamp } from "../utils/clamp";

type AudioMap = Record<string, HTMLAudioElement>;

const LOCAL_STORAGE_KEYS = { volume: 'breakout.volume', muted: 'breakout.muted' };

export class AudioManager {
	private sounds: AudioMap = {};
	private enabled = true;
	private volume = 1;

	constructor() {
		// persistance du volume/mute
		try {
			const storedVolume = localStorage.getItem(LOCAL_STORAGE_KEYS.volume);
			if (storedVolume != null) {
				const volume = parseFloat(storedVolume);
				this.volume = clamp(volume, 0, 1);
			}
			const storedMute = localStorage.getItem(LOCAL_STORAGE_KEYS.muted);
			if (storedMute != null) this.enabled = storedMute !== '1';
		} catch (e) {
			console.error('Error loading audio settings from localStorage:', e);
		}
	}

	async load(name: string, url: string) {
		return new Promise<void>((resolve, reject) => {
			try {
				const audio = new Audio(url);
				audio.preload = 'auto';
				audio.oncanplaythrough = () => resolve();
				audio.onerror = () => reject(new Error(`audio load error: ${url}`));
				this.sounds[name] = audio;
			} catch (e) {
				reject(e);
			}
		});
	}

	async loadAll(entries: Array<[string, string]>) {
		await Promise.all(entries.map(([name, url]) => this.load(name, url)));
	}

	play(name: string, opts?: { volume?: number; loop?: boolean }) {
		if (!this.enabled) return;
		const audioElement = this.sounds[name];
		if (!audioElement) return console.warn(`AudioManager: sound '${name}' not found/loaded`);
		try {
			// Clone pour pouvoir avoir une superposition des sons identiques
			const soundNode = audioElement.cloneNode(true) as HTMLAudioElement;
			const v = (opts?.volume ?? 1) * this.volume;
			soundNode.volume = clamp(v, 0, 1);
			soundNode.loop = opts?.loop ?? false;
			soundNode.play();
		} catch (e) {
			console.error(`Error playing sound '${name}':`, e);
		}
	}

	toggleSounds(volume: boolean) {
		this.enabled = volume;
		try { localStorage.setItem(LOCAL_STORAGE_KEYS.muted, volume ? '0' : '1'); }
		catch (e) { console.error('Error saving audio settings to localStorage:', e); }
	}

	setVolume(volume: number) {
		this.volume = clamp(volume, 0, 1);
		try { localStorage.setItem(LOCAL_STORAGE_KEYS.volume, String(this.volume)); }
		catch (e) { console.error('Error saving audio settings to localStorage:', e); }
	}

	getVolume() { return this.volume; }
	getEnabled() { return this.enabled; }
}