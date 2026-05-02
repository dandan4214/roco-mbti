import {
  questions,
  results,
  shinyPets,
  fallbackResult,
  petKeys,
  dimensionOrder,
} from './data';
import { personas } from './personas';
import type { QuizResult } from './types';

/** Share URL — auto-resolves to current deployment origin so we never need to
 *  hand-edit it when the domain changes. Falls back to the production domain
 *  during SSR/non-browser contexts (defensive; this is a SPA so it shouldn't fire). */
export const SHARE_URL =
  typeof window !== 'undefined' ? window.location.origin + '/' : 'https://mbti.dandantv.site/';

/** Fire a Google Analytics 4 event. Safe to call before gtag has loaded —
 *  the snippet in index.html buffers via dataLayer, so events queued during
 *  the initial async load are not lost. No-op outside the browser. */
export function track(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', name, params || {});
}

export function levelOf(s: number): string {
  /* Calibrated thresholds based on actual score distribution of 12 questions.
     Each option awards 1–3 points per dimension; 12 questions → range ~12–36.
     Percentile analysis shows: 33rd ≈ 21, 67th ≈ 24 for most dimensions. */
  return s <= 21 ? 'L' : s <= 24 ? 'M' : 'H';
}

export function levelNum(l: string): number {
  return { L: 1, M: 2, H: 3 }[l] ?? 2;
}

export function computeResult(answers: Record<string, number>): QuizResult {
  const dimScores: Record<string, number> = { E: 0, S: 0, B: 0, M: 0, W: 0 };

  questions.forEach((q) => {
    const a = answers[q.id];
    if (a === undefined) return;
    const s = q.options[a]?.scores;
    if (s) {
      Object.entries(s).forEach(([k, v]) => {
        if (dimScores[k] !== undefined) dimScores[k] += v;
      });
    }
  });

  const levels: Record<string, string> = {};
  Object.entries(dimScores).forEach(([d, s]) => {
    levels[d] = levelOf(s);
  });

  const uv = dimensionOrder.map((d) => levelNum(levels[d]));

  // ── Distance match across ALL 32 pets ──
  const ranked = petKeys
    .map((p) => {
      const r = results[p];
      const ev = dimensionOrder.map((d) => r.expect[d]);
      let dist = 0;
      let exact = 0;
      for (let i = 0; i < 5; i++) {
        const diff = Math.abs(uv[i] - ev[i]);
        dist += diff;
        if (!diff) exact++;
      }
      return {
        pet: p,
        distance: dist,
        exact,
        similarity: Math.max(0, Math.round((1 - dist / 10) * 100)),
      };
    })
    .sort((a, b) => a.distance - b.distance || b.exact - a.exact);

  const best = ranked[0];

  return {
    dimScores,
    levels,
    ranked,
    best,
    shinyAwaken: null,
    shinyScore: 0,
    isShiny: false,
    isFallback: best.similarity < 80,
  };
}

export function findPetInfo(n: string) {
  if (results[n]) return results[n];
  if (shinyPets[n]) return shinyPets[n];
  if (fallbackResult.name === n) return fallbackResult;
  return null;
}

