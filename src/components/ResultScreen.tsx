import { useState, useEffect } from 'react';
import {
  results,
  shinyPets,
  fallbackResult,
  dimensionOrder,
  dimExplanations,
  dimensionMeta,
} from '../data';
import {
  findPetInfo,
  getRoleDesc,
  getBattleStyle,
  getBreedPhilosophy,
  getSocialMode,
  SHARE_URL,
  track,
} from '../utils';
import type { QuizResult } from '../types';
import RadarChart from './RadarChart';
import ShareCard from './ShareCard';
import PosterCanvas from './PosterCanvas';
import {
  IconSparkle,
  IconTrophy,
  IconDocument,
  IconChart,
  IconRadar,
  IconCastle,
  IconSwords,
  IconEgg,
  IconPeople,
  IconMask,
  IconGamepad,
  IconChat,
  IconMegaphone,
  IconImage,
  IconClose,
} from './Icon';

interface Props {
  result: QuizResult;
  onRestart: () => void;
  onShare: () => void;
  onViewCollection: () => void;
  rankInfo: { rankText: string; isRare: boolean };
}

export default function ResultScreen({
  result,
  onRestart,
  onShare,
  onViewCollection,
  rankInfo,
}: Props) {
  const [shinyShow, setShinyShow] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);
  const [revealing, setRevealing] = useState(true);
  const [revealExiting, setRevealExiting] = useState(false);

  // 1.2s reveal countdown before showing result
  useEffect(() => {
    const exitId = setTimeout(() => setRevealExiting(true), 1200);
    const doneId = setTimeout(() => setRevealing(false), 1500);
    return () => {
      clearTimeout(exitId);
      clearTimeout(doneId);
    };
  }, []);

  const isShiny = !!result.shinyAwaken;
  const r = result.isFallback
    ? fallbackResult
    : isShiny
      ? shinyPets[result.shinyAwaken!]
      : results[result.best.pet];

  useEffect(() => {
    if (isShiny && r.shinyImg) {
      const id = setInterval(() => setShinyShow((v) => !v), 1500);
      return () => clearInterval(id);
    }
  }, [isShiny, r.shinyImg]);

  const shareToWeibo = () => {
    track('share_click', { channel: 'weibo' });
    const text = `我在洛克王国性格测试测出了「${r.name}」！快来测测你是哪种精灵 →`;
    const url = SHARE_URL;
    window.open(
      'https://service.weibo.com/share/share.php?title=' +
        encodeURIComponent(text) +
        '&url=' +
        encodeURIComponent(url)
    );
  };

  const shareToWechat = () => {
    track('share_click', { channel: 'wechat' });
    alert('请截图分享到朋友圈，或点击右上角「···」发送给朋友');
  };

  const copyShareText = () => {
    const text =
      `我在【洛克王国精灵性格测试】测出了「${r.name}」\n` +
      `${r.tags.slice(0, 3).join(' · ')}\n` +
      `${r.intro}\n\n` +
      `快来测测你是哪种精灵 → ${SHARE_URL}`;
    navigator.clipboard.writeText(text).then(() => alert('文案已复制！去分享吧'));
  };

  const sec = result.ranked[1];
  const hiddenPet = sec && sec.similarity > 0 ? findPetInfo(sec.pet) : null;

  const matchText = result.isFallback
    ? '精灵图鉴查无此蛋'
    : isShiny
      ? `稀有度 ${Math.round(result.shinyScore * 100)}%`
      : `匹配度 ${result.best.similarity}%`;

  // Headline: 醒目的一句话总结
  const getHeadline = () => {
    if (result.isFallback) {
      return `你的灵魂成分太复杂，连系统都崩了——最终强制分配：${r.name}`;
    }
    if (isShiny) {
      return `隐藏基因觉醒！你的体内沉睡着「${r.name}」的稀有血脉`;
    }
    const mainPet = results[result.best.pet];
    if (sec && sec.similarity > 0) {
      // Normalize the two top similarities into a 100% partition so the
      // headline reads as a real "X% + Y% = 100%" soul-composition split,
      // instead of two independent match scores that confuse readers.
      const total = result.best.similarity + sec.similarity;
      const mainPct = Math.round((result.best.similarity / total) * 100);
      const secPct = 100 - mainPct;
      return `你的灵魂成分是 ${mainPct}%「${mainPet.name}」+ ${secPct}%「${sec.pet}」的混合体`;
    }
    return `你的灵魂纯度高达 ${result.best.similarity}%——是「${mainPet.name}」本灵`;
  };

  if (revealing) {
    const revealMain = result.isFallback
      ? '正在协调灵魂数据'
      : isShiny
        ? '检测到稀有共鸣'
        : '正在唤醒你的精灵';
    const revealSub = result.isFallback
      ? '系统遇到了一些不寻常的灵魂频率…'
      : isShiny
        ? '一段沉睡的血脉正在苏醒…'
        : '解析你的性格 DNA，匹配本命精灵…';

    return (
      <div className={`reveal-overlay card ${revealExiting ? 'reveal-fade-out' : ''}`}>
        <div className="reveal-orb-wrap">
          <div className="reveal-ring reveal-ring-1" />
          <div className="reveal-ring reveal-ring-2" />
          <div className="reveal-ring reveal-ring-3" />
          <div className="reveal-egg" />
        </div>
        <div className="reveal-text">
          {revealMain}
          <span className="reveal-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
        <div className="reveal-sub">{revealSub}</div>
        <div className="reveal-progress">
          <div className="reveal-progress-bar" />
        </div>
      </div>
    );
  }

  return (
    <div className="result-wrap card fade-in">
      <div className="result-layout">
        <div className="result-top">
          <div className="poster-box">
            {isShiny && !result.isFallback && (
              <div className="shiny-badge"><IconSparkle size={14} /> 异色稀有觉醒</div>
            )}
            {r.img || r.normalImg ? (
              <div
                className={`poster-img-wrap ${isShiny && r.shinyImg ? 'shiny-glow' : ''} ${shinyShow ? 'shiny-show' : ''}`}
              >
                <img
                  className="poster-normal"
                  src={r.normalImg || r.img}
                  alt={r.name}
                />
                {r.shinyImg && (
                  <img className="poster-shiny" src={r.shinyImg} alt={r.name} />
                )}
              </div>
            ) : (
              <div className="poster-emoji"><IconEgg size={88} /></div>
            )}
            <div className="poster-caption">{r.intro}</div>
          </div>
          <div className="type-box">
            <div className="type-kicker">
              {result.isFallback
                ? '系统强制兜底'
                : isShiny
                  ? '异色稀有觉醒'
                  : '你的本命精灵'}
            </div>
            <div className="type-name">{r.name}</div>
            <div className="match">{matchText}</div>
            <div className="type-subname">
              {result.isFallback
                ? '你的思维回路过于清奇，已被系统强制分配'
                : r.tags.slice(0, 3).join(' · ')}
            </div>
          </div>
        </div>

        {/* Rank info */}
        <div
          style={{
            border: `1px dashed ${rankInfo.isRare ? '#fbbf24' : 'var(--accent)'}`,
            borderRadius: 14,
            padding: '14px 16px',
            background: rankInfo.isRare
              ? 'linear-gradient(180deg,#fffbeb,#fef3c7)'
              : 'linear-gradient(180deg,#f8fff8,#f3f8f4)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: rankInfo.isRare ? '#b45309' : 'var(--accent-strong)',
              fontWeight: 700,
              lineHeight: 1.6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <IconTrophy size={16} />
            {rankInfo.rankText}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            background: 'linear-gradient(135deg,var(--soft),#f8fff8)',
            border: '1px solid var(--line)',
            borderRadius: 18,
            padding: '18px 16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.7,
            }}
          >
            {getHeadline()}
          </div>
        </div>

        {isShiny && !result.isFallback && (
          <div className="awaken-box">
            <p>
              你体内沉睡着异色精灵的力量。在特定的时刻，{r.name}
              的特质会在你身上觉醒。这种隐藏极深的灵魂共鸣，被我们称之为——觉醒。恭喜你，你是少数被选中的人。
            </p>
          </div>
        )}

        <div className="analysis-box">
          <h3><IconDocument size={16} /> 性格解读</h3>
          <p>{r.desc + (r.deepDesc ? '\n\n' + r.deepDesc : '')}</p>
          <div className="tags-row">
            {r.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="dim-box">
          <h3><IconChart size={16} /> 性格维度</h3>
          <div className="dim-list">
            {dimensionOrder.map((dim) => {
              const score = result.dimScores[dim] || 0;
              const level = result.levels[dim];
              return (
                <div key={dim} className="dim-item">
                  <div className="dim-item-top">
                    <div className="dim-item-name">{dimensionMeta[dim].name}</div>
                    <div className="dim-item-score">
                      {{ L: '低', M: '中', H: '高' }[level] || level}· {score}分
                    </div>
                  </div>
                  <p>{dimExplanations[dim]?.[level] || ''}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="radar-box">
          <h3><IconRadar size={16} /> 五维雷达图</h3>
          <RadarChart scores={result.dimScores} />
        </div>

        <div className="role-box">
          <h3><IconCastle size={16} /> 你的王国定位</h3>
          <div dangerouslySetInnerHTML={{ __html: getRoleDesc(result.dimScores, r.name) }} />
        </div>

        <div className="battle-box">
          <h3><IconSwords size={16} /> 你的战斗流派</h3>
          <div dangerouslySetInnerHTML={{ __html: getBattleStyle(result.dimScores, r.name) }} />
        </div>

        <div className="breed-box">
          <h3><IconEgg size={16} /> 你的孵蛋哲学</h3>
          <div dangerouslySetInnerHTML={{ __html: getBreedPhilosophy(result.dimScores, r.name) }} />
        </div>

        <div className="social-box">
          <h3><IconPeople size={16} /> 你的社交模式</h3>
          <div dangerouslySetInnerHTML={{ __html: getSocialMode(result.dimScores, r.name) }} />
        </div>

        <div className="hidden-box">
          <h3><IconMask size={16} /> 隐藏副性格</h3>
          {hiddenPet ? (
            <div>
              <div className="hidden-pet">
                {hiddenPet.img ? (
                  <img src={hiddenPet.img} alt={sec!.pet} />
                ) : (
                  <div className="ce"><IconEgg size={28} /></div>
                )}
                <div>
                  <div className="hidden-name">{sec!.pet}</div>
                  <div className="hidden-sim">相似度 {sec!.similarity}%</div>
                </div>
              </div>
              {sec!.similarity === result.best.similarity ? (
                <p className="hidden-desc">
                  你和「{sec!.pet}」也有极深的灵魂共鸣——你的性格就像一颗多面体，
                  同时被两种精灵选中。这种「双重灵魂」极其罕见，
                  意味着你既有{r.name}的锋芒，也有{sec!.pet}的底色。
                </p>
              ) : (
                <p className="hidden-desc">
                  在你的主性格之下，还沉睡着{sec!.pet}
                  的影子。它代表了你性格中那些被主流气质掩盖的侧面——也许是你自己都没意识到的另一面。
                </p>
              )}
            </div>
          ) : (
            <p className="hidden-desc">
              你的性格特质非常独特，暂时没有明显的第二倾向。
            </p>
          )}
        </div>

        <div className="note-box">
          <h3><IconGamepad size={16} /> 友情提示</h3>
          <p>
            {result.isFallback
              ? '本测试仅供娱乐。果冻兜底属于作者故意埋的彩蛋，请勿把它当成医学、心理学、相学、命理学或精灵图鉴依据。'
              : isShiny
                ? '本测试仅供娱乐。异色觉醒是基于特定答题模式触发的彩蛋机制，不代表你真的能变身成那只精灵。不过……万一呢？'
                : '本测试仅供娱乐，别拿它当诊断、面试、相亲、分手、招魂、算命或人生判决书。你可以笑，但别太当真。'}
          </p>
        </div>
      </div>

      <div className="cta-box">
        <p>
          <IconRadar size={16} />
          {' '}邀请好友一起测，看看谁是真正的「稀有觉醒」
        </p>
        <div className="share-btns">
          <button className="share-btn wx" onClick={shareToWechat}>
            <IconChat size={16} /> 微信分享
          </button>
          <button className="share-btn wb" onClick={shareToWeibo}>
            <IconMegaphone size={16} /> 微博分享
          </button>
          <button className="share-btn" onClick={() => { track('poster_open'); setPosterOpen(true); }}>
            <IconImage size={16} /> 生成海报
          </button>
        </div>
      </div>

      <div className="result-actions">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => { track('restart_click'); onRestart(); }}>
            重新测试
          </button>
          <button className="btn-primary" onClick={onShare}>
            分享结果
          </button>
          <button className="btn-secondary" onClick={() => { track('collection_view'); onViewCollection(); }}>
            <IconTrophy size={14} /> 查看图鉴
          </button>
        </div>
      </div>

      <div className="footer-brand"><IconEgg size={14} /> 洛克王国孵蛋查询工具 · 全平台同号：温泉蛋不emo</div>

      <ShareCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        name={r.name}
        sub={r.tags.slice(0, 3).join(' · ')}
        img={r.normalImg || r.img}
        quote={r.intro}
        onShareWechat={shareToWechat}
        onCopyText={copyShareText}
      />

      {/* Poster Modal */}
      {posterOpen && (
        <div
          className="share-card"
          onClick={() => setPosterOpen(false)}
        >
          <div
            className="share-card-inner"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div
              className="share-card-close"
              onClick={() => setPosterOpen(false)}
            >
              <IconClose size={18} />
            </div>
            <PosterCanvas
              name={r.name}
              sub={r.tags.slice(0, 3).join(' · ')}
              img={r.normalImg || r.img || ''}
              quote={r.intro}
              matchText={matchText}
              tag={r.type}
              isShiny={isShiny}
              isFallback={result.isFallback}
              rankText={rankInfo.rankText}
            />
          </div>
        </div>
      )}
    </div>
  );
}
