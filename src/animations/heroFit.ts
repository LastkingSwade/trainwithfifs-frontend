import { PHOTO } from './config';

export interface HeroFit {
  left: number;
  top: number;
  width: number;
  height: number;
  src: string;
  loaded: boolean;
}

// Where the hero photo really sits inside its layer, so HUD graphics drawn in photo coordinates land on the baked-in ring.
// Mirrors the page's own rule: cover on phones, contain from 601px, anchored to the top centre. Uses layout sizes (not
// getBoundingClientRect) so a parallax transform on the photo never shifts the measurement.
export function measureHeroFit(img: HTMLImageElement): HeroFit {
  const cw = img.offsetWidth;
  const ch = img.offsetHeight;
  const nw = img.naturalWidth || PHOTO.width;
  const nh = img.naturalHeight || PHOTO.height;
  const fit = getComputedStyle(img).objectFit;
  const scale = fit === 'cover' ? Math.max(cw / nw, ch / nh) : Math.min(cw / nw, ch / nh);
  const width = nw * scale;
  const height = nh * scale;
  return {
    left: img.offsetLeft + (cw - width) / 2,
    top: img.offsetTop,
    width,
    height,
    src: img.currentSrc || img.src,
    loaded: img.complete && img.naturalWidth > 0,
  };
}
