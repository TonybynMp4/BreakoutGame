## Breakout de wish
Jeu classique "Breakout"
Cassez toutes les briques sans perdre toutes vos vies!

### Contrôles
- fleches gauche/droite pour déplacer la palette
- espace pour lancer la balle

### Installation

```
git clone https://github.com/tonybynmp4/BreakoutGame
cd BreakoutGame
npm install
npm run dev
```
Puis ouvrez `http://localhost:5173` dans votre navigateur.

### Structure du projet
- `src/core/` : logique principale du jeu
	- `game.ts` : boucle de jeu principale
	- `state.ts` : gestion de l'état du jeu
	- `dom.ts` : rendu et interactions DOM
	- `audio.ts` : gestion des sons
- `src/utils/` : fonctions utilitaires (clamp, calculs de collisions balle/brique)
- `src/types.ts` : définitions des types
- `public/` : ressources statiques (images, sons)