import { useState } from 'react';
import { IconEgg, IconCode, IconSparkle, IconQuestion } from './Icon';
import { petKeys, shinyKeys } from '../data';

interface Props {
  onStart: () => void;
  onQuickTest: (petKey: string, forceShiny?: boolean) => void;
}

const bgPets = [
  'https://patchwiki.biligame.com/images/rocom/4/4f/627a47xjvghn9okifk66vhsx4uv7101.png',
  'https://patchwiki.biligame.com/images/rocom/5/50/33by7ml0nsrsxxq1l8l2uj4izqnuwpd.png',
  'https://patchwiki.biligame.com/images/rocom/2/25/o64cvcxq1l6tlur77xjqbwx2s4imabd.png',
  'https://patchwiki.biligame.com/images/rocom/1/12/ixakouy2o2kjsl0ytlhtdzhoukgoq3o.png',
  'https://patchwiki.biligame.com/images/rocom/8/8e/f72t0l1mbisw4ehkivz7pdpbcqkosus.png',
  'https://patchwiki.biligame.com/images/rocom/4/40/lbxi6r2yicliuipn8dp7n5pk90xfjo4.png',
];

export default function IntroScreen({ onStart, onQuickTest }: Props) {
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <div className="fade-in">
      <div className="hero card hero-minimal">
        <div className="hero-bg-pets">
          {bgPets.map((src, i) => (
            <div key={i} className="bg-pet">
              <img src={src} alt="" />
            </div>
          ))}
        </div>
        <div className="eyebrow">
          <IconEgg size={14} /> 洛克王国 · 精灵性格测试
        </div>
        <h1>MBTI 已经过时，<br />RocoTI 来了。</h1>
        <div className="sub">
          12 道灵魂拷问，测出你的本命精灵。<br />
          不是你在选宠物，是宠物在选你。
        </div>
        <div className="hero-actions hero-actions-single">
          <button className="btn-primary" onClick={onStart}>开始测试</button>
        </div>
        <div className="intro-tip">异色稀有觉醒 · 深度性格解读 · 隐藏存档</div>
      </div>

      {import.meta.env.DEV && (
        <div className="debug-panel">
          <div className="debug-header" onClick={() => setDebugOpen((v) => !v)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconCode size={14} /> 开发者调试面板
            </span>
            <span style={{ fontSize: 10 }}>点击展开/折叠</span>
          </div>
          {debugOpen && (
            <div>
              <div className="debug-section">原色精灵（直接跳转结果）</div>
              <div className="debug-btns">
                {petKeys.map((key) => (
                  <button
                    key={key}
                    className="btn-secondary debug-btn"
                    onClick={() => onQuickTest(key, false)}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="debug-section" style={{ marginTop: 12 }}>异色精灵（强制 shiny）</div>
              <div className="debug-btns">
                {shinyKeys.map((key) => (
                  <button
                    key={`shiny-${key}`}
                    className="btn-secondary debug-btn"
                    style={{
                      borderColor: '#e8b86d',
                      color: '#c28a2c',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onClick={() => onQuickTest(key, true)}
                  >
                    <IconSparkle size={12} />
                    {key}
                  </button>
                ))}
              </div>
              <div className="debug-section" style={{ marginTop: 12 }}>兜底（强制 fallback）</div>
              <div className="debug-btns">
                <button
                  className="btn-secondary debug-btn"
                  style={{
                    borderColor: '#8c6ab0',
                    color: '#6a4a8e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onClick={() => onQuickTest('果冻', false)}
                >
                  <IconQuestion size={12} />
                  果冻
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="footer-brand">
        <IconEgg size={14} /> 全平台同号：温泉蛋不emo
        <br />
        制作不易，求关注
      </div>
    </div>
  );
}