export function getRadarSVG(scores: Record<string, number>) {
  const dims = ['E', 'S', 'B', 'M', 'W'];
  const labels = ['能量', '社交', '战斗', '情绪', '世界观'];
  const maxScore = Math.max(...Object.values(scores));
  const max = Math.max(15, Math.ceil(maxScore / 5) * 5);
  const cx = 100;
  const cy = 100;
  const R = 80;
  const angles = [-90, -18, 54, 126, 198].map((a) => (a * Math.PI) / 180);

  const pts = dims.map((d, i) => {
    const r = (scores[d] / max) * R;
    return {
      x: cx + r * Math.cos(angles[i]),
      y: cy + r * Math.sin(angles[i]),
    };
  });

  const gp = (lv: number) =>
    angles
      .map((a) => {
        const r = R * lv;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      })
      .join(' ');

  const grid = [0.33, 0.66, 1]
    .map(
      (l) =>
        `<polygon points="${gp(l)}" fill="none" stroke="#dbe8dd" stroke-width="1"/>`
    )
    .join('');

  const axis = angles
    .map(
      (a) =>
        `<line x1="${cx}" y1="${cy}" x2="${cx + R * Math.cos(a)}" y2="${cy + R * Math.sin(a)}" stroke="#dbe8dd" stroke-width="1"/>`
    )
    .join('');

  const lp = [
    { x: 100, y: 12, a: 'middle' },
    { x: 188, y: 72, a: 'start' },
    { x: 158, y: 178, a: 'start' },
    { x: 42, y: 178, a: 'end' },
    { x: 12, y: 72, a: 'end' },
  ];

  const lbs = dims
    .map(
      (d, i) =>
        `<text x="${lp[i].x}" y="${lp[i].y}" text-anchor="${lp[i].a}" fill="#6a786f" font-size="11" font-weight="600">${labels[i]}${scores[d]}</text>`
    )
    .join('');

  const poly = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const dots = pts
    .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#4d6a53"/>`)
    .join('');

  return `<svg viewBox="-20 -10 240 220" style="width:100%;max-width:260px;margin:0 auto;display:block;">${grid}${axis}<polygon points="${poly}" fill="rgba(108,141,113,0.18)" stroke="#4d6a53" stroke-width="2"/>${dots}${lbs}</svg>`;
}

export function getRoleDesc(scores: Record<string, number>, petName?: string) {
  if (petName && personas[petName]) {
    return personas[petName].kingdomRole;
  }
  const srt = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const pair = [srt[0][0], srt[1][0]].sort().join('');

  const map: Record<string, { t: string; d: string }> = {
    BE: {
      t: '冲锋队长',
      d: '你的字典里没有「等一等」。高能量+强战斗欲让你成为最锋利的矛。你喜欢冲在最前面，用行动带动整个团队。',
    },
    EM: {
      t: '气氛担当',
      d: '你是团队的「情绪引擎」。你不仅能点燃自己的热情，还能把这份能量传染给周围的人。有你在的地方，永远不会冷场。',
    },
    ES: {
      t: '团队领袖',
      d: '你天生就是带队的人。高能量+强社交让你在任何团队中都自然而然地成为核心。你不仅自己冲在前面，还能把身后的人带起来。',
    },
    EW: {
      t: '冒险发起者',
      d: '你的脑子里永远装满了「下一个目标」。高能量+远大视野让你不断推动团队向前探索。你是那个永远在问「然后呢？」的人。',
    },
    BM: {
      t: '热血战士',
      d: '你是那种越战越勇的人。情绪的高涨让你的战斗力成倍放大。你享受热血上头的快感，战场就是你的舞台。',
    },
    BS: {
      t: '战术协作',
      d: '你信奉「团战出奇迹」。你不仅善于和人配合，还懂得在关键时刻打出致命一击。你是团队中最可靠的搭档。',
    },
    BW: {
      t: '极限挑战者',
      d: '你追求的是超越自我的快感。远大的目标+战斗的本能让你不断挑战更高难度的副本。你的极限，就是用来打破的。',
    },
    MS: {
      t: '暖心搭档',
      d: '你是那个会在队友失落时递上鼓励的人。你敏感、细腻，能捕捉到别人忽略的情绪变化。和你做朋友，是一种幸运。',
    },
    MW: {
      t: '理想主义者',
      d: '你有一个关于完美世界的蓝图。情绪和愿景的结合让你成为一个坚定的追梦人。哪怕前路艰难，你也不会放弃心中的光。',
    },
    SW: {
      t: '远征伙伴',
      d: '你相信最好的风景在远方，而最好的方式是和人一起去。你既有远见，又珍视同行的人。你是那种会让人想「下次还和他一起」的人。',
    },
  };

  const c = map[pair];
  if (c) return c;
  return {
    t: '独特存在',
    d: '你的性格维度分布比较均衡，没有特别突出的倾向。这意味着你适应力强，能在不同情境中灵活切换角色。你是团队里的「万能拼图」。',
  };
}

