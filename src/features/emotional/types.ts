/**
 * Emotional Tracking Types
 */

export interface Mood {
  id: number;
  label: string;
  emoji: string;
  /** -2 = very bad, -1 = bad, 0 = neutral, 1 = good, 2 = very good */
  valence: number;
  createdAt: string;
}

export interface CreateMoodInput {
  label: string;
  emoji: string;
  valence: number;
}

/** Default moods seeded on first launch */
export const defaultMoods: CreateMoodInput[] = [
  { label: 'Terrible', emoji: '😫', valence: -2 },
  { label: 'Bad', emoji: '😟', valence: -1 },
  { label: 'Neutral', emoji: '😐', valence: 0 },
  { label: 'Good', emoji: '😊', valence: 1 },
  { label: 'Great', emoji: '🤩', valence: 2 },
];
