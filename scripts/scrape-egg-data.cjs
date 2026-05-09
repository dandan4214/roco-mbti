/**
 * 洛克王国「孵蛋反查」数据采集脚本
 * 目标: https://roco.gptvip.chat/api/magic-egg-lookup
 *
 * 用法:
 *   cd scripts && node scrape-egg-data.js
 *
 * 输出: ../data/egg-lookup-db.json
 */

const fs = require('fs');
const path = require('path');

// ── 配置 ──────────────────────────────────────────────
const CONFIG = {
  // API 基础地址
  apiBase: 'https://roco.gptvip.chat/api/magic-egg-lookup',

  // 扫描范围（根据探测结果调整：有效数据集中在 0.05~0.55m × 0.1~5.5kg）
  // 如需更高精度可改 step 为 0.03 或 0.02，但请求量会大增
  heightRange: { min: 0.05, max: 0.60, step: 0.05 },
  weightRange: { min: 0.10, max: 6.00, step: 0.05 },

  // 蛋类型（留空则只扫无蛋类型过滤的情况）
  // 格式: { label, value }
  eggTypes: [
    // { label: '同乘精灵蛋', value: 600006 },
    // { label: '神奇的蛋', value: 310049 },
    // { label: '炫彩精灵蛋', value: 310050 },
    // { label: '赛季炫彩精灵蛋', value: 310052 },
    // { label: '火红炫彩蛋', value: 600004 },
  ],

  // 请求间隔（毫秒）—— 建议 ≥ 500，太频繁容易被封
  delayMs: 800,

  // 并发数
  concurrency: 2,

  // 重试次数
  retries: 3,

  // 断点续存间隔（每 N 次请求存一次进度）
  checkpointEvery: 50,

  // 输出文件
  outputFile: path.join(__dirname, '..', 'data', 'egg-lookup-db.json'),
  stateFile: path.join(__dirname, '..', 'data', '.egg-scrape-state.json'),
};

// ── 工具函数 ──────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fmt(n) {
  // 避免浮点精度问题，比如 0.30000000000000004
  return Number(n.toFixed(3));
}

function* generateParams() {
  const { heightRange, weightRange, eggTypes } = CONFIG;
  const eggs = eggTypes.length > 0 ? eggTypes : [{ label: null, value: null }];

  for (const egg of eggs) {
    for (let h = heightRange.min; h <= heightRange.max; h = fmt(h + heightRange.step)) {
      for (let w = weightRange.min; w <= weightRange.max; w = fmt(w + weightRange.step)) {
        yield {
          height_m: fmt(h),
          weight_kg: fmt(w),
          random_egg_item_id: egg.value,
          eggLabel: egg.label,
        };
      }
    }
  }
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
  } catch {
    return { completed: new Set(), results: [] };
  }
}

function saveState(state) {
  const ser = {
    completed: Array.from(state.completed),
    results: state.results,
    lastSave: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(CONFIG.stateFile), { recursive: true });
  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(ser, null, 2));
}