export function getBattleStyle(scores: Record<string, number>, petName?: string) {
  if (petName && personas[petName]) {
    return personas[petName].battleStyle;
  }
  const b = scores.B;
  const m = scores.M;
  // Threshold 24 ≈ midpoint of 12–36 quiz range, aligned with levelOf cutoffs.
  if (b >= 24 && m >= 24) {
    return {
      t: '狂战士流',
      d: '正面硬刚，越战越勇。你信奉「最好的防守就是进攻」，情绪越激动战斗力越强。你的战斗就像烈火，席卷一切。',
    };
  }
  if (b >= 24 && m < 24) {
    return {
      t: '刺客流',
      d: '冷静收割，一击必杀。你不喜欢拖泥带水，追求在最短时间内结束战斗。你的每一招都经过精密计算。',
    };
  }
  if (b < 24 && m >= 24) {
    return {
      t: '控场流',
      d: '打乱节奏，干扰心智。你擅长用情绪和心理战术瓦解对手。你的武器不是蛮力，而是让人捉摸不透的变化。',
    };
  }
  return {
    t: '发育流',
    d: '猥琐发育，后期发力。你不急于一时，更愿意在战斗外做好准备。一旦出手，就是雷霆万钧。',
  };
}

export function getBreedPhilosophy(scores: Record<string, number>, petName?: string) {
  if (petName && personas[petName]) {
    return personas[petName].breedPhilosophy;
  }
  const w = scores.W;
  const m = scores.M;
  if (w >= 24 && m >= 24) {
    return {
      t: '完美主义者',
      d: '不孵出最佳性格绝不罢休。你会查攻略、算概率、反复尝试，直到满意为止。你的孵蛋过程本身就是一场修行。',
    };
  }
  if (w >= 24 && m < 24) {
    return {
      t: '佛系随缘党',
      d: '能孵出来就行，不强求。你相信「缘分到了自然有」，不会为了一个性格熬夜通宵。游戏嘛，开心最重要。',
    };
  }
  if (w < 24 && m >= 24) {
    return {
      t: '速成急躁党',
      d: '孵几次不出就换目标。你的耐心有限，更享受「立刻有结果」的快感。你会选择效率最高的路径，哪怕不是最优解。',
    };
  }
  return {
    t: '实用主义党',
    d: '不在乎性格，能打架就行。你更关注实战表现，对「性格」「天赋」这些细枝末节不感兴趣。强不强，打一架就知道了。',
  };
}

export function getSocialMode(scores: Record<string, number>, petName?: string) {
  if (petName && personas[petName]) {
    return personas[petName].socialMode;
  }
  const e = scores.E;
  const s = scores.S;
  if (e >= 24 && s >= 24) {
    return {
      t: '派对动物',
      d: '你走到哪里都是焦点。你喜欢热闹，享受被人围绕的感觉。一个人玩游戏？那不如直接下线。',
    };
  }
  if (e >= 24 && s < 24) {
    return {
      t: '独狼行动派',
      d: '你能量充沛，但更喜欢一个人行动。你不是不合群，只是你觉得一个人效率更高。你享受独处的自由。',
    };
  }
  if (e < 24 && s >= 24) {
    return {
      t: '安静倾听者',
      d: '你不喜欢成为焦点，但你是最好的听众。你善于在人群中观察，在适当的时候给出精准的判断。',
    };
  }
  return {
    t: '隐士模式',
    d: '社交对你来说是耗电项。你更喜欢和少数几个知心朋友深度交流，而不是在大群里热闹。你的朋友圈小而精。',
  };
}
