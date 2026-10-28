/**
 * @ethersflow/mcp-server — Boot Splash Renderer (stderr-only, TTY-gated)
 *
 * Renders a universal half-block ANSI animated vortex emblem with orbiting nodes on startup.
 * Non-negotiable rule: Outputs exclusively to process.stderr.
 * Zero external dependencies. Pure Node built-ins.
 */

import process from 'node:process';

// Terminal color capabilities
function detectColorSupport() {
  if (process.env.NO_COLOR) return 'none';
  if (process.env.EF_NO_SPLASH === '1') return 'none';
  const ct = (process.env.COLORTERM || '').toLowerCase();
  const tp = (process.env.TERM_PROGRAM || '').toLowerCase();
  const term = (process.env.TERM || '').toLowerCase();

  if (ct === 'truecolor' || ct === '24bit' || tp === 'iterm.app' || tp === 'ghostty' || term.includes('direct') || term.includes('24bit')) {
    return 'truecolor';
  }
  if (term.includes('256') || ct || tp) {
    return '256';
  }
  return '16';
}

const colorMode = detectColorSupport();

function rgb(r, g, b, text) {
  if (colorMode === 'none') return text;
  if (colorMode === 'truecolor') {
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
  }
  if (colorMode === '256') {
    const rIdx = Math.round((r / 255) * 5);
    const gIdx = Math.round((g / 255) * 5);
    const bIdx = Math.round((b / 255) * 5);
    const code = 16 + (36 * rIdx) + (6 * gIdx) + bIdx;
    return `\x1b[38;5;${code}m${text}\x1b[0m`;
  }
  // 16-color fallback
  if (r > 150 && g < 100 && b < 100) return `\x1b[31m${text}\x1b[0m`;
  if (g > 120 && r < 100) return `\x1b[32m${text}\x1b[0m`;
  if (b > 150 || (r > 100 && b > 180)) return `\x1b[35m${text}\x1b[0m`;
  return `\x1b[37m${text}\x1b[0m`;
}