function saveFinalDb(state) {
  // 去重：以 (petName, height, weight, eggType) 为键
  const seen = new Set();
  const deduped = [];

  for (const r of state.results) {
    for (const pet of r.pets || []) {
      const key = `${pet.display_name}::${r.query.height_m}::${r.query.weight_kg}::${r.query.eggType || 'none'}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push({
        petName: pet.display_name,
        speciesCode: pet.species_code || null,
        typeName: pet.type_name || null,
        matchProbability: pet.match_probability_text || pet.match_probability || null,
        fitScore: pet.fit_score || null,
        height_m: r.query.height_m,
        weight_kg: r.query.weight_kg,
        eggType: r.query.eggType || null,
        eggId: r.query.eggId || null,
        hatchTime: r.query.hatchTime || null,
      });
    }
  }

  const db = {
    meta: {
      scrapedAt: new Date().toISOString(),
      totalQueries: state.completed.size,
      totalRecords: deduped.length,
      source: CONFIG.apiBase,
      config: {
        heightRange: CONFIG.heightRange,
        weightRange: CONFIG.weightRange,
        eggTypes: CONFIG.eggTypes,
      },
    },
    records: deduped,
  };

  fs.mkdirSync(path.dirname(CONFIG.outputFile), { recursive: true });
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(db, null, 2));
  console.log(`\n💾 数据库已保存: ${CONFIG.outputFile}`);
  console.log(`   总查询: ${db.meta.totalQueries}, 去重记录: ${db.meta.totalRecords}`);
}

// ── 请求函数 ──────────────────────────────────────────
async function fetchOnce(params, attempt = 1) {
  const url = new URL(CONFIG.apiBase);
  url.searchParams.set('height_m', String(params.height_m));
  url.searchParams.set('weight_kg', String(params.weight_kg));
  if (params.random_egg_item_id != null) {
    url.searchParams.set('random_egg_item_id', String(params.random_egg_item_id));
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
        'Referer': 'https://roco.gptvip.chat/hatch-query',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    if (attempt < CONFIG.retries) {
      await sleep(CONFIG.delayMs * attempt);
      return fetchOnce(params, attempt + 1);
    }
    throw err;
  }
}

// ── 主循环 ────────────────────────────────────────────
async function main() {
  const state = loadState();
  state.completed = new Set(state.completed);
  if (!state.results) state.results = [];

  const paramsList = Array.from(generateParams());
  const total = paramsList.length;
  const pending = paramsList.filter((p) => {
    const key = `${p.height_m},${p.weight_kg},${p.random_egg_item_id || ''}`;
    return !state.completed.has(key);
  });

  console.log(`🔍 总参数组合: ${total}`);
  console.log(`✅ 已完成: ${state.completed.size}`);
  console.log(`⏳ 待扫描: ${pending.length}`);
  console.log(`⏱️ 预计耗时: ~${Math.round((pending.length * CONFIG.delayMs) / CONFIG.concurrency / 1000 / 60)} 分钟\n`);

  if (pending.length === 0) {
    console.log('所有数据已采集完毕，直接生成数据库...');
    saveFinalDb(state);
    return;
  }

  let processed = 0;
  let errors = 0;
  let foundPets = 0;

  async function worker(batch) {
    for (const p of batch) {
      const key = `${p.height_m},${p.weight_kg},${p.random_egg_item_id || ''}`;

      if (state.completed.has(key)) continue;

      try {
        const data = await fetchOnce(p);
        processed++;

        const pets = data.matched || [];
        foundPets += pets.length;

        state.results.push({
          query: {
            height_m: p.height_m,
            weight_kg: p.weight_kg,
            eggType: p.eggLabel,
            eggId: p.random_egg_item_id,
          },
          ok: data.ok,
          matchedCount: data.matched_count || 0,
          pets: pets.map((m) => ({
            display_name: m.display_name,
            species_code: m.pet_preview?.species_code || null,
            type_name: m.pet_preview?.type_name || null,
            match_probability: m.match_probability,
            match_probability_text: m.match_probability_text,
            fit_score: m.fit_score,
            avatar_url: m.pet_preview?.avatar_url || null,
          })),
        });

        state.completed.add(key);

        if (state.completed.size % CONFIG.checkpointEvery === 0) {
          saveState(state);
          console.log(`  💾 检查点已保存 (${state.completed.size}/${total})`);
        }

        // 发现非空结果时打印一下
        if (pets.length > 0) {
          const names = pets.map((x) => x.display_name).join(', ');
          console.log(`  [${p.height_m}m / ${p.weight_kg}kg] → ${pets.length} 只: ${names}`);
        }
      } catch (err) {
        processed++;
        errors++;
        console.error(`  ❌ 失败 [${p.height_m}m / ${p.weight_kg}kg]: ${err.message}`);
        // 失败的也标记为已完成，避免无限重试卡死
        state.completed.add(key);
      }

      await sleep(CONFIG.delayMs);
    }
  }

  // 分批并发
  const batchSize = Math.ceil(pending.length / CONFIG.concurrency);
  const batches = [];
  for (let i = 0; i < CONFIG.concurrency; i++) {
    batches.push(pending.slice(i * batchSize, (i + 1) * batchSize));
  }

  await Promise.all(batches.map((b) => worker(b)));

  saveState(state);
  saveFinalDb(state);

  console.log(`\n📊 统计: 成功 ${processed - errors}, 失败 ${errors}, 发现精灵 ${foundPets}`);
  console.log(`🗑️ 删除 ${CONFIG.stateFile} 可清空进度重新采集`);
}

main().catch((err) => {
  console.error('脚本异常:', err);
  process.exit(1);
});
