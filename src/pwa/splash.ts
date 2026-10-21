// iPhone and iPad launch screens (the picture shown while the installed app starts, instead of a white flash). Apple needs one picture per screen size, chosen by a media query.
// The pictures are made by scripts/make_splash.js and live in public/splash. [css width, css height, pixel ratio] for each device; portrait only.
export const SPLASH_DEVICES: ReadonlyArray<readonly [number, number, number]> = [
  [440, 956, 3], [402, 874, 3], [393, 852, 3], [430, 932, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3], [375, 667, 2],
  [744, 1133, 2], [768, 1024, 2], [810, 1080, 2], [820, 1180, 2], [834, 1112, 2], [834, 1194, 2], [1024, 1366, 2],
];
export const splashFile = (cw: number, ch: number, dpr: number): string => `/splash/splash-${cw * dpr}x${ch * dpr}.jpg`;
export const splashMedia = (cw: number, ch: number, dpr: number): string => `(device-width: ${cw}px) and (device-height: ${ch}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`;
export const STARTUP_IMAGES = SPLASH_DEVICES.map(([cw, ch, dpr]) => ({ url: splashFile(cw, ch, dpr), media: splashMedia(cw, ch, dpr) }));