function bold(text) {
  if (colorMode === 'none') return text;
  return `\x1b[1m${text}\x1b[0m`;
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function shouldRender() {
  if (process.env.EF_NO_SPLASH === '1') return false;
  if (process.env.EF_SPLASH === '1') return true;
  return Boolean(process.stderr && process.stderr.isTTY);
}

// Brand palette
const COLOR_PURPLE = [79, 57, 246];      // Electric Purple (79,57,246)
const COLOR_VIOLET = [129, 140, 248];    // Soft Violet
const COLOR_PINK = [217, 70, 239];      // Vibrant Pink
const COLOR_MAGENTA = [236, 72, 153];    // Bright Magenta
const COLOR_GREEN = [34, 197, 94];       // RUNNING Green
const COLOR_RED = [239, 68, 68];         // Error Red
const COLOR_GRAY = [148, 163, 184];      // Dim Slate Gray

// Universal Half-Block Vortex Pixel Map (20 pixel rows x 33 cols)
const VORTEX_PIXEL_ROWS = [
  "           #############         ", // y = 0
  "        #####################    ", // y = 1
  "      ######             ######  ", // y = 2
  "     #####    #########    ##### ", // y = 3
  "    ####    #############   #### ", // y = 4
  "   ####    #####     #####   ####", // y = 5
  "   ###    ####         ####  ####", // y = 6
  "   ###   ####    ###    ###  ####", // y = 7
  "   ###   ###    #####   ###  ####", // y = 8
  "  ####   ###   ######   ###  ####", // y = 9
  "  ####   ###   #####   ####  ### ", // y = 10
  "  ####   ####    ##   #####  ### ", // y = 11
  "   ####   #####     ######  #### ", // y = 12
  "   ####    ###############  #### ", // y = 13
  "    #####    ###########   ##### ", // y = 14
  "     ######              ######  ", // y = 15
  "       ######################    ", // y = 16
  "         #################       ", // y = 17
  "            ###########          ", // y = 18
  "                                 "  // y = 19
];

// Pack 20 pixel rows into 10 half-block character rows
const VORTEX_HALF_BLOCKS = Array.from({ length: 10 }, (_, r) => {
  const topRow = VORTEX_PIXEL_ROWS[2 * r] || '';
  const botRow = VORTEX_PIXEL_ROWS[2 * r + 1] || '';
  return Array.from({ length: 33 }, (_, c) => {
    const t = topRow[c] === '#';
    const b = botRow[c] === '#';
    if (t && b) return '█';
    if (t && !b) return '▀';
    if (!t && b) return '▄';
    return ' ';
  }).join('');
});

// State variables
let currentState = 'idle'; // 'idle' | 'boot' | 'live' | 'fail'
let timer = null;
let bootCapTimer = null;
let frameCount = 0;
let lastLineCount = 0;
let lastError = null;
let isCleanedUp = false;

// Orbit node configuration (7 nodes)
const NUM_NODES = 7;
const NODE_COLORS = [
  COLOR_MAGENTA,
  COLOR_VIOLET,
  COLOR_PURPLE,
  COLOR_PINK,
  [168, 85, 247],
  COLOR_VIOLET,
  [192, 132, 252]
];

const nodePhases = Array.from({ length: NUM_NODES }, (_, i) => (i * (2 * Math.PI / NUM_NODES)));
const nodeSpeedsBoot = [1.8, 2.2, 1.5, 2.0, 1.7, 2.3, 1.9];
const nodeRadiusScales = [1.0, 1.15, 0.9, 1.05, 0.95, 1.1, 1.0];

function renderFrame() {
  if (!shouldRender()) return;

  const termWidth = Math.max(40, process.stderr.columns || 80);
  const termRows = Math.max(12, process.stderr.rows || 24);
  const time = frameCount * 0.083; // Seconds at ~12 fps

  const gridRows = 10;
  const gridCols = 33;
  const grid = Array.from({ length: gridRows }, (_, r) => {
    return Array.from({ length: gridCols }, (_, c) => {
      const ch = VORTEX_HALF_BLOCKS[r]?.[c] || ' ';
      return { ch, r, c, isNode: false, color: null };
    });
  });

  const cx = 16.0;
  const cy = 4.5;
  const baseRx = 11.5;
  const baseRy = 4.1;

  // Render orbiting nodes
  for (let k = 0; k < NUM_NODES; k++) {
    let angle, rx, ry;
    if (currentState === 'boot') {
      angle = nodePhases[k] + (time * nodeSpeedsBoot[k]);
      rx = baseRx * nodeRadiusScales[k];
      ry = baseRy * nodeRadiusScales[k];
    } else {
      // Live state: static layout frame
      const liveSpeed = (2 * Math.PI) / 14.0;
      angle = nodePhases[k] + (time * liveSpeed);
      rx = baseRx;
      ry = baseRy;
    }

    const nodeColor = NODE_COLORS[k % NODE_COLORS.length];

    const points = [
      { offset: 0.0, glyph: (k % 2 === 0 ? '●' : '◆'), alpha: 1.0, isHead: true },
      { offset: -0.20, glyph: '•', alpha: 0.75, isHead: false },
      { offset: -0.40, glyph: '·', alpha: 0.50, isHead: false },
      { offset: -0.60, glyph: '.', alpha: 0.25, isHead: false }
    ];

    for (const pt of points) {
      const ptAngle = angle + pt.offset;
      const col = Math.round(cx + rx * Math.cos(ptAngle));
      const row = Math.round(cy + ry * Math.sin(ptAngle));

      if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
        const cell = grid[row][col];
        if (!cell.isNode || pt.isHead) {
          cell.ch = pt.glyph;
          cell.isNode = true;
          cell.color = [
            Math.round(nodeColor[0] * pt.alpha),
            Math.round(nodeColor[1] * pt.alpha),
            Math.round(nodeColor[2] * pt.alpha)
          ];
        }
      }
    }
  }

  // Convert grid matrix to colorized string lines
  const emblemLines = grid.map((rowCells) => {
    return rowCells.map((cell) => {
      if (cell.isNode && cell.color) {
        return rgb(cell.color[0], cell.color[1], cell.color[2], cell.ch);
      }
      if (cell.ch === ' ') return ' ';
      const dx = (cell.c - cx) * 0.5;
      const dy = cell.r - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const normAngle = (angle + Math.PI) / (2 * Math.PI);

      let r = Math.round(COLOR_PURPLE[0] + normAngle * (COLOR_PINK[0] - COLOR_PURPLE[0]));
      let g = Math.round(COLOR_PURPLE[1] + normAngle * (COLOR_PINK[1] - COLOR_PURPLE[1]));
      let b = Math.round(COLOR_PURPLE[2] + normAngle * (COLOR_PINK[2] - COLOR_PURPLE[2]));

      // Depth shading: innermost spiral pixels blend ~30% toward dark [30, 20, 90]
      if (dist < 2.5) {
        r = Math.round(r * 0.7 + 30 * 0.3);
        g = Math.round(g * 0.7 + 20 * 0.3);
        b = Math.round(b * 0.7 + 90 * 0.3);
      }

      return rgb(r, g, b, cell.ch);
    }).join('');
  });

  const lines = [
    '', // top spacer
    ...emblemLines,
    ''  // middle spacer
  ];

  if (currentState === 'boot') {
    lines.push(
      bold('Booting EthersFlow MCP...'),
      `${rgb(COLOR_GRAY[0], COLOR_GRAY[1], COLOR_GRAY[2], 'cloning  ·  installing  ·  ')}${rgb(COLOR_VIOLET[0], COLOR_VIOLET[1], COLOR_VIOLET[2], 'launching')}`,
      rgb(COLOR_VIOLET[0], COLOR_VIOLET[1], COLOR_VIOLET[2], '╭─ KYAA · ADVERSARIAL COUNCIL ─╮')
    );
  } else if (currentState === 'live') {
    const dotChar = '⊙';
    const dotStr = rgb(COLOR_GREEN[0], COLOR_GREEN[1], COLOR_GREEN[2], dotChar);
    const labelStr = rgb(COLOR_GREEN[0], COLOR_GREEN[1], COLOR_GREEN[2], 'RUNNING · STDIO');
    const badgeStr = rgb(COLOR_GREEN[0], COLOR_GREEN[1], COLOR_GREEN[2], '(') + ` ${dotStr} ${labelStr} ` + rgb(COLOR_GREEN[0], COLOR_GREEN[1], COLOR_GREEN[2], ')');

    lines.push(
      bold('EthersFlow MCP Server'),
      badgeStr,
      rgb(COLOR_GRAY[0], COLOR_GRAY[1], COLOR_GRAY[2], 'council seated  ·  verdicts signed'),
      rgb(COLOR_VIOLET[0], COLOR_VIOLET[1], COLOR_VIOLET[2], 'Ed25519 · ef_attest')
    );
  } else if (currentState === 'fail') {
    const errMsg = lastError ? (lastError.message || String(lastError)) : 'Unknown startup error';
    lines.push(
      rgb(COLOR_RED[0], COLOR_RED[1], COLOR_RED[2], bold('[ ✕ BOOT ERROR ]')),
      rgb(COLOR_RED[0], COLOR_RED[1], COLOR_RED[2], errMsg)
    );
  }

  const maxAllowedLines = Math.max(8, termRows - 2);
  const finalLines = lines.slice(0, maxAllowedLines);

  const centeredOutput = finalLines.map((line) => {
    const visLen = stripAnsi(line).length;
    const pad = Math.max(0, Math.floor((termWidth - visLen) / 2));
    return ' '.repeat(pad) + line;
  });

  if (lastLineCount === 0) {
    process.stderr.write('\x1b[?25l');
    process.stderr.write(centeredOutput.join('\n') + '\n');
  } else {
    process.stderr.write(`\x1b[${lastLineCount}A`);
    for (const l of centeredOutput) {
      process.stderr.write('\x1b[2K\r' + l + '\n');
    }
  }

  lastLineCount = centeredOutput.length;
  frameCount++;
}

