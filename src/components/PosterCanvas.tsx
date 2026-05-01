import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { IconHandPoint, IconShare, IconSave } from './Icon';
import { SHARE_URL } from '../utils';

interface Props {
  name: string;
  sub: string;
  img: string;
  quote: string;
  matchText: string;
  tag: string;
  isShiny: boolean;
  isFallback: boolean;
  rankText: string;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

// ── Theme palette per variant ──
type Theme = {
  // frame metal gradient stops (7 colors for richer shine)
  frame: string[];
  // bright shine band peak color
  shineBand: string;
  // diagonal streak color (very bright)
  streak: string;
  // inner panel gradient (top → bottom)
  panel: [string, string, string];
  // text colors
  txtMain: string;
  txtSub: string;
  txtAccent: string;
  // ribbon banner gradient
  ribbon: [string, string, string];
  ribbonText: string;
  // accent ornament color (matches frame metal)
  ornament: string;
  // gem color for type badge
  gemCore: string;
  gemEdge: string;
  // foil sparkle base color
  sparkle: string;
  // pet glow color (radial behind pet)
  petGlow: string;
  // holo bands tint (8 colors for rainbow)
  rainbow: string[];
  // crosshatch stripe color (foil texture)
  hatch: string;
};

function getTheme(isShiny: boolean, isFallback: boolean): Theme {
  if (isShiny) {
    // Pokémon "secret rare" gold
    return {
      frame: [
        '#5a3812', '#9a6a1c', '#e0b048', '#fff4b8',
        '#e0b048', '#9a6a1c', '#5a3812',
      ],
      shineBand: '#fff8d4',
      streak: 'rgba(255,250,210,0.7)',
      panel: ['#1a2820', '#142421', '#0d1a18'],
      txtMain: '#fff5d8',
      txtSub: 'rgba(255,245,216,0.78)',
      txtAccent: '#f8dc88',
      ribbon: ['#8a6018', '#f3d275', '#8a6018'],
      ribbonText: '#fff7d8',
      ornament: '#f8dc88',
      gemCore: '#fff4b8',
      gemEdge: '#a87018',
      sparkle: '255,238,170',
      petGlow: 'rgba(255,232,150,',
      rainbow: [
        'rgba(255,80,140,0.10)',
        'rgba(255,200,80,0.10)',
        'rgba(255,240,140,0.12)',
        'rgba(120,230,150,0.10)',
        'rgba(80,170,230,0.10)',
        'rgba(180,120,230,0.10)',
        'rgba(255,150,180,0.10)',
        'rgba(255,200,80,0.10)',
      ],
      hatch: 'rgba(255,240,180,0.04)',
    };
  }
  if (isFallback) {
    // "secret rare" purple/dusk for fallback (果冻)
    return {
      frame: [
        '#3a1c50', '#6c3a8c', '#b07ad0', '#f0d4ff',
        '#b07ad0', '#6c3a8c', '#3a1c50',
      ],
      shineBand: '#f6dfff',
      streak: 'rgba(245,220,255,0.65)',
      panel: ['#3d2a4a', '#2f1f3e', '#211432'],
      txtMain: '#fff0ff',
      txtSub: 'rgba(255,240,255,0.78)',
      txtAccent: '#f0c6ff',
      ribbon: ['#5a2870', '#c594dd', '#5a2870'],
      ribbonText: '#fff5ff',
      ornament: '#f0c6ff',
      gemCore: '#f5d4ff',
      gemEdge: '#7a3098',
      sparkle: '240,200,255',
      petGlow: 'rgba(220,160,255,',
      rainbow: [
        'rgba(255,100,200,0.10)',
        'rgba(200,140,255,0.10)',
        'rgba(140,200,255,0.10)',
        'rgba(255,200,255,0.12)',
        'rgba(180,255,200,0.10)',
        'rgba(255,200,140,0.10)',
        'rgba(220,180,255,0.10)',
        'rgba(255,140,200,0.10)',
      ],
      hatch: 'rgba(240,200,255,0.04)',
    };
  }
  // normal — silver/pearl with green undertone
  return {
    frame: [
      '#5e7060', '#90a594', '#cfdfd0', '#f6fbf5',
      '#cfdfd0', '#90a594', '#5e7060',
    ],
    shineBand: '#f8fcf6',
    streak: 'rgba(252,255,250,0.75)',
    panel: ['#fafdf7', '#f1f7ed', '#e6efe2'],
    txtMain: '#1e2a22',
    txtSub: '#5a6a5e',
    txtAccent: '#4d6a53',
    ribbon: ['#3e5944', '#9bb89e', '#3e5944'],
    ribbonText: '#fcfff9',
    ornament: '#4d6a53',
    gemCore: '#f4f9f0',
    gemEdge: '#3e5944',
    sparkle: '180,210,180',
    petGlow: 'rgba(180,210,180,',
    rainbow: [],
    hatch: 'rgba(108,141,113,0.025)',
  };
}

export default function PosterCanvas({
  name,
  sub,
  img,
  quote,
  matchText,
  tag,
  isShiny,
  isFallback,
  rankText,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [canShareFile, setCanShareFile] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 750;
    const H = 1050;
    canvas.width = W;
    canvas.height = H;

    let cancelled = false;
    setDataUrl('');

    (async () => {
      const theme = getTheme(isShiny, isFallback);

      const qrDataUrl = await QRCode.toDataURL(SHARE_URL, {
        width: 240,
        margin: 0,
        color: { dark: '#1e2a22', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });

      const [petImg, qrImg] = await Promise.all([loadImage(img), loadImage(qrDataUrl)]);

      if (cancelled) return;
      drawPoster(ctx, W, H, theme, petImg, qrImg);
      setDataUrl(canvas.toDataURL('image/png'));
    })().catch(() => {
      // fallback: still expose blank image so UI doesn't hang
      if (!cancelled && canvasRef.current) {
        setDataUrl(canvasRef.current.toDataURL('image/png'));
      }
    });

    function drawPoster(
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      t: Theme,
      petImg: HTMLImageElement | null,
      qrImg: HTMLImageElement | null
    ) {
      // ── Layer 0: outer black backdrop ──
      ctx.fillStyle = '#0a0e0c';
      ctx.fillRect(0, 0, W, H);

      // ── Layer 1: metallic frame (multi-shine) ──
      const frameRadius = 30;
      const frameInset = 18;
      const innerX = frameInset;
      const innerY = frameInset;
      const innerW = W - frameInset * 2;
      const innerH = H - frameInset * 2;
      const innerRadius = frameRadius - 6;

      // Base frame gradient — diagonal, 7-stop for true metallic feel
      const frameGrad = ctx.createLinearGradient(0, 0, W, H);
      const stops = t.frame;
      for (let i = 0; i < stops.length; i++) {
        frameGrad.addColorStop(i / (stops.length - 1), stops[i]);
      }
      ctx.fillStyle = frameGrad;
      roundRect(ctx, 0, 0, W, H, frameRadius);
      ctx.fill();

      // Secondary shine bands — vertical, two bright peaks
      const bandGrad = ctx.createLinearGradient(0, 0, 0, H);
      bandGrad.addColorStop(0.0, 'rgba(255,255,255,0)');
      bandGrad.addColorStop(0.18, 'rgba(255,255,255,0)');
      bandGrad.addColorStop(0.24, t.shineBand + 'cc');
      bandGrad.addColorStop(0.30, 'rgba(255,255,255,0)');
      bandGrad.addColorStop(0.70, 'rgba(255,255,255,0)');
      bandGrad.addColorStop(0.76, t.shineBand + '99');
      bandGrad.addColorStop(0.82, 'rgba(255,255,255,0)');
      bandGrad.addColorStop(1.0, 'rgba(255,255,255,0)');
      ctx.fillStyle = bandGrad;
      ctx.globalAlpha = 0.5;
      roundRect(ctx, 0, 0, W, H, frameRadius);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Diagonal shine streak (the iconic TCG foil glint)
      ctx.save();
      roundRect(ctx, 0, 0, W, H, frameRadius);
      ctx.clip();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 5);
      const streakGrad = ctx.createLinearGradient(-W, 0, W, 0);
      streakGrad.addColorStop(0.0, 'rgba(255,255,255,0)');
      streakGrad.addColorStop(0.42, 'rgba(255,255,255,0)');
      streakGrad.addColorStop(0.5, t.streak);
      streakGrad.addColorStop(0.58, 'rgba(255,255,255,0)');
      streakGrad.addColorStop(1.0, 'rgba(255,255,255,0)');
      ctx.fillStyle = streakGrad;
      ctx.fillRect(-W * 1.2, -90, W * 2.4, 180);
      ctx.restore();

      // Outer fine highlight + dark inner edge for depth
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      roundRect(ctx, 3, 3, W - 6, H - 6, frameRadius - 1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      roundRect(ctx, innerX - 2, innerY - 2, innerW + 4, innerH + 4, innerRadius + 2);
      ctx.stroke();

      // ── Layer 2: inner card panel ──
      const panelGrad = ctx.createLinearGradient(0, innerY, 0, innerY + innerH);
      panelGrad.addColorStop(0, t.panel[0]);
      panelGrad.addColorStop(0.5, t.panel[1]);
      panelGrad.addColorStop(1, t.panel[2]);
      ctx.fillStyle = panelGrad;
      roundRect(ctx, innerX, innerY, innerW, innerH, innerRadius);
      ctx.fill();

      // Inner thin metallic border around panel
      ctx.strokeStyle = t.txtAccent;
      ctx.lineWidth = 1.5;
      roundRect(ctx, innerX + 2, innerY + 2, innerW - 4, innerH - 4, innerRadius - 2);
      ctx.stroke();

      // ── Layer 3: holographic shimmer (shiny / fallback) ──
      if (isShiny || isFallback) {
        ctx.save();
        roundRect(ctx, innerX, innerY, innerW, innerH, innerRadius);
        ctx.clip();

        // Diagonal rainbow stripes
        const stripes = ctx.createLinearGradient(0, 0, W, H);
        const rb = t.rainbow;
        for (let i = 0; i < rb.length; i++) {
          stripes.addColorStop(i / (rb.length - 1), rb[i]);
        }
        ctx.fillStyle = stripes;
        ctx.fillRect(0, 0, W, H);

        // Crosshatch lines for foil texture
        ctx.strokeStyle = t.hatch;
        ctx.lineWidth = 1;
        for (let i = -H; i < W + H; i += 5) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + H, H);
          ctx.stroke();
        }
        for (let i = -H; i < W + H; i += 7) {
          ctx.beginPath();
          ctx.moveTo(i, H);
          ctx.lineTo(i + H, 0);
          ctx.stroke();
        }

        // Soft cross-light overlay
        const cross = ctx.createLinearGradient(W, 0, 0, H);
        cross.addColorStop(0.0, 'rgba(160,220,255,0.06)');
        cross.addColorStop(0.5, 'rgba(255,255,255,0.10)');
        cross.addColorStop(1.0, 'rgba(255,200,255,0.06)');
        ctx.fillStyle = cross;
        ctx.fillRect(0, 0, W, H);

        // Sparkle dots — denser
        for (let i = 0; i < 140; i++) {
          const sx = innerX + Math.random() * innerW;
          const sy = innerY + Math.random() * innerH;
          const sr = Math.random() * 1.6 + 0.4;
          const sa = Math.random() * 0.55 + 0.25;
          ctx.fillStyle = `rgba(${t.sparkle},${sa})`;
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();
        }

        // Larger 4-point stars
        for (let i = 0; i < 9; i++) {
          const sx = innerX + 30 + Math.random() * (innerW - 60);
          const sy = innerY + 30 + Math.random() * (innerH - 60);
          drawStar(ctx, sx, sy, Math.random() * 5 + 4, t.shineBand);
        }

        ctx.restore();
      }

      // ── Layer 4: top banner — title block ──
      ctx.fillStyle = t.txtSub;
      ctx.font = 'bold 22px -apple-system, PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('R O C O T I', W / 2, 70);

      // Decorative line under banner
      const lineY = 92;
      ctx.strokeStyle = t.txtAccent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 100, lineY);
      ctx.lineTo(W / 2 - 22, lineY);
      ctx.moveTo(W / 2 + 22, lineY);
      ctx.lineTo(W / 2 + 100, lineY);
      ctx.stroke();
      drawDiamond(ctx, W / 2, lineY, 7, t.txtAccent);

      // ── Layer 5: kicker (status text) ──
      let kicker = '你的本命精灵';
      if (isFallback) kicker = '✦ 混沌兜底·特殊收藏 ✦';
      else if (isShiny) kicker = '✦ 异色稀有觉醒 ✦';
      ctx.fillStyle = t.txtAccent;
      ctx.font = 'bold 26px -apple-system, PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(kicker, W / 2, 132);

      // ── Layer 6: art window (pet illustration) ──
      const artX = 90;
      const artY = 162;
      const artW = W - 180;
      const artH = 380;

      // Inner art panel — slightly darker for shiny/fallback to make pet pop
      ctx.save();
      roundRect(ctx, artX, artY, artW, artH, 16);
      ctx.clip();

      const artBg = ctx.createLinearGradient(0, artY, 0, artY + artH);
      if (isShiny) {
        artBg.addColorStop(0, '#0e1f1a');
        artBg.addColorStop(1, '#162b22');
      } else if (isFallback) {
        artBg.addColorStop(0, '#28173a');
        artBg.addColorStop(1, '#1d0e2a');
      } else {
        artBg.addColorStop(0, '#fcfff9');
        artBg.addColorStop(1, '#eaf3e6');
      }
      ctx.fillStyle = artBg;
      ctx.fillRect(artX, artY, artW, artH);

      // Radial glow inside art window
      const artGlow = ctx.createRadialGradient(
        W / 2, artY + artH / 2, 20,
        W / 2, artY + artH / 2, artW / 1.3
      );
      artGlow.addColorStop(0, t.petGlow + '0.4)');
      artGlow.addColorStop(0.6, t.petGlow + '0.08)');
      artGlow.addColorStop(1, t.petGlow + '0)');
      ctx.fillStyle = artGlow;
      ctx.fillRect(artX, artY, artW, artH);

      // Magic-circle ring behind pet (shiny / fallback only)
      if (isShiny || isFallback) {
        const cx = W / 2;
        const cy = artY + artH / 2 + 10;
        ctx.save();
        ctx.strokeStyle = t.txtAccent;
        ctx.globalAlpha = 0.32;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, 140, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, 158, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 122, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      // Art window double border (outer + inner)
      ctx.strokeStyle = t.txtAccent;
      ctx.lineWidth = 2;
      roundRect(ctx, artX, artY, artW, artH, 16);
      ctx.stroke();

      ctx.strokeStyle = isShiny || isFallback
        ? 'rgba(255,248,225,0.25)'
        : 'rgba(108,141,113,0.35)';
      ctx.lineWidth = 1;
      roundRect(ctx, artX + 6, artY + 6, artW - 12, artH - 12, 11);
      ctx.stroke();

      // Draw pet image
      if (petImg) {
        const imgMaxW = artW - 60;
        const imgMaxH = artH - 60;
        const aspect = petImg.width / petImg.height;
        let drawW = imgMaxW;
        let drawH = imgMaxW / aspect;
        if (drawH > imgMaxH) {
          drawH = imgMaxH;
          drawW = imgMaxH * aspect;
        }
        const dx = artX + (artW - drawW) / 2;
        const dy = artY + (artH - drawH) / 2;

        // Subtle aura behind pet
        if (isShiny || isFallback) {
          ctx.save();
          const aura = ctx.createRadialGradient(
            dx + drawW / 2, dy + drawH / 2, 10,
            dx + drawW / 2, dy + drawH / 2, Math.max(drawW, drawH) / 1.4
          );
          aura.addColorStop(0, t.petGlow + '0.55)');
          aura.addColorStop(1, t.petGlow + '0)');
          ctx.fillStyle = aura;
          ctx.fillRect(artX, artY, artW, artH);
          ctx.restore();
        }

        ctx.drawImage(petImg, dx, dy, drawW, drawH);
      } else {
        drawJelly(ctx, W / 2, artY + artH / 2, 95);
      }

      // Type gem (top-right of art window)
      const gemCX = artX + artW - 36;
      const gemCY = artY + 36;
      drawGem(ctx, gemCX, gemCY, 22, t.gemCore, t.gemEdge);
      ctx.fillStyle = t.txtMain === '#1e2a22' ? '#1e2a22' : '#1e2a22';
      ctx.font = 'bold 14px -apple-system, PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag.slice(0, 2), gemCX, gemCY + 1);
      ctx.textBaseline = 'alphabetic';

      // ── Layer 7: name ribbon ──
      const ribbonY = 590;
      const ribbonH = 56;
      const ribbonInset = 50;
      const ribbonW = W - ribbonInset * 2;
      const ribbonX = ribbonInset;

      // Ribbon shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      const ribGrad = ctx.createLinearGradient(ribbonX, 0, ribbonX + ribbonW, 0);
      ribGrad.addColorStop(0, t.ribbon[0]);
      ribGrad.addColorStop(0.5, t.ribbon[1]);
      ribGrad.addColorStop(1, t.ribbon[2]);
      ctx.fillStyle = ribGrad;
      roundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, ribbonH / 2);
      ctx.fill();
      ctx.restore();

      // Ribbon highlight line
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ribbonX + 24, ribbonY + 6);
      ctx.lineTo(ribbonX + ribbonW - 24, ribbonY + 6);
      ctx.stroke();

