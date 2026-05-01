export interface Option {
  label: string;
  scores: Record<string, number>;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
}

export interface PetResult {
  name: string;
  type: string;
  mbti: string;
  emoji: string;
  el: string;
  img: string;
  normalImg?: string;
  shinyImg?: string;
  intro: string;
  desc: string;
  deepDesc?: string;
  tags: string[];
  expect: Record<string, number>;
  compat?: { name: string; type: string }[];
}

export interface ShinyPet extends PetResult {
  shinyRate: number;
}

export interface RankedPet {
  pet: string;
  distance: number;
  exact: number;
  similarity: number;
}

export interface QuizResult {
  dimScores: Record<string, number>;
  levels: Record<string, string>;
  ranked: RankedPet[];
  best: RankedPet;
  shinyAwaken: string | null;
  shinyScore: number;
  isShiny: boolean;
  isFallback: boolean;
}

export type Screen = 'intro' | 'quiz' | 'result' | 'collection';
