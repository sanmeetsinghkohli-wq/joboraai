/**
 * Canvas-drawn resume textures. Each function only draws onto a 2D context so
 * the CSS tier can reuse them. All drawing happens in a fixed design space
 * (resume 1024x1448, layers 1024x540) and is scaled to the target canvas.
 */

const IVORY = '#FAF6F2';
const PLUM = '#2A1728';
const CORAL = '#E05347';
const PAPER = '#FFFFFF';
const HAIR = '#EDE5E1';
const MUTED = '#63555F';

const SERIF = 'Newsreader, Georgia, serif';
const SANS = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

export const RESUME_DESIGN_W = 1024;
export const RESUME_DESIGN_H = 1448;
export const LAYER_DESIGN_W = 1024;
export const LAYER_DESIGN_H = 540;

export function whenFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.all([
    document.fonts.load('600 64px Newsreader'),
    document.fonts.load('500 24px "Plus Jakarta Sans"'),
    document.fonts.load('700 24px "Plus Jakarta Sans"'),
  ])
    .then(() => undefined)
    .catch(() => undefined);
}

type Ctx = CanvasRenderingContext2D;

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function tracked(ctx: Ctx, text: string, x: number, y: number, spacing: number) {
  const c = ctx as Ctx & { letterSpacing?: string };
  if ('letterSpacing' in c) {
    c.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x, y);
    c.letterSpacing = '0px';
    return;
  }
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function setup(ctx: Ctx, w: number, h: number, dw: number, dh: number) {
  ctx.save();
  ctx.setTransform(w / dw, 0, 0, h / dh, 0, 0);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

const KEYWORDS = /(Python|SQL|Tableau)/g;

/** Draws a line of text, underlining matched keywords in coral at 35% alpha. */
function rich(ctx: Ctx, text: string, x: number, y: number, size: number) {
  let cx = x;
  for (const part of text.split(KEYWORDS)) {
    if (!part) continue;
    const wd = ctx.measureText(part).width;
    if (/^(Python|SQL|Tableau)$/.test(part)) {
      ctx.fillStyle = 'rgba(224,83,71,0.35)';
      ctx.fillRect(cx, y + 5, wd, Math.max(3, size * 0.12));
    }
    ctx.fillStyle = PLUM;
    ctx.fillText(part, cx, y);
    cx += wd;
  }
}

function wrap(ctx: Ctx, text: string, x: number, y: number, maxW: number, lh: number): number {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const wd of words) {
    const test = line ? `${line} ${wd}` : wd;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = wd;
      cy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

export function drawResumeFront(ctx: Ctx, w: number, h: number): void {
  setup(ctx, w, h, RESUME_DESIGN_W, RESUME_DESIGN_H);
  const W = RESUME_DESIGN_W;
  const m = Math.round(W * 0.07);
  const cw = W - m * 2;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, RESUME_DESIGN_H);
  ctx.fillStyle = CORAL;
  ctx.fillRect(0, 0, W, 6);

  ctx.fillStyle = PLUM;
  ctx.font = `600 90px ${SERIF}`;
  ctx.fillText('Amira Haddad', m, 160);
  ctx.fillStyle = CORAL;
  ctx.font = `500 34px ${SANS}`;
  ctx.fillText('Data Analyst → Machine Learning Engineer', m, 214);
  ctx.fillStyle = MUTED;
  ctx.font = `500 22px ${SANS}`;
  ctx.fillText('Dubai, UAE · amira@example.com · linkedin.com/in/example', m, 254);

  const header = (t: string, y: number) => {
    ctx.fillStyle = PLUM;
    ctx.font = `700 22px ${SANS}`;
    tracked(ctx, t.toUpperCase(), m, y, 22 * 0.08);
    ctx.fillStyle = HAIR;
    ctx.fillRect(m, y + 12, cw, 2);
  };

  header('Summary', 320);
  ctx.font = `500 28px ${SANS}`;
  ctx.fillStyle = PLUM;
  ctx.fillText('Analyst with two years turning messy sales data into decisions.', m, 372);
  ctx.fillText('Moving into ML through production forecasting projects.', m, 410);

  header('Experience', 482);
  const role = (t: string, y: number) => {
    ctx.fillStyle = PLUM;
    ctx.font = `700 28px ${SANS}`;
    ctx.fillText(t, m, y);
  };
  ctx.font = `500 28px ${SANS}`;
  role('Data Analyst, Aster Labs, 2024 to now', 534);
  ctx.font = `500 26px ${SANS}`;
  const b1 = [
    'Built Tableau dashboards for weekly pipeline reviews',
    'Cut report time 70% with Python and SQL automation',
    'Modelled churn risk that guided retention offers',
  ];
  b1.forEach((t, i) => {
    ctx.fillStyle = CORAL;
    ctx.fillRect(m + 4, 566 + i * 38 - 8, 7, 7);
    ctx.font = `500 26px ${SANS}`;
    rich(ctx, t, m + 28, 570 + i * 38, 26);
  });
  role('Analytics Intern, Qamar Fintech, 2023', 710);
  const b2 = [
    'Cleaned 2M transaction rows with SQL and Python',
    'Shipped a Tableau fraud-rate view for the risk team',
    'Documented metrics so teams reused one definition',
  ];
  b2.forEach((t, i) => {
    ctx.fillStyle = CORAL;
    ctx.fillRect(m + 4, 742 + i * 38 - 8, 7, 7);
    ctx.font = `500 26px ${SANS}`;
    rich(ctx, t, m + 28, 746 + i * 38, 26);
  });

  header('Projects', 900);
  ctx.font = `500 26px ${SANS}`;
  ctx.fillStyle = PLUM;
  ctx.fillText('Demand forecaster: gradient boosting on retail data, 11% lower MAPE.', m, 952);
  ctx.fillText('Job tracker: Python scraper feeding a small Tableau board.', m, 990);

  header('Education', 1062);
  ctx.font = `500 28px ${SANS}`;
  ctx.fillText('B.Sc. Computer Science, 2025', m, 1114);

  header('Skills', 1186);
  const skills = ['Python', 'SQL', 'Tableau', 'scikit-learn', 'Pandas', 'Git'];
  ctx.font = `500 24px ${SANS}`;
  let sx = m;
  for (const s of skills) {
    const cwid = ctx.measureText(s).width + 36;
    rr(ctx, sx, 1214, cwid, 48, 24);
    ctx.fillStyle = IVORY;
    ctx.fill();
    ctx.strokeStyle = HAIR;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PLUM;
    ctx.fillText(s, sx + 18, 1246);
    sx += cwid + 12;
  }

  ctx.globalAlpha = 0.4;
  ctx.fillStyle = PLUM;
  ctx.font = `600 20px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText('SAMPLE', W - m, 1400);
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawResumeBack(ctx: Ctx, w: number, h: number): void {
  setup(ctx, w, h, RESUME_DESIGN_W, RESUME_DESIGN_H);
  const W = RESUME_DESIGN_W;
  ctx.fillStyle = IVORY;
  ctx.fillRect(0, 0, W, RESUME_DESIGN_H);

  ctx.fillStyle = PLUM;
  ctx.font = `600 64px ${SERIF}`;
  ctx.fillText('Tracked in Jobora', 48, 130);
  ctx.fillStyle = MUTED;
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText('Your applications', 48, 172);

  const cols: { name: string; dot: string; cards: [string, string][] }[] = [
    { name: 'Saved', dot: PLUM, cards: [['Orbit Health', 'Remotive'], ['Lumen Data', 'Arbeitnow'], ['Kite Labs', 'Remotive']] },
    { name: 'Tailored', dot: PLUM, cards: [['Nimbus AI', 'Arbeitnow'], ['Tern Pay', 'Remotive']] },
    { name: 'Applied', dot: CORAL, cards: [['Vela Cloud', 'Remotive'], ['Qiro', 'Arbeitnow'], ['Atlas ML', 'Remotive']] },
    { name: 'Interview', dot: CORAL, cards: [['Harbor AI', 'Arbeitnow']] },
    { name: 'Offer', dot: CORAL, cards: [['Sable Labs', 'Remotive']] },
  ];
  const left = 40;
  const gap = 10;
  const colW = (W - left * 2 - gap * 4) / 5;
  cols.forEach((c, i) => {
    const x = left + i * (colW + gap);
    rr(ctx, x, 230, colW, 1100, 20);
    ctx.fillStyle = 'rgba(237,229,225,0.55)';
    ctx.fill();
    ctx.fillStyle = PLUM;
    ctx.font = `700 22px ${SANS}`;
    tracked(ctx, c.name.toUpperCase(), x + 14, 272, 1.2);
    c.cards.forEach(([co, src], j) => {
      const y = 300 + j * 150;
      rr(ctx, x + 8, y, colW - 16, 132, 16);
      ctx.fillStyle = PAPER;
      ctx.fill();
      ctx.strokeStyle = HAIR;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 28, y + 28, 7, 0, Math.PI * 2);
      ctx.fillStyle = c.dot;
      ctx.fill();
      ctx.fillStyle = PLUM;
      ctx.font = `700 22px ${SANS}`;
      ctx.fillText(co, x + 22, y + 74);
      ctx.fillStyle = MUTED;
      ctx.font = `500 18px ${SANS}`;
      ctx.fillText(src, x + 22, y + 106);
    });
  });
  ctx.restore();
}

export function drawLayer(
  ctx: Ctx,
  w: number,
  h: number,
  kind: 'ats' | 'keywords' | 'bullets',
): void {
  setup(ctx, w, h, LAYER_DESIGN_W, LAYER_DESIGN_H);
  const W = LAYER_DESIGN_W;
  const H = LAYER_DESIGN_H;
  ctx.clearRect(0, 0, W, H);
  rr(ctx, 6, 6, W - 12, H - 12, 24);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.strokeStyle = HAIR;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = MUTED;
  ctx.font = `500 20px ${SANS}`;
  ctx.fillText('Sample analysis', 48, H - 36);

  if (kind === 'ats') {
    const cx = 220;
    const cy = 240;
    const r = 120;
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.strokeStyle = HAIR;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = CORAL;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.82);
    ctx.stroke();
    ctx.fillStyle = PLUM;
    ctx.textAlign = 'center';
    ctx.font = `600 96px ${SERIF}`;
    ctx.fillText('82', cx, cy + 22);
    ctx.fillStyle = MUTED;
    ctx.font = `500 24px ${SANS}`;
    ctx.fillText('/ 100', cx, cy + 62);
    ctx.textAlign = 'left';
    ctx.fillStyle = PLUM;
    ctx.font = `700 52px ${SANS}`;
    ctx.fillText('ATS match', 420, 220);
    ctx.fillStyle = MUTED;
    ctx.font = `500 30px ${SANS}`;
    wrap(ctx, 'Strong fit for Junior ML Engineer', 420, 275, 520, 40);
  } else if (kind === 'keywords') {
    const chips = (items: string[], y: number, matched: boolean) => {
      let x = 48;
      ctx.font = `600 28px ${SANS}`;
      for (const t of items) {
        const cwid = ctx.measureText(t).width + 44;
        rr(ctx, x, y, cwid, 58, 29);
        if (matched) {
          ctx.fillStyle = PLUM;
          ctx.fill();
          ctx.fillStyle = IVORY;
        } else {
          ctx.strokeStyle = CORAL;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = CORAL;
        }
        ctx.fillText(t, x + 22, y + 39);
        x += cwid + 14;
      }
    };
    ctx.fillStyle = PLUM;
    ctx.font = `700 24px ${SANS}`;
    tracked(ctx, 'MATCHED', 48, 100, 2);
    chips(['Python', 'SQL', 'Tableau'], 124, true);
    ctx.fillStyle = CORAL;
    ctx.font = `700 24px ${SANS}`;
    tracked(ctx, 'MISSING', 48, 262, 2);
    chips(['Airflow', 'dbt', 'A/B testing'], 286, false);
  } else {
    ctx.fillStyle = MUTED;
    ctx.font = `700 22px ${SANS}`;
    tracked(ctx, 'BEFORE', 48, 90, 2);
    ctx.font = `500 30px ${SANS}`;
    const before = 'Made dashboards for sales team';
    ctx.fillText(before, 48, 140);
    const bw = ctx.measureText(before).width;
    ctx.fillStyle = MUTED;
    ctx.fillRect(48, 130, bw, 3);

    ctx.fillStyle = CORAL;
    ctx.font = `700 22px ${SANS}`;
    tracked(ctx, 'AFTER', 48, 232, 2);
    ctx.font = `600 32px ${SANS}`;
    const lines = [
      ['Built ', '6 Tableau dashboards', ' used weekly by'],
      ['the sales team to ', 'track pipeline', ''],
    ];
    lines.forEach((parts, i) => {
      let x = 48;
      const y = 290 + i * 48;
      parts.forEach((t, k) => {
        if (!t) return;
        const wd = ctx.measureText(t).width;
        if (k === 1) {
          ctx.fillStyle = 'rgba(224,83,71,0.22)';
          rr(ctx, x - 4, y - 32, wd + 8, 42, 8);
          ctx.fill();
        }
        ctx.fillStyle = k === 1 ? CORAL : PLUM;
        ctx.fillText(t, x, y);
        x += wd;
      });
    });
  }
  ctx.restore();
}
