// Contraint une valeur entre un min et un max
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));