import { useState, useEffect, useCallback } from 'react';
import LoadingScreen from './components/LoadingScreen';
import IntroScreen from './components/IntroScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import PetCollection from './components/PetCollection';
import { computeResult, levelOf, SHARE_URL } from './utils';
import { results, fallbackResult, shinyPets, petKeys } from './data';
import { recordPet, getShinyRareRate, loadHistory } from './storage';
import type { QuizResult, Screen } from './types';

/** Multiplier applied to each pet's data-defined `shinyRate` at roll time.
 *  Per-pet rates stay as relative-rarity weights (so rare pets stay rarer);
 *  this knob controls overall shiny frequency. ~4× pushes the average from
 *  ~9% to ~36%, landing total shiny incidence near the 20–30% target. */
const SHINY_BOOST = 4;

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  const startQuiz = useCallback(() => {
    setAnswers({});
    setResult(null);
    setScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectOption = useCallback((qid: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  }, []);

  const submitQuiz = useCallback(() => {
    const res = computeResult(answers);
    const shinyConfig = shinyPets[res.best.pet];
    if (shinyConfig && Math.random() < shinyConfig.shinyRate * SHINY_BOOST) {
      res.isShiny = true;
      res.shinyAwaken = res.best.pet;
      res.shinyScore = shinyConfig.shinyRate;
    }
    res.isFallback = res.best.similarity < 80 && !res.isShiny;
    setResult(res);
    setScreen('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Record unlocked pet
    const petName = res.isFallback
      ? fallbackResult.name
      : results[res.best.pet].name;
    recordPet(petName, res.isShiny);
  }, [answers]);

  const quickTest = useCallback(
    (petKey: string, forceShiny = false) => {
      // Special debug path: '果冻' → render fallback result directly
      if (petKey === '果冻' || petKey === fallbackResult.name) {
        const expect = fallbackResult.expect;
        const expectToScore = (e: number) => (e === 3 ? 28 : e === 2 ? 23 : 18);
        const dimScores = {
          E: expectToScore(expect.E),
          S: expectToScore(expect.S),
          B: expectToScore(expect.B),
          M: expectToScore(expect.M),
          W: expectToScore(expect.W),
        };
        const levels: Record<string, string> = {};
        Object.entries(dimScores).forEach(([d, s]) => {
          levels[d] = levelOf(s);
        });
        const res: QuizResult = {
          dimScores,
          levels,
          ranked: [{ pet: petKeys[0], distance: 99, exact: 0, similarity: 0 }],
          best: { pet: petKeys[0], distance: 99, exact: 0, similarity: 0 },
          shinyAwaken: null,
          shinyScore: 0,
          isShiny: false,
          isFallback: true,
        };
        setResult(res);
        setScreen('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        recordPet(fallbackResult.name, false);
        return;
      }

      const expect = results[petKey].expect;
      // Map expect (1=L, 2=M, 3=H) to representative scores in the 12–36 quiz range
      // so the displayed level/score stays consistent with levelOf thresholds.
      const expectToScore = (e: number) => (e === 3 ? 28 : e === 2 ? 23 : 18);
      const dimScores = {
        E: expectToScore(expect.E),
        S: expectToScore(expect.S),
        B: expectToScore(expect.B),
        M: expectToScore(expect.M),
        W: expectToScore(expect.W),
      };
      const levels: Record<string, string> = {};
      Object.entries(dimScores).forEach(([d, s]) => {
        levels[d] = levelOf(s);
      });
      const shinyConfig = shinyPets[petKey];
      const isShiny = forceShiny || (shinyConfig && Math.random() < shinyConfig.shinyRate * SHINY_BOOST);
      const res: QuizResult = {
        dimScores,
        levels,
        ranked: [{ pet: petKey, distance: 0, exact: 5, similarity: 100 }],
        best: { pet: petKey, distance: 0, exact: 5, similarity: 100 },
        shinyAwaken: isShiny ? petKey : null,
        shinyScore: isShiny ? (shinyConfig?.shinyRate ?? 0) : 0,
        isShiny,
        isFallback: false,
      };
      setResult(res);
      setScreen('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      recordPet(results[petKey].name, isShiny);
    },
    []
  );

  const viewPetFromCollection = useCallback((petKey: string) => {
    quickTest(petKey);
  }, [quickTest]);

  const shareResult = useCallback(() => {
    if (!result) return;
    const r = result.isFallback
      ? fallbackResult
      : results[result.best.pet];
    const text =
      `我在【洛克王国精灵性格测试】测出了「${r.name}」\n` +
      `${r.tags.slice(0, 3).join(' · ')}\n` +
      `${r.intro}\n\n` +
      `快来测测你是哪种精灵 → ${SHARE_URL}`;
    if (navigator.share) {
      navigator.share({ title: 'RocoTI 性格测试', text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('结果已复制，去分享吧！'));
    }
  }, [result]);

  const getRankInfo = useCallback((res: QuizResult) => {
    const history = loadHistory();
    if (res.isFallback) {
      return { rankText: '你触发了一种隐藏存档', isRare: true };
    }
    if (res.shinyAwaken) {
      const rate = getShinyRareRate(res.shinyAwaken);
      return { rankText: `稀有异色觉醒！触发概率仅 ${rate}%`, isRare: true };
    }
    const collected = history.unlockedPets.length;
    return { rankText: `你已收集 ${collected} / ${petKeys.length} 张性格卡`, isRare: false };
  }, []);

  return (
    <div className="shell">
      {loading && <LoadingScreen />}
      {screen === 'intro' && (
        <IntroScreen onStart={startQuiz} onQuickTest={quickTest} />
      )}
      {screen === 'quiz' && (
        <QuizScreen
          answers={answers}
          onAnswer={selectOption}
          onSubmit={submitQuiz}
          onBack={() => setScreen('intro')}
        />
      )}
      {screen === 'result' && result && (
        <ResultScreen
          result={result}
          onRestart={startQuiz}
          onShare={shareResult}
          onViewCollection={() => setScreen('collection')}
          rankInfo={getRankInfo(result)}
        />
      )}
      {screen === 'collection' && (
        <PetCollection
          onBack={() => setScreen(result ? 'result' : 'intro')}
          onViewPet={viewPetFromCollection}
        />
      )}
    </div>
  );
}