function startTimer(intervalMs) {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    renderFrame();
  }, intervalMs);
  if (timer && typeof timer.unref === 'function') {
    timer.unref();
  }
}

export function start() {
  if (!shouldRender()) return;
  if (currentState === 'boot' || currentState === 'live') return;

  currentState = 'boot';
  frameCount = 0;
  lastLineCount = 0;
  renderFrame();
  startTimer(83); // ~12 fps

  // Hard duration cap: after 3.5s in boot state, auto-transition to static live frame
  if (bootCapTimer) clearTimeout(bootCapTimer);
  bootCapTimer = setTimeout(() => {
    if (currentState === 'boot') {
      live();
    }
  }, 3500);
  if (bootCapTimer && typeof bootCapTimer.unref === 'function') {
    bootCapTimer.unref();
  }
}

export function live() {
  if (!shouldRender()) return;

  if (bootCapTimer) {
    clearTimeout(bootCapTimer);
    bootCapTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  currentState = 'live';
  renderFrame(); // Render one final static frame

  // Restore cursor so user typing echoes cleanly without redraw interference
  process.stderr.write('\x1b[?25h');
}

export function fail(err) {
  if (!shouldRender()) return;

  if (bootCapTimer) {
    clearTimeout(bootCapTimer);
    bootCapTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  currentState = 'fail';
  lastError = err;
  renderFrame();
  process.stderr.write('\x1b[?25h');
}

export function stop() {
  if (isCleanedUp) return;
  isCleanedUp = true;

  if (bootCapTimer) {
    clearTimeout(bootCapTimer);
    bootCapTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (shouldRender()) {
    process.stderr.write('\x1b[?25h');
  }
  currentState = 'idle';
}

const onExit = () => {
  stop();
};

process.once('exit', onExit);
process.once('SIGINT', onExit);
process.once('SIGTERM', onExit);

export const splash = {
  start,
  live,
  fail,
  stop
};

export default splash;