      // Ribbon bottom shadow line
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ribbonX + 24, ribbonY + ribbonH - 6);
      ctx.lineTo(ribbonX + ribbonW - 24, ribbonY + ribbonH - 6);
      ctx.stroke();

      // Pet name on ribbon
      ctx.fillStyle = t.ribbonText;
      ctx.font = 'bold 36px -apple-system, PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, W / 2, ribbonY + ribbonH / 2 + 1);
      ctx.textBaseline = 'alphabetic';

      // ── Layer 8: subtitle / match badge / rank ──
      ctx.fillStyle = t.txtSub;
      ctx.font = '20px -apple-system, PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sub, W / 2, ribbonY + ribbonH + 32);

      // Match badge — pill shape
      ctx.font = 'bold 18px -apple-system, PingFang SC, sans-serif';
      const badgeMetrics = ctx.measureText(matchText);
      const badgeW = badgeMetrics.width + 36;
      const badgeH = 32;
      const badgeX = W / 2 - badgeW / 2;
      const badgeY = ribbonY + ribbonH + 50;
      ctx.fillStyle = isShiny || isFallback
        ? 'rgba(255,248,225,0.14)'
        : 'rgba(77,106,83,0.10)';
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
      ctx.fill();
      ctx.strokeStyle = t.txtAccent;
      ctx.lineWidth = 1.2;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
      ctx.stroke();
      ctx.fillStyle = t.txtAccent;
      ctx.textAlign = 'center';
      ctx.fillText(matchText, W / 2, badgeY + 22);

      // Rank text
      ctx.fillStyle = t.txtSub;
      ctx.font = '15px -apple-system, PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      const rankShort = rankText.length > 28 ? rankText.slice(0, 27) + '…' : rankText;
      ctx.fillText(rankShort, W / 2, badgeY + badgeH + 26);

      // ── Layer 9: quote ──
      ctx.fillStyle = t.txtMain;
      ctx.font = 'italic 20px -apple-system, PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      const quoteY = badgeY + badgeH + 60;
      wrapText(ctx, `「${quote}」`, W / 2, quoteY, 580, 30, 3);

      // ── Layer 10: bottom row — QR + brand ──
      const qrSize = 110;
      const qrX = innerX + 28;
      const qrY = H - innerY - qrSize - 32;

      // QR background panel (white card with gold outline)
      ctx.fillStyle = '#fff';
      roundRect(ctx, qrX - 7, qrY - 7, qrSize + 14, qrSize + 14, 8);
      ctx.fill();
      ctx.strokeStyle = t.txtAccent;
      ctx.lineWidth = 1.5;
      roundRect(ctx, qrX - 7, qrY - 7, qrSize + 14, qrSize + 14, 8);
      ctx.stroke();

      if (qrImg) {
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      } else {
        ctx.fillStyle = '#1e2a22';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('扫码访问', qrX + qrSize / 2, qrY + qrSize / 2);
      }

      // QR caption
      ctx.fillStyle = t.txtAccent;
      ctx.font = 'bold 13px -apple-system, PingFang SC, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('扫码 · 测你的精灵', qrX, qrY + qrSize + 22);

      // Brand text (bottom right)
      const brandRightX = W - innerX - 28;
      const brandY = qrY + 18;
      ctx.fillStyle = t.txtMain;
      ctx.font = 'bold 24px -apple-system, PingFang SC, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('RocoTI', brandRightX, brandY);

      ctx.fillStyle = t.txtAccent;
      ctx.font = '14px -apple-system, PingFang SC, sans-serif';
      ctx.fillText('洛克王国 · 精灵性格测试', brandRightX, brandY + 24);

      ctx.fillStyle = t.txtSub;
      ctx.font = '13px -apple-system, PingFang SC, sans-serif';
      ctx.fillText('全平台同号：温泉蛋不emo', brandRightX, brandY + 50);

      // Serial number
      ctx.fillStyle = t.txtAccent;
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      const serial = `№ ${(name.length * 13 + tag.length * 7).toString().padStart(3, '0')}/200`;
      ctx.fillText(serial, brandRightX, qrY + qrSize + 22);

      // ── Layer 11: corner ornaments ──
      drawCornerOrnament(ctx, innerX + 10, innerY + 10, 'tl', t.ornament);
      drawCornerOrnament(ctx, W - innerX - 10, innerY + 10, 'tr', t.ornament);
      drawCornerOrnament(ctx, innerX + 10, H - innerY - 10, 'bl', t.ornament);
      drawCornerOrnament(ctx, W - innerX - 10, H - innerY - 10, 'br', t.ornament);
    }

    return () => {
      cancelled = true;
    };
  }, [name, sub, img, quote, matchText, tag, isShiny, isFallback, rankText]);

  // Detect Web Share API with file support (mobile share sheet integration)
  useEffect(() => {
    if (!dataUrl) return;
    try {
      // Probe with a tiny test file
      const probe = new File(['x'], 'probe.png', { type: 'image/png' });
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [probe] })
      ) {
        setCanShareFile(true);
      }
    } catch {
      // ignore
    }
  }, [dataUrl]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `RocoTI_${name}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `RocoTI_${name}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `RocoTI · ${name}`,
          text: `我在洛克王国性格测试测出了「${name}」！`,
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Hidden canvas: only used for drawing; the visible element is <img>
         so users can long-press to save to camera roll on iOS / share on Android. */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`RocoTI ${name}`}
          style={{
            width: '100%',
            maxWidth: 360,
            borderRadius: 20,
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            display: 'block',
            margin: '0 auto 14px',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: 360,
            aspectRatio: '5 / 7',
            borderRadius: 20,
            background: 'linear-gradient(180deg,#f0f4f0,#e2ece2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: '#94a59a',
            fontSize: 14,
          }}
        >
          正在打磨闪卡…
        </div>
      )}

      {dataUrl && (
        <>
          <div
            style={{
              fontSize: 13,
              color: '#94a59a',
              marginBottom: 10,
              lineHeight: 1.6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <IconHandPoint size={14} /> 长按图片即可保存到相册 / 分享给朋友
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {canShareFile && (
              <button
                className="btn-primary"
                onClick={handleShare}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <IconShare size={14} /> 分享到…
              </button>
            )}
            <button
              className={canShareFile ? 'btn-secondary' : 'btn-primary'}
              onClick={handleDownload}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <IconSave size={14} /> 保存图片
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#94a59a', marginTop: 8 }}>
            扫卡片二维码即可邀请朋友一起测试
          </div>
        </>
      )}
    </div>
  );
}

