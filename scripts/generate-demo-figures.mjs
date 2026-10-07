// Reproducible, fictional research illustrations. No lab data or remote services.
// Run from the repository root: npm run demo:figures
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const figures = JSON.parse(await readFile(path.join(root, 'client/src/demo-figures.json'), 'utf8'));
const destination = path.join(root, 'client/public/demo/figures');
const previews = path.join(root, 'output/demo-figures');
await mkdir(destination, { recursive: true });
await mkdir(previews, { recursive: true });

const themes = {
  sky: { bg: '#F0F7FC', card: '#FFFFFF', ink: '#14364D', muted: '#68889D', line: '#D5E5F0', accent: '#008DC5', soft: '#D5EFFA', second: '#F9AC6C' },
  mint: { bg: '#EFF7F3', card: '#FFFFFF', ink: '#193D38', muted: '#668B81', line: '#D6E7DF', accent: '#218B77', soft: '#D2EDE2', second: '#E7AB61' },
  peach: { bg: '#FCF5ED', card: '#FFFFFF', ink: '#4A3730', muted: '#A08878', line: '#ECDDCF', accent: '#CC7045', soft: '#F7DCC7', second: '#578EAD' },
  rose: { bg: '#FBF1F4', card: '#FFFFFF', ink: '#503348', muted: '#A17C93', line: '#EAD7E0', accent: '#B35B83', soft: '#F0D6E4', second: '#74A99B' },
  violet: { bg: '#F3F2FC', card: '#FFFFFF', ink: '#34315D', muted: '#8581A5', line: '#DEDDF0', accent: '#7461BE', soft: '#E0DCF5', second: '#51A8B5' },
  night: { bg: '#0E293C', card: '#16394F', ink: '#E9F6FF', muted: '#87AEC4', line: '#2A4C60', accent: '#65D8F1', soft: '#205268', second: '#F0BE83' },
};
let p;
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const rect = (x, y, w, h, fill = p.card, radius = 15, stroke = 'none') => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + radius + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"/>';
const txt = (x, y, value, size = 25, fill = p.ink, anchor = 'start', weight = 500) => '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" text-anchor="' + anchor + '" font-weight="' + weight + '">' + esc(value) + '</text>';
const line = (x1, y1, x2, y2, color = p.line, width = 3, dash = '') => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + width + '" stroke-dasharray="' + dash + '" stroke-linecap="round"/>';
const curve = (d, color = p.accent, width = 4, fill = 'none', dash = '') => '<path d="' + d + '" stroke="' + color + '" stroke-width="' + width + '" fill="' + fill + '" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="' + dash + '"/>';
const circle = (x, y, r, fill = p.accent, stroke = 'none') => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>';
const arrow = (x1, y1, x2, y2, color = p.muted, dash = '') => line(x1, y1, x2, y2, color, 3, dash) + '<path d="M-9 -5 L0 0 L-9 5" transform="translate(' + x2 + ' ' + y2 + ') rotate(' + Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + ')" fill="none" stroke="' + color + '" stroke-width="3" stroke-linejoin="round"/>';
const block = (x, y, w, title, subtitle = '', color = p.accent) => rect(x, y, w, 110, p.card, 16, p.line) + rect(x + 18, y + 22, 5, 60, color, 3) + txt(x + 39, y + 46, title, 26) + txt(x + 39, y + 79, subtitle, 20, p.muted);
const note = (value, y = 510) => txt(480, y, value, 22, p.muted, 'middle');
const check = (x, y, color = p.accent) => curve('M' + (x - 7) + ' ' + y + ' l6 6 l12 -15', color, 3);
const dots = (xs, y, color = p.accent) => xs.map(x => circle(x, y, 6, color)).join('');
const axis = (x, y, w, h) => line(x, y - h, x, y, p.muted, 2) + line(x, y, x + w, y, p.muted, 2);

