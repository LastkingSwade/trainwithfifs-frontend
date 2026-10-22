// The parts of a generic handgun, for the Armory's exploded view. This is an ORIGINAL, generic illustration: it is not copied from any manufacturer or product diagram, and it is not to
// scale or a specific model. The shapes below are simple outlines drawn for this app. Notes describe what a part does; they never give steps for taking a firearm apart. Follow the
// manufacturer's owner's manual for disassembly, cleaning and maintenance.
export type Shape = { t: 'rect'; x: number; y: number; w: number; h: number; r?: number } | { t: 'path'; d: string } | { t: 'line'; x1: number; y1: number; x2: number; y2: number };
export interface Part { n: number; id: string; name: string; note: string; anchor: [number, number]; shapes: Shape[] }
export const VIEW_W = 760, VIEW_H = 480;

export const HANDGUN_PARTS: readonly Part[] = [
  { n: 1, id: 'slide', name: 'Slide', note: 'The top part that moves back and forth when the handgun fires. It carries the sights.', anchor: [150, 70], shapes: [{ t: 'rect', x: 150, y: 40, w: 460, h: 70, r: 10 }] },
  { n: 2, id: 'barrel', name: 'Barrel', note: 'The tube the bullet travels through when the handgun fires.', anchor: [120, 178], shapes: [{ t: 'rect', x: 120, y: 165, w: 370, h: 28, r: 6 }] },
  { n: 3, id: 'recoil-spring', name: 'Recoil spring and guide rod', note: 'Returns the slide to its forward position after each shot, and keeps the spring in line.', anchor: [230, 224], shapes: [{ t: 'rect', x: 230, y: 205, w: 240, h: 12, r: 6 }, { t: 'line', x1: 230, y1: 211, x2: 470, y2: 211 }] },
  { n: 4, id: 'frame', name: 'Frame', note: 'The main body. It holds the grip, the trigger and the magazine well.', anchor: [120, 288], shapes: [{ t: 'rect', x: 110, y: 250, w: 500, h: 50, r: 8 }, { t: 'path', d: 'M 380 300 L 480 300 L 470 460 L 380 460 Z' }] },
  { n: 5, id: 'trigger', name: 'Trigger', note: 'The lever the shooter pulls to fire the handgun.', anchor: [540, 336], shapes: [{ t: 'rect', x: 500, y: 330, w: 16, h: 40, r: 4 }] },
  { n: 6, id: 'trigger-spring', name: 'Trigger spring', note: 'Pushes the trigger back into its ready position.', anchor: [560, 372], shapes: [{ t: 'rect', x: 520, y: 368, w: 34, h: 8, r: 3 }] },
  { n: 7, id: 'slide-stop', name: 'Slide stop', note: 'Holds the slide open after the last round is fired, and releases it when a new magazine is loaded.', anchor: [190, 290], shapes: [{ t: 'rect', x: 180, y: 282, w: 42, h: 10, r: 3 }] },
  { n: 8, id: 'magazine-release', name: 'Magazine release', note: 'The button that lets the magazine drop out of the grip.', anchor: [470, 268], shapes: [{ t: 'rect', x: 462, y: 262, w: 18, h: 10, r: 3 }] },
  { n: 9, id: 'magazine', name: 'Magazine', note: 'Holds the cartridges and feeds them into the gun one at a time.', anchor: [690, 300], shapes: [{ t: 'rect', x: 640, y: 300, w: 62, h: 150, r: 5 }] },
  { n: 10, id: 'extractor', name: 'Extractor', note: 'Hooks the empty case and pulls it out of the chamber after each shot.', anchor: [230, 150], shapes: [{ t: 'rect', x: 200, y: 112, w: 60, h: 12, r: 2 }] },
  { n: 11, id: 'firing-pin', name: 'Firing pin', note: 'Strikes the primer of a cartridge to set off the powder.', anchor: [600, 134], shapes: [{ t: 'rect', x: 560, y: 124, w: 40, h: 8, r: 2 }] },
  { n: 12, id: 'front-sight', name: 'Front sight', note: 'The post at the front of the slide. Lined up with the rear sight to aim.', anchor: [200, 26], shapes: [{ t: 'rect', x: 190, y: 26, w: 18, h: 14, r: 2 }] },
  { n: 13, id: 'rear-sight', name: 'Rear sight', note: 'The notch at the back of the slide. Lined up with the front sight to aim.', anchor: [580, 26], shapes: [{ t: 'rect', x: 560, y: 26, w: 34, h: 14, r: 2 }] },
];

export const DIAGRAM_NOTICE = 'Generic handgun illustration. Not to scale, and not a specific model. For your exact model’s parts and any taking apart, follow your manufacturer’s owner’s manual.';
export const partFor = (id: string): Part | null => HANDGUN_PARTS.find((p) => p.id === id) || null;
