// Placeholder frames used until real photos come from the admin dashboard (Phase 2).
// No invented captions or EXIF: every value here is an empty slot.

export type Orientation = "landscape" | "portrait" | "square";

export type Frame = {
  id: string;
  orientation: Orientation;
  locked: boolean;
};

const pattern: Orientation[] = [
  "landscape",
  "portrait",
  "landscape",
  "square",
  "portrait",
  "landscape",
  "landscape",
  "portrait",
  "square",
  "landscape",
  "portrait",
  "landscape",
];

export const frames: Frame[] = pattern.map((orientation, i) => ({
  id: String(i + 1).padStart(2, "0"),
  orientation,
  // First six are public; the rest show how members-only photos will look.
  locked: i >= 6,
}));

export const albumSlots = ["A", "B", "C"].map((letter) => ({
  id: letter,
  title: `Album ${letter}`,
}));