const diagrams = {
  photonics() {
    let s = rect(260, 192, 435, 278, p.card, 20, p.line);
    [245, 330, 415].forEach((y, i) => {
      s += txt(80, y + 9, 'x' + (i + 1), 29, p.accent) + txt(845, y + 9, 'y' + (i + 1), 29, p.accent);
      s += line(135, y, 810, y, p.accent, 4);
    });
    [[333, 245, 330], [485, 330, 415], [617, 245, 330]].forEach(([x, a, b]) => {
      s += curve('M' + (x - 42) + ' ' + a + ' C' + x + ' ' + a + ' ' + x + ' ' + b + ' ' + (x + 42) + ' ' + b, p.second, 4);
      s += curve('M' + (x - 42) + ' ' + b + ' C' + x + ' ' + b + ' ' + x + ' ' + a + ' ' + (x + 42) + ' ' + a, p.accent, 4);
      s += circle(x, (a + b) / 2, 17, p.card, p.accent) + txt(x, (a + b) / 2 + 7, 'φ', 22, p.ink, 'middle');
    });
    return s + txt(103, 508, 'INPUT x', 22, p.muted, 'middle') + txt(475, 508, 'TUNABLE MATRIX W', 22, p.muted, 'middle') + txt(831, 508, 'Wx', 24, p.muted, 'middle');
  },
  paired() {
    return block(305, 176, 350, 'Shared test split', 'same inputs · same metric') + arrow(360, 286, 235, 338) + arrow(600, 286, 725, 338)
      + block(70, 341, 330, 'Baseline', 'independent run A') + block(560, 341, 330, 'Candidate', 'independent run B')
      + arrow(415, 396, 545, 396) + txt(480, 379, 'review', 19, p.accent, 'middle') + note('Compare outputs, then check the protocol together.');
  },
  robot() {
    let s = rect(57, 184, 290, 315, p.card) + line(89, 454, 314, 454, p.muted) + rect(167, 254, 78, 86, p.soft, 12, p.accent)
      + circle(206, 224, 28, p.soft, p.accent) + curve('M175 272 L128 312 L151 350 M238 272 L279 302 L267 340', p.ink, 8)
      + curve('M185 340 L161 391 L138 446 M227 340 L260 388 L279 446', p.ink, 9) + circle(206, 306, 9, p.second)
      + line(206, 306, 206, 454, p.second, 2, '6 7') + txt(202, 482, 'CENTER OF MASS', 17, p.muted, 'middle');
    s += rect(386, 184, 518, 315, p.card) + txt(414, 221, 'Pitch angle', 24) + axis(445, 436, 413, 161)
      + rect(447, 307, 268, 62, p.soft, 0) + txt(548, 298, 'stable window', 19, p.muted)
      + curve('M447 340 L480 337 L510 347 L544 335 L579 341 L614 338 L648 348 L681 330 L715 351 L751 378 L795 419 L853 430', p.accent, 5)
      + line(720, 258, 720, 437, p.second, 2, '5 6');
    [0, 2, 4, 6].forEach((v, i) => { s += txt(447 + i * 135, 465, v + 's', 19, p.muted, 'middle'); });
    return s + txt(746, 272, 'loss of balance', 18, p.accent);
  },
  remote() {
    return block(50, 229, 250, 'Laptop', 'SSH client') + block(355, 229, 250, 'Lab server', 'job + logs') + block(660, 229, 250, 'Device', 'acquisition')
      + arrow(309, 278, 343, 278, p.second, '5 5') + arrow(615, 278, 650, 278) + txt(329, 217, 'reconnect', 19, p.muted, 'middle')
      + line(480, 339, 480, 396, p.accent) + rect(311, 396, 338, 84, p.soft) + txt(480, 447, 'Durable checkpoint', 27, p.accent, 'middle');
  },
  gels() {
    let s = '';
    ['Too little', 'Partial network', 'Next formulation'].forEach((label, i) => {
      const x = 74 + i * 300;
      s += rect(x, 185, 268, 316, p.card) + rect(x + 70, 224, 128, 179, p.soft, 22, p.accent) + rect(x + 65, 214, 138, 23, p.accent, 5);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
        const px = x + 92 + col * 39, py = 272 + row * 33;
        s += circle(px, py, 5, p.accent);
        if (row < 3 && (i > 0 || col === 1)) s += line(px, py, px + (col < 2 ? 25 : -25), py + 33, p.accent, 2);
        if (col < 2 && i === 2) s += line(px, py, px + 39, py, p.accent, 2);
      }
      s += txt(x + 134, 447, label, 23, p.ink, 'middle') + txt(x + 134, 478, 'FORMULATION ' + (i + 1), 17, p.muted, 'middle');
    });
    return s;
  },
  rebuttal() {
    let s = block(58, 186, 245, 'Question', 'reviewer concern') + block(358, 186, 245, 'Evidence', 'traceable result') + block(658, 186, 245, 'Response', 'bounded claim')
      + arrow(312, 238, 347, 238) + arrow(612, 238, 647, 238);
    ['Theory check', 'New ablation', 'Source audit'].forEach((v, i) => {
      const y = 344 + i * 63;
      s += rect(105, y - 28, 750, 52, i % 2 ? p.soft : p.card, 9) + txt(136, y + 6, v, 24) + txt(521, y + 6, 'linked', 21, p.muted) + check(795, y - 3);
    });
    return s;
  },
  roadmap() {
    let s = '';
    ['Theory', 'Validation', 'Device design'].forEach((name, i) => {
      const y = 235 + i * 101;
      s += txt(69, y + 7, name, 24) + line(289, y, 861, y, p.line, 4);
      ['Scope', 'Protocol', 'Review'].forEach((stage, j) => {
        const x = 309 + j * 254;
        s += circle(x, y, 21, j === 0 ? p.accent : p.card, j === 0 ? p.accent : p.line) + (j === 0 ? check(x, y, p.card) : txt(x, y + 7, j + 1, 19, p.muted, 'middle'));
        s += txt(x, y + 48, stage, 20, p.muted, 'middle');
      });
    });
    return s;
  },
  outage() {
    let s = rect(75, 209, 810, 230, p.card) + line(124, 306, 836, 306, p.line, 7);
    const stages = [['RUNNING', 'save state'], ['POWER OFF', 'pause here'], ['VERIFY', 'check files'], ['RESUME', 'next morning']];
    stages.forEach(([name, sub], i) => {
      const x = 150 + i * 220;
      s += circle(x, 306, 18, i === 1 ? p.second : p.accent) + txt(x, 271, name, 21, i === 1 ? p.second : p.ink, 'middle') + txt(x, 362, sub, 21, p.muted, 'middle');
    });
    return s + note('Keep the missing interval visible in the experiment log.');
  },
  repro() {
    let s = '';
    [['SEED', '42'], ['ENV', 'locked'], ['CODE', 'commit'], ['DATA', 'hash']].forEach(([name, value], i) => {
      const x = 66 + i * 225;
      s += rect(x, 183, 202, 99, p.card) + txt(x + 101, 219, name, 20, p.muted, 'middle') + txt(x + 101, 256, value, 28, p.accent, 'middle');
    });
    s += arrow(480, 294, 480, 333) + block(110, 353, 310, 'Run A', 'saved environment') + block(540, 353, 310, 'Run B', 'dependency changed')
      + txt(479, 425, '≠', 48, p.second, 'middle');
    return s + note('Inspect the difference, not just the random seed.');
  },
  polling() {
    let s = rect(62, 190, 836, 291, p.card);
    ['POLLING', 'EVENT-DRIVEN'].forEach((v, i) => { s += txt(91, 253 + i * 130, v, 20, p.muted) + line(303, 264 + i * 130, 858, 264 + i * 130, p.line, 3); });
    for (let i = 0; i < 10; i++) {
      const x = 322 + i * 57;
      s += curve('M' + x + ' 264 v-36 h14 v36', i === 6 ? p.accent : p.line, 4);
    }
    s += curve('M303 394 H663 v-47 h20 v47 H858', p.accent, 5) + line(671, 207, 671, 438, p.second, 2, '5 7') + txt(682, 452, 'new event', 21, p.muted);
    return s + note('Fewer idle wake-ups. Measure latency before declaring victory.');
  },
  fieldwork() {
    let s = rect(66, 175, 828, 339, p.card);
    ['Wi-Fi', 'Outlet', 'Stay'].forEach((v, i) => { s += txt(468 + i * 160, 217, v, 23, p.muted, 'middle'); });
    for (let i = 0; i < 6; i++) {
      const y = 253 + i * 44;
      s += txt(98, y + 7, 'SITE ' + String(i + 1).padStart(2, '0'), 23) + line(278, y, 329, y, p.line, 2);
      for (let j = 0; j < 3; j++) {
        const x = 468 + j * 160, active = (i + j * 2) % 4 !== 0;
        s += rect(x - 43, y - 14, 86, 27, active ? p.soft : p.bg, 7) + txt(x, y + 6, active ? 'coded' : 'open', 18, active ? p.accent : p.muted, 'middle');
      }
    }
    return s;
  },
  qubit() {
    let s = rect(52, 207, 254, 268, p.card) + rect(353, 207, 254, 268, p.card) + rect(654, 207, 254, 268, p.card)
      + txt(179, 249, 'CONTROL', 21, p.muted, 'middle') + txt(480, 249, 'STATE', 21, p.muted, 'middle') + txt(781, 249, 'READOUT', 21, p.muted, 'middle');
    s += curve('M79 368 H107 V315 H158 V368 H187 V339 H233 V368 H279', p.accent, 4)
      + circle(480, 354, 76, 'none', p.line) + '<ellipse cx="480" cy="354" rx="76" ry="25" fill="none" stroke="' + p.muted + '" stroke-width="2"/>'
      + line(480, 268, 480, 439, p.line, 2) + arrow(480, 354, 520, 300, p.accent) + txt(534, 295, '|ψ⟩', 24, p.accent)
      + curve('M677 367 C698 367 699 289 718 297 S741 421 765 370 S796 305 817 347 S854 401 884 369', p.accent, 4)
      + arrow(316, 348, 341, 348) + arrow(616, 348, 643, 348);
    return s + note('A conceptual control chain, not a device measurement.');
  },
  desks() {
    let s = '';
    [['MODEL SIDE', 74], ['OPTICS SIDE', 586]].forEach(([name, x]) => {
      s += rect(x, 210, 300, 236, p.card) + rect(x + 69, 247, 163, 95, p.soft, 10, p.accent) + line(x + 148, 342, x + 148, 373, p.accent, 5)
        + line(x + 43, 379, x + 257, 379, p.ink, 5) + txt(x + 150, 423, name, 21, p.muted, 'middle');
    });
    s += arrow(389, 301, 571, 301) + txt(480, 276, 'protocol', 23, p.accent, 'middle') + arrow(571, 362, 389, 362) + txt(480, 399, 'data schema', 22, p.muted, 'middle');
    return s + note('Version the shared interface before moving the rubber duck.');
  },
  python() {
    return rect(65, 184, 830, 188, p.card) + dots([96, 121, 146], 211, p.muted)
      + txt(96, 263, '$ python -m venv .venv', 29, p.accent) + txt(96, 306, '$ source .venv/bin/activate', 29, p.ink) + txt(96, 347, '(.venv) $ which python', 27, p.second)
      + rect(108, 404, 300, 99, p.card, 14, p.line) + txt(258, 445, 'PROJECT A', 21, p.muted, 'middle') + txt(258, 481, 'isolated packages', 23, p.ink, 'middle')
      + line(480, 413, 480, 496, p.muted, 2, '5 6') + rect(552, 404, 300, 99, p.card, 14, p.line) + txt(702, 445, 'PROJECT B', 21, p.muted, 'middle') + txt(702, 481, 'isolated packages', 23, p.ink, 'middle');
  },
  optics() {
    let s = rect(61, 192, 838, 294, p.card) + line(95, 351, 865, 351, p.line, 2, '6 7') + circle(139, 351, 24, p.accent)
      + '<ellipse cx="369" cy="351" rx="17" ry="96" fill="' + p.soft + '" stroke="' + p.accent + '" stroke-width="3"/>'
      + line(599, 258, 599, 304, p.ink, 10) + line(599, 398, 599, 444, p.ink, 10) + rect(812, 282, 23, 139, p.soft, 4, p.accent);
    [282, 351, 420].forEach(y => { s += curve('M164 351 L369 ' + y + ' L823 351', p.second, 3); });
    [['SOURCE', 139], ['LENS', 369], ['APERTURE', 599], ['SENSOR', 823]].forEach(([v, x]) => { s += txt(x, 234, v, 20, p.muted, 'middle'); });
    return s + note('Label positions and distances alongside the setup photograph.');
  },
  behavior() {
    let s = rect(69, 188, 822, 304, p.card) + txt(96, 240, 'CONDITION', 20, p.muted) + txt(473, 240, 'OBSERVATION WINDOW', 20, p.muted);
    ['Name call', 'Food cue'].forEach((v, i) => {
      const y = 307 + i * 101;
      s += txt(97, y + 7, v, 25) + rect(365, y - 27, 470, 54, p.soft, 6) + line(347, y - 44, 347, y + 39, p.accent, 3) + txt(348, y + 66, 't = 0', 18, p.muted, 'middle');
      if (i === 0) s += txt(597, y + 7, 'no approach recorded', 23, p.muted, 'middle');
      else s += circle(542, y, 11, p.accent) + txt(569, y + 8, 'approach event', 23, p.accent);
    });
    return s;
  },
  queue() {
    let s = '';
    ['DRAFT', 'SUBMITTED', 'QUEUED', 'RUNNING'].forEach((v, i) => {
      const x = 60 + i * 226;
      s += rect(x, 218, 170, 122, i === 0 ? p.soft : p.card, 16, i === 0 ? p.accent : p.line) + circle(x + 85, 254, 10, i === 0 ? p.accent : p.line) + txt(x + 85, 303, v, 21, i === 0 ? p.accent : p.muted, 'middle');
      if (i < 3) s += arrow(x + 181, 276, x + 212, 276, p.muted, '4 5');
    });
    s += rect(117, 392, 726, 104, p.card) + txt(147, 435, 'GPU TASKS', 21, p.muted) + txt(147, 473, 'No job receipt yet', 25, p.ink) + curve('M476 461 H802', p.accent, 4);
    return s;
  },
  fault() {
    let s = block(314, 176, 332, 'Run failed', 'preserve the evidence') + line(480, 286, 480, 322, p.muted) + line(202, 322, 759, 322, p.muted);
    [['Mechanical', 'wheel / frame'], ['Control', 'sensor / loop'], ['Data', 'logs / backup']].forEach(([v, sub], i) => {
      const x = 67 + i * 284;
      s += arrow(x + 135, 322, x + 135, 357) + block(x, 358, 263, v, sub, i === 0 ? p.accent : p.second);
    });
    return s + note('Repair one cause, then reproduce the original test.');
  },
  proposal() {
    return block(76, 191, 333, 'Question', 'what is still unknown?') + block(551, 191, 333, 'Hypothesis', 'what could be false?')
      + block(551, 383, 333, 'Experiment', 'how would we test it?') + block(76, 383, 333, 'Criterion', 'what counts as evidence?')
      + arrow(422, 246, 537, 246) + arrow(717, 315, 717, 369) + arrow(537, 438, 422, 438) + arrow(242, 369, 242, 315);
  },
  dilution() {
    let s = rect(278, 175, 403, 75, p.soft) + txt(480, 224, 'C₁V₁ = C₂V₂', 33, p.accent, 'middle');
    s += rect(148, 297, 118, 141, p.card, 17, p.accent) + rect(158, 369, 98, 57, p.soft, 8) + rect(151, 285, 112, 20, p.accent, 4)
      + txt(207, 480, '10 mL · 10x stock', 24, p.ink, 'middle') + arrow(312, 362, 617, 362) + txt(465, 331, 'dilute to 100 mL', 24, p.accent, 'middle')
      + curve('M726 289 V329 L674 426 Q670 440 686 440 H816 Q832 440 828 426 L776 329 V289 Z', p.accent, 3, p.card)
      + curve('M700 380 L680 426 H822 L802 380 Z', 'none', 0, p.soft) + line(721, 289, 781, 289, p.accent, 4) + txt(751, 480, '1x working buffer', 24, p.ink, 'middle');
    return s;
  },
  interview() {
    let s = '';
    ['Audio', 'Transcript', 'Codes', 'Themes'].forEach((v, i) => {
      const x = 66 + i * 223;
      s += rect(x, 190, 162, 82, p.card) + txt(x + 81, 240, v, 25, p.ink, 'middle');
      if (i < 3) s += arrow(x + 175, 231, x + 208, 231);
    });
    ['quote 01', 'quote 02', 'quote 03'].forEach((v, i) => {
      const y = 329 + i * 69;
      s += rect(108, y - 28, 220, 52, p.card, 8) + txt(134, y + 6, v, 23) + arrow(343, y - 2, 574, i === 1 ? 383 : 455, p.line, '5 4');
    });
    s += rect(590, 354, 244, 60, p.soft, 10) + txt(712, 392, 'Access barriers', 24, p.accent, 'middle') + rect(590, 426, 244, 60, p.soft, 10) + txt(712, 464, 'Workarounds', 24, p.accent, 'middle');
    return s;
  },
  leakage() {
    let s = '';
    [78, 522].forEach((x, i) => {
      s += rect(x, 180, 360, 319, p.card) + txt(x + 180, 222, i ? 'GROUP-AWARE SPLIT' : 'NEIGHBOR LEAKAGE', 20, i ? p.accent : p.second, 'middle')
        + line(x + 180, 248, x + 180, 437, p.line, 2, '4 6') + txt(x + 85, 470, 'TRAIN', 20, p.muted, 'middle') + txt(x + 275, 470, 'VALIDATE', 20, p.muted, 'middle');
      for (let row = 0; row < 3; row++) {
        const y = 279 + row * 62;
        s += circle(x + 73, y, 18, row === 1 ? p.second : p.accent) + circle(x + 116, y + 14, 18, row === 1 ? p.second : p.accent);
        s += circle(x + 249, y, 18, i ? p.muted : row === 1 ? p.second : p.accent) + circle(x + 292, y + 14, 18, i ? p.muted : row === 1 ? p.second : p.accent);
        if (!i) s += line(x + 138, y + 7, x + 225, y + 7, p.second, 2, '4 5');
      }
    });
    return s;
  },
  ablation() {
    let s = rect(62, 177, 836, 337, p.card) + txt(94, 215, 'CONFIGURATION', 20, p.muted);
    ['Cal.', 'Noise', 'Phase', 'Error'].forEach((v, i) => { s += txt(458 + i * 111, 215, v, 22, p.muted, 'middle'); });
    ['Full system', 'No calibration', 'No correction', 'Fixed phase'].forEach((v, row) => {
      const y = 264 + row * 67;
      s += line(88, y + 24, 871, y + 24, p.line, 1) + txt(94, y + 7, v, 24);
      for (let col = 0; col < 3; col++) s += row === col + 1 ? line(448 + col * 111, y, 468 + col * 111, y, p.second, 3) : check(458 + col * 111, y);
      s += txt(791, y + 7, 'TBD', 21, p.muted, 'middle');
    });
    return s;
  },
  evaluation() {
    let s = '';
    [['Hallucination', 'claim / evidence', 'collect cases'], ['Citations', 'source / passage', 'verify links'], ['Abstention', 'answer / boundary', 'review failures']].forEach(([a, b, c], i) => {
      const y = 188 + i * 110;
      s += rect(65, y, 830, 94, p.card) + circle(108, y + 47, 21, p.soft) + txt(108, y + 54, i + 1, 22, p.accent, 'middle')
        + txt(148, y + 38, a, 26) + txt(148, y + 72, b, 21, p.muted) + txt(634, y + 53, c, 23, p.accent) + circle(857, y + 45, 8, p.line);
    });
    return s;
  },
  calibration() {
    let s = rect(66, 185, 828, 324, p.card) + axis(122, 441, 697, 195) + line(480, 222, 480, 440, p.muted, 2, '5 7');
    const resonance = (center, color) => {
      const points = Array.from({ length: 100 }, (_, i) => {
        const x = 123 + i * 7;
        const y = 267 + 147 * Math.exp(-(((x - center) / 61) ** 2));
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }).join(' ');
      return curve(points, color, 4);
    };
    s += resonance(550, p.second) + resonance(480, p.accent) + txt(123, 223, 'Response', 21, p.muted)
      + line(660, 326, 695, 326, p.second, 4) + txt(709, 333, 'drifted', 22, p.second) + line(660, 373, 695, 373, p.accent, 4) + txt(709, 380, 'aligned', 22, p.accent)
      + txt(475, 483, 'Frequency relative to reference', 21, p.muted, 'middle');
    return s;
  },
  handoff() {
    let s = block(66, 191, 339, 'Tonight', 'stop at a safe boundary') + block(555, 191, 339, 'Tomorrow', 'resume from saved state') + arrow(421, 246, 539, 246);
    ['Parameters', 'Checkpoint', 'Next run queue'].forEach((v, i) => {
      const x = 65 + i * 287;
      s += rect(x, 358, 257, 132, p.card, 13, p.line) + check(x + 128, 398) + txt(x + 128, 454, v, 24, p.ink, 'middle');
    });
    return s;
  },
  feedback() {
    return block(85, 184, 320, 'Progress', 'evidence + open questions') + block(555, 184, 320, 'Feedback', 'one concrete next step')
      + block(555, 381, 320, 'Support', 'time / compute / coffee') + block(85, 381, 320, 'Focus time', 'room to try and recover')
      + arrow(420, 239, 540, 239) + arrow(715, 308, 715, 367) + arrow(540, 436, 420, 436) + arrow(245, 367, 245, 308);
  },
  paper() {
    let s = rect(56, 206, 848, 181, p.card) + line(124, 275, 835, 275, p.line, 4);
    ['Draft', 'Review', 'Revise', 'Accept', 'Archive'].forEach((v, i) => {
      const x = 123 + i * 178;
      s += circle(x, 275, 22, i < 4 ? p.accent : p.soft) + (i < 4 ? check(x, 275, p.card) : txt(x, 283, '5', 21, p.accent, 'middle'))
        + txt(x, 342, v, 24, p.ink, 'middle');
    });
    s += arrow(835, 393, 835, 449) + rect(302, 433, 468, 69, p.soft) + arrow(820, 468, 783, 468) + txt(536, 476, 'Next question → next experiment', 25, p.accent, 'middle');
    return s;
  },
};