// ──────────── helpers ────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
  ctx.fill();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const x1 = cx + Math.cos(angle) * size;
    const y1 = cy + Math.sin(angle) * size;
    const x2 = cx + Math.cos(angle + Math.PI / 4) * (size * 0.35);
    const y2 = cy + Math.sin(angle + Math.PI / 4) * (size * 0.35);
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  coreColor: string,
  edgeColor: string
) {
  ctx.save();
  // Outer ring shadow
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  // Outer edge (metallic ring)
  ctx.fillStyle = edgeColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Inner gem body
  const gemGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 1, cx, cy, r * 0.85);
  gemGrad.addColorStop(0, '#ffffff');
  gemGrad.addColorStop(0.4, coreColor);
  gemGrad.addColorStop(1, edgeColor);
  ctx.fillStyle = gemGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
  ctx.fill();

  // Tiny highlight
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.22, r * 0.12, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCornerOrnament(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pos: 'tl' | 'tr' | 'bl' | 'br',
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const len = 24;
  ctx.beginPath();
  if (pos === 'tl') {
    ctx.moveTo(x, y + len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
  } else if (pos === 'tr') {
    ctx.moveTo(x, y + len);
    ctx.lineTo(x, y);
    ctx.lineTo(x - len, y);
  } else if (pos === 'bl') {
    ctx.moveTo(x, y - len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
  } else {
    ctx.moveTo(x, y - len);
    ctx.lineTo(x, y);
    ctx.lineTo(x - len, y);
  }
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 99
) {
  const chars = text.split('');
  let line = '';
  const lines: string[] = [];
  for (let n = 0; n < chars.length; n++) {
    const testLine = line + chars[n];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = chars[n];
      if (lines.length >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (lines.length >= maxLines - 1 && chars.length > 0) {
    let tail = line;
    while (ctx.measureText(tail + '…').width > maxWidth && tail.length > 1) {
      tail = tail.slice(0, -1);
    }
    lines.push(tail + '…');
  } else {
    lines.push(line);
  }
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
}

function drawJelly(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  // Pudding/jelly silhouette — used as fallback art when pet image is missing.
  ctx.save();

  const bodyTop = cy - size * 0.3;
  const bodyBottom = cy + size * 0.7;
  const bodyTopHalfW = size * 0.55;
  const bodyBotHalfW = size * 0.85;

  // Soft drop shadow under
  ctx.beginPath();
  ctx.ellipse(cx, bodyBottom + size * 0.12, bodyBotHalfW, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  // Body — soft trapezoid with rounded edges
  const bodyGrad = ctx.createLinearGradient(0, bodyTop, 0, bodyBottom);
  bodyGrad.addColorStop(0, '#fde9b8');
  bodyGrad.addColorStop(0.6, '#f7d57e');
  bodyGrad.addColorStop(1, '#dfa648');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(cx - bodyTopHalfW, bodyTop);
  ctx.quadraticCurveTo(cx - bodyBotHalfW, bodyBottom - size * 0.05, cx - bodyBotHalfW, bodyBottom);
  ctx.quadraticCurveTo(cx, bodyBottom + size * 0.08, cx + bodyBotHalfW, bodyBottom);
  ctx.quadraticCurveTo(cx + bodyBotHalfW, bodyBottom - size * 0.05, cx + bodyTopHalfW, bodyTop);
  ctx.quadraticCurveTo(cx, bodyTop - size * 0.06, cx - bodyTopHalfW, bodyTop);
  ctx.closePath();
  ctx.fill();

  // Caramel topping — darker dome
  const caramelGrad = ctx.createLinearGradient(0, bodyTop - size * 0.15, 0, bodyTop + size * 0.06);
  caramelGrad.addColorStop(0, '#7a3f12');
  caramelGrad.addColorStop(1, '#a85e1c');
  ctx.fillStyle = caramelGrad;
  ctx.beginPath();
  ctx.ellipse(cx, bodyTop, bodyTopHalfW + size * 0.06, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Caramel drip on left
  ctx.beginPath();
  ctx.moveTo(cx - bodyTopHalfW * 0.7, bodyTop + size * 0.04);
  ctx.quadraticCurveTo(cx - bodyTopHalfW * 0.85, bodyTop + size * 0.18, cx - bodyTopHalfW * 0.6, bodyTop + size * 0.22);
  ctx.quadraticCurveTo(cx - bodyTopHalfW * 0.5, bodyTop + size * 0.18, cx - bodyTopHalfW * 0.55, bodyTop + size * 0.04);
  ctx.closePath();
  ctx.fillStyle = '#8a4818';
  ctx.fill();

  // Highlight on body (left side)
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(
    cx - bodyTopHalfW * 0.55,
    cy + size * 0.08,
    size * 0.07,
    size * 0.28,
    -0.15,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Cute eyes (two black dots)
  ctx.fillStyle = '#1e2a22';
  ctx.beginPath();
  ctx.arc(cx - size * 0.2, cy + size * 0.18, size * 0.05, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.2, cy + size * 0.18, size * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Tiny smile
  ctx.strokeStyle = '#1e2a22';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.32, size * 0.08, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}
