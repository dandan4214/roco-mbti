/**
 * 洛克王国孵蛋 Wiki 数据采集脚本
 * 目标: https://luokewangguofudan.wiki/
 *
 * 用法:
 *   cd scripts && node scrape-wiki-egg-data.cjs
 *
 * 输出: ../data/wiki-egg-db.json
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  delayMs: 600,
  concurrency: 3,
  retries: 2,
  checkpointEvery: 30,
  outputFile: path.join(__dirname, '..', 'data', 'wiki-egg-db.json'),
  stateFile: path.join(__dirname, '..', 'data', '.wiki-scrape-state.json'),
};

// 探测到的有效扫描范围
// 尺寸 0.04~0.65m，体重 0.04~10kg 覆盖大部分精灵
// 超过此范围只剩 No.191 果冻
function* generateScanPoints() {
  const sizes = [];
  const weights = [];

  // 小精灵区域（密集）
  for (let s = 0.04; s <= 0.25; s = round(s + 0.02)) sizes.push(s);
  // 中等精灵区域
  for (let s = 0.27; s <= 0.45; s = round(s + 0.03)) sizes.push(s);
  // 大精灵区域
  for (let s = 0.48; s <= 0.65; s = round(s + 0.04)) sizes.push(s);

  // 体重扫描点（密集）
  for (let w = 0.04; w <= 1.0; w = round(w + 0.08)) weights.push(w);
  for (let w = 1.1; w <= 3.0; w = round(w + 0.15)) weights.push(w);
  for (let w = 3.2; w <= 6.0; w = round(w + 0.30)) weights.push(w);
  for (let w = 6.5; w <= 10.0; w = round(w + 0.50)) weights.push(w);

  const combos = [];
  for (const s of sizes) {
    for (const w of weights) {
      combos.push({ size: s, weight: w });
    }
  }

  // 随机打乱，避免连续请求相同区域
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }

  for (const c of combos) yield c;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadState() {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    return {
      completed: new Set(raw.completed),
      pets: raw.pets || {},
    };
  } catch {
    return { completed: new Set(), pets: {} };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(CONFIG.stateFile), { recursive: true });
  fs.writeFileSync(
    CONFIG.stateFile,
    JSON.stringify(
      {
        completed: Array.from(state.completed),
        pets: state.pets,
        lastSave: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

function saveFinalDb(state) {
  const records = Object.values(state.pets).sort((a, b) => a.no - b.no);
  const db = {
    meta: {
      scrapedAt: new Date().toISOString(),
      source: 'https://luokewangguofudan.wiki/',
      totalQueries: state.completed.size,
      totalPets: records.length,
    },
    records,
  };
  fs.mkdirSync(path.dirname(CONFIG.outputFile), { recursive: true });
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(db, null, 2));
  console.log(`\n💾 数据库已保存: ${CONFIG.outputFile}`);
  console.log(`   总查询: ${db.meta.totalQueries}, 精灵数: ${db.meta.totalPets}`);
}

// 从 HTML 提取所有精灵数据
function extractPets(html) {
  const pets = {};

  // 匹配模式：No.XXX ... <h3>名字</h3> ... 典型尺寸 ... 典型重量
  // 用 article 标签作为卡片边界
  const articlePattern = /<article[^\u003e]*>([\s\S]*?)<\/article>/g;

  let m;
  while ((m = articlePattern.exec(html)) !== null) {
    const card = m[1];

    const noMatch = card.match(/No\.(\d+)/);
    if (!noMatch) continue;
    const no = parseInt(noMatch[1], 10);

    const nameMatch = card.match(/<h3[^\u003e]*>([^\u003c]+)<\/h3>/);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();

    const sizeMatch = card.match(/典型尺寸[\s\S]*?\u003cp[^\u003e]*>([\d.]+-[\d.]+)\s*m\u003c\/p>/);
    const sizeRange = sizeMatch ? sizeMatch[1] : null;

    const weightMatch = card.match(/典型重量[\s\S]*?\u003cp[^\u003e]*>([\d.]+-[\d.]+)\s*kg\u003c\/p>/);
    const weightRange = weightMatch ? weightMatch[1] : null;

    const isRideable = card.includes('?同乘') || card.includes('同乘');

    // 图片 URL
    const imgMatch = card.match(/src=\"([^\"]+boboluo[^\"]*)\"/) || card.match(/src=\"([^\"]*friends[^\"]*)\"/);
    const imgUrl = imgMatch ? imgMatch[1] : null;

    pets[no] = {
      no,
      name,
      sizeRange,
      weightRange,
      isRideable,
      imgUrl,
    };
  }

  return pets;
}

async function fetchPage(size, weight, attempt = 1) {
  const url = `https://luokewangguofudan.wiki/?size=${size}&weight=${weight}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt < CONFIG.retries) {
      await sleep(CONFIG.delayMs * attempt);
      return fetchPage(size, weight, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  const state = loadState();
  state.completed = new Set(state.completed);
  if (!state.pets) state.pets = {};

  const allPoints = Array.from(generateScanPoints());
  const total = allPoints.length;
  const pending = allPoints.filter((p) => {
    const key = `${p.size},${p.weight}`;
    return !state.completed.has(key);
  });

  console.log(`🔍 总扫描点: ${total}`);
  console.log(`✅ 已完成: ${state.completed.size}`);
  console.log(`⏳ 待扫描: ${pending.length}`);
  console.log(`📦 已收集精灵: ${Object.keys(state.pets).length}`);
  console.log(`⏱️ 预计耗时: ~${Math.round((pending.length * CONFIG.delayMs) / CONFIG.concurrency / 1000 / 60)} 分钟\n`);

  if (pending.length === 0) {
    console.log('所有扫描已完成，生成数据库...');
    saveFinalDb(state);
    return;
  }

  let processed = 0;
  let errors = 0;
  let newPets = 0;

  async function worker(batch) {
    for (const p of batch) {
      const key = `${p.size},${p.weight}`;
      if (state.completed.has(key)) continue;

      try {
        const html = await fetchPage(p.size, p.weight);
        processed++;

        const found = extractPets(html);
        const foundCount = Object.keys(found).length;

        for (const [no, pet] of Object.entries(found)) {
          if (!state.pets[no]) {
            state.pets[no] = pet;
            newPets++;
          }
        }

        state.completed.add(key);

        if (state.completed.size % CONFIG.checkpointEvery === 0) {
          saveState(state);
          const petCount = Object.keys(state.pets).length;
          console.log(`  💾 检查点 (${state.completed.size}/${total}) | 已收集 ${petCount} 只精灵`);
        }

        if (foundCount > 0) {
          const names = Object.values(found).map((x) => x.name).join(', ');
          console.log(`  [${p.size}m/${p.weight}kg] → ${foundCount} 只: ${names}`);
        }
      } catch (err) {
        processed++;
        errors++;
        console.error(`  ❌ [${p.size}m/${p.weight}kg]: ${err.message}`);
        state.completed.add(key);
      }

      await sleep(CONFIG.delayMs);
    }
  }

  const batchSize = Math.ceil(pending.length / CONFIG.concurrency);
  const batches = [];
  for (let i = 0; i < CONFIG.concurrency; i++) {
    batches.push(pending.slice(i * batchSize, (i + 1) * batchSize));
  }

  await Promise.all(batches.map((b) => worker(b)));

  saveState(state);
  saveFinalDb(state);

  console.log(`\n📊 统计: 成功 ${processed - errors}, 失败 ${errors}, 新增精灵 ${newPets}`);
  console.log(`🗑️ 删除 ${CONFIG.stateFile} 可清空进度重新采集`);
}

main().catch((err) => {
  console.error('脚本异常:', err);
  process.exit(1);
});