const seen = new Set();
const thumbs = [];
let total = 0;
let largest = 0;
for (const [index, figure] of figures.entries()) {
  if (seen.has(figure.id) || !diagrams[figure.diagram] || !themes[figure.theme]) throw new Error('Invalid demo figure: ' + figure.id);
  seen.add(figure.id);
  p = themes[figure.theme];
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600"><g font-family="Arial, Helvetica, sans-serif">'
    + rect(0, 0, 960, 600, p.bg, 0)
    + txt(49, 62, String(index + 1).padStart(2, '0') + ' / ' + figure.field, 17, p.muted, 'start', 700)
    + rect(762, 34, 149, 37, p.soft, 18) + txt(836, 58, 'DEMO FIGURE', 16, p.accent, 'middle', 700)
    + txt(48, 118, figure.title, 37, p.ink, 'start', 700) + line(49, 151, 911, 151, p.line, 1)
    + diagrams[figure.diagram]() + line(49, 550, 911, 550, p.line, 1)
    + txt(49, 579, 'ONLYFUNDS / LAB NOTES', 15, p.muted, 'start', 700) + txt(911, 579, 'SCHEMATIC · NOT EXPERIMENTAL DATA', 14, p.muted, 'end') + '</g></svg>';
  const buffer = await sharp(Buffer.from(svg)).webp({ quality: 82, effort: 6 }).toBuffer();
  if (buffer.length > 55000) throw new Error('Figure exceeds 55 kB budget: ' + figure.id);
  await writeFile(path.join(destination, figure.id + '.webp'), buffer);
  await writeFile(path.join(previews, figure.id + '.svg'), svg);
  total += buffer.length;
  largest = Math.max(largest, buffer.length);
  thumbs.push({ input: await sharp(buffer).resize(320, 200).png().toBuffer(), left: index % 4 * 320, top: Math.floor(index / 4) * 200 });
}
await sharp({ create: { width: 1280, height: Math.ceil(figures.length / 4) * 200, channels: 3, background: '#ffffff' } }).composite(thumbs).png().toFile(path.join(previews, 'contact-sheet.png'));
console.log(JSON.stringify({ count: figures.length, totalBytes: total, largestBytes: largest, dimensions: '960 × 600', format: 'WebP', quality: 82 }, null, 2));
