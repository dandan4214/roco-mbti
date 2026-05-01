const STORAGE_KEY = 'roco-mbti-history';

export interface HistoryData {
  unlockedPets: string[];
  unlockedShiny: string[];
  totalTests: number;
}

export function loadHistory(): HistoryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        unlockedPets: Array.isArray(parsed.unlockedPets) ? parsed.unlockedPets : [],
        unlockedShiny: Array.isArray(parsed.unlockedShiny) ? parsed.unlockedShiny : [],
        totalTests: typeof parsed.totalTests === 'number' ? parsed.totalTests : 0,
      };
    }
  } catch {
    // ignore
  }
  return { unlockedPets: [], unlockedShiny: [], totalTests: 0 };
}

export function saveHistory(data: HistoryData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function recordPet(petName: string, isShiny = false) {
  const history = loadHistory();
  if (!history.unlockedPets.includes(petName)) {
    history.unlockedPets.push(petName);
  }
  if (isShiny && !history.unlockedShiny.includes(petName)) {
    history.unlockedShiny.push(petName);
  }
  history.totalTests += 1;
  saveHistory(history);
  return history;
}

export function isPetUnlocked(petName: string): boolean {
  return loadHistory().unlockedPets.includes(petName);
}

export function isShinyUnlocked(petName: string): boolean {
  return loadHistory().unlockedShiny.includes(petName);
}

export function getShinyRareRate(shinyName: string): string {
  const rates: Record<string, string> = {
    '利灯鱼': '0.8',
    '夜枭': '1.2',
    '恶魔狼': '0.5',
    '燃薪虫': '0.9',
    '疾光千兽': '0.7',
    '窃光蚊': '1.1',
    '粉耳星兔': '0.6',
    '红绒十字': '0.4',
  };
  return rates[shinyName] || '1.0';
}

export function isShinyPet(petName: string): boolean {
  return ['利灯鱼', '夜枭', '恶魔狼', '燃薪虫', '疾光千兽', '窃光蚊', '粉耳星兔', '红绒十字'].includes(petName);
}
