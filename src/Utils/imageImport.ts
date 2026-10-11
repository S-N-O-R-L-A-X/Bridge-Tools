import { ColorsShort, Position } from "./maps";
import { parseSuitInput, RanksBySuit } from "./manualBoard";

export interface ParsedHands {
  hands: Partial<Record<Position, RanksBySuit>>;
  boardnum: number | null;
  warnings: string[];
  raw: string;
}

export interface AISettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const SUIT_ORDER: ColorsShort[] = ["S", "H", "D", "C"];
const AI_SETTINGS_KEY = "bridge-tools:ai-vision-settings";

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AISettings>;
      return {
        baseUrl: parsed.baseUrl ?? "https://api.openai.com/v1",
        apiKey: parsed.apiKey ?? "",
        model: parsed.model ?? "gpt-4o-mini",
      };
    }
  } catch {
    // ignore
  }
  return { baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini" };
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function emptyRanks(): RanksBySuit {
  return { S: [], H: [], D: [], C: [] };
}

/** 统一全角字符、花色符号与大小写，便于后续解析。 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[\uFF21-\uFF3A\uFF41-\uFF5A]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[\u00A0\u3000]/g, " ")
    .toUpperCase()
    .replace(/[♤]/g, "♠")
    .replace(/[♡]/g, "♥")
    .replace(/[♢]/g, "♦")
    .replace(/[♧]/g, "♣")
    .replace(/♠/g, " [S] ")
    .replace(/♥/g, " [H] ")
    .replace(/♦/g, " [D] ")
    .replace(/♣/g, " [C] ");
}

/** 从一段文本中按花色标记（符号或 S/H/D/C 字母）提取各家牌型。 */
function extractSuits(block: string): RanksBySuit {
  const bySuit = emptyRanks();
  const markerRe = /\[([SHDC])\]|(?<![A-Z])([SHDC])(?![A-Z])|(?<![A-Z])([SHDC])(?=[AKQJT2-9])/g;
  const markers: { suit: ColorsShort; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(block)) !== null) {
    const suit = (m[1] ?? m[2] ?? m[3]) as ColorsShort;
    markers.push({ suit, start: m.index, end: markerRe.lastIndex });
  }
  for (let i = 0; i < markers.length; i++) {
    const from = markers[i].end;
    const to = i + 1 < markers.length ? markers[i + 1].start : block.length;
    const { ranks } = parseSuitInput(block.slice(from, to));
    const suit = markers[i].suit;
    for (const rank of ranks) if (!bySuit[suit].includes(rank)) bySuit[suit].push(rank);
  }
  return bySuit;
}

/** PBN 点分格式：AKQJ4.KJ3.A5.862（花色顺序 黑桃.红心.方块.梅花）。 */
function extractDotted(block: string): RanksBySuit | null {
  const cleaned = block.replace(/[^AKQJT2-9.\s]/g, " ");
  const match = cleaned.match(/([AKQJT2-9]*\.[AKQJT2-9]*\.[AKQJT2-9]*\.[AKQJT2-9]*)/);
  if (!match) return null;
  const groups = match[1].split(".");
  if (groups.length !== 4) return null;
  const bySuit = emptyRanks();
  groups.forEach((g, i) => {
    bySuit[SUIT_ORDER[i]] = parseSuitInput(g).ranks;
  });
  return bySuit;
}

function blockToRanks(block: string): RanksBySuit {
  const byMarkers = extractSuits(block);
  const markerCount = byMarkers.S.length + byMarkers.H.length + byMarkers.D.length + byMarkers.C.length;
  if (markerCount > 0) return byMarkers;
  const dotted = extractDotted(block);
  return dotted ?? byMarkers;
}

interface SeatLabel {
  pos: Position;
  kind: "name" | "letter";
  start: number;
  end: number;
}

function findSeatLabels(text: string): SeatLabel[] {
  const labels: SeatLabel[] = [];
  const add = (re: RegExp, kind: SeatLabel["kind"], resolve: (s: string) => Position | null) => {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const pos = resolve(m[0]);
      if (!pos) continue;
      labels.push({ pos, kind, start: m.index, end: re.lastIndex });
    }
  };

  add(/\bNORTH\b|\bSOUTH\b|\bEAST\b|\bWEST\b/g, "name", (s) => s[0] as Position);
  add(/北\s*家?|南\s*家?|东\s*家?|西\s*家?/g, "name", (s) => {
    const map: Record<string, Position> = { 北: "N", 南: "S", 东: "E", 西: "W" };
    return map[s[0]] ?? null;
  });
  add(/(?<![A-Z])([NSEW])(?:\s*[:：])?\s*(?![A-Z0-9])(?=\s|\[|$)/g, "letter", (s) => s[0] as Position);

  let filtered = labels;
  if (labels.some((l) => l.kind === "name")) {
    filtered = labels.filter((l) => l.kind === "name");
  }
  filtered.sort((a, b) => a.start - b.start);
  const dedup: SeatLabel[] = [];
  for (const label of filtered) {
    if (dedup.length > 0 && label.start < dedup[dedup.length - 1].end) continue;
    dedup.push(label);
  }
  return dedup;
}

function parseSeatSegments(text: string): Partial<Record<Position, RanksBySuit>> {
  const labels = findSeatLabels(text);
  const candidates: Partial<Record<Position, RanksBySuit>> = {};
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const from = label.end;
    const to = i + 1 < labels.length ? labels[i + 1].start : text.length;
    const ranks = blockToRanks(text.slice(from, to));
    const count = ranks.S.length + ranks.H.length + ranks.D.length + ranks.C.length;
    if (count === 0) continue;
    const current = candidates[label.pos];
    const currentCount = current ? current.S.length + current.H.length + current.D.length + current.C.length : 0;
    if (!current || count > currentCount) candidates[label.pos] = ranks;
  }
  return candidates;
}

/** PBN 发牌串：N:AKQJ4.KJ3.A5.862 AKQJ4... ... ...（从起始座顺时针）。 */
function parsePbnDeal(text: string): Partial<Record<Position, RanksBySuit>> | null {
  const m = text.match(/\b([NSEW])\s*:\s*([AKQJT2-9.\s]+)/);
  if (!m) return null;
  const first = m[1] as Position;
  const groups = m[2].trim().split(/\s+/).filter(Boolean);
  if (groups.length < 4) return null;
  const order: Position[] = ["N", "E", "S", "W"];
  const startIdx = order.indexOf(first);
  const result: Partial<Record<Position, RanksBySuit>> = {};
  for (let i = 0; i < 4; i++) {
    const grp = groups[i].split(".");
    if (grp.length !== 4) return null;
    const bySuit = emptyRanks();
    grp.forEach((g, j) => {
      bySuit[SUIT_ORDER[j]] = parseSuitInput(g).ranks;
    });
    result[order[(startIdx + i) % 4]] = bySuit;
  }
  return result;
}

function countCards(hands: Partial<Record<Position, RanksBySuit>>): number {
  let total = 0;
  for (const pos of ["N", "S", "E", "W"] as Position[]) {
    const hand = hands[pos];
    if (!hand) continue;
    total += hand.S.length + hand.H.length + hand.D.length + hand.C.length;
  }
  return total;
}

function detectBoardNumber(text: string): number | null {
  const patterns = [/第\s*(\d{1,2})\s*副/, /\bBOARD\s*#?\s*(\d{1,2})\b/i, /\bBD\s*\.?\s*(\d{1,2})\b/i];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = Number(m[1]);
      if (n >= 1 && n <= 16) return n;
    }
  }
  return null;
}

function validate(hands: Partial<Record<Position, RanksBySuit>>): string[] {
  const warnings: string[] = [];
  const counts: Record<Position, number> = { N: 0, S: 0, E: 0, W: 0 };
  const seen = new Map<string, Position>();
  let total = 0;
  for (const pos of ["N", "S", "E", "W"] as Position[]) {
    const hand = hands[pos];
    if (!hand) continue;
    for (const suit of SUIT_ORDER) {
      for (const rank of hand[suit]) {
        const key = suit + rank;
        counts[pos] += 1;
        total += 1;
        if (seen.has(key)) {
          warnings.push(`${suit}${rank === "10" ? "10" : rank} 重复出现，请核对`);
        } else {
          seen.set(key, pos);
        }
      }
    }
  }
  for (const pos of ["N", "S", "E", "W"] as Position[]) {
    if (counts[pos] !== 13) warnings.push(`${pos} 家识别到 ${counts[pos]} 张（应为 13 张）`);
  }
  if (total !== 52) warnings.push(`共识别到 ${total} 张（应为 52 张）`);
  return warnings;
}

/** 把识别出来的文本解析成四家牌，附带牌型校验警告。 */
export function parseHandsFromText(raw: string): ParsedHands {
  const text = normalizeText(raw);
  const boardnum = detectBoardNumber(text);

  let hands = parsePbnDeal(text);
  if (!hands || countCards(hands) < 40) {
    const segHands = parseSeatSegments(text);
    if (countCards(segHands) > countCards(hands ?? {})) hands = segHands;
  }
  if (!hands || countCards(hands) === 0) {
    return {
      hands: {},
      boardnum,
      warnings: ["未能从图片中解析出牌张，请尝试更清晰的图片或改用 AI 识别。"],
      raw: text,
    };
  }

  const warnings = validate(hands);
  return { hands, boardnum, warnings, raw: text };
}

/** 本地 OCR：使用 tesseract.js 识别图片文字。 */
export async function ocrImage(
  file: File,
  onProgress?: (progress: number, status: string) => void,
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => onProgress?.(m.progress ?? 0, m.status ?? ""),
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

const AI_PROMPT = [
  "你是桥牌牌型识别助手。图片里是一副桥牌的四家手牌（可能带有 N/S/E/W 或东南西北的方位标记）。",
  "请只输出一行 PBN 格式的发牌串，不要输出任何解释、代码块或多余文字：",
  "N:AKQJ4.KJ3.A5.862 T98.T98.T98.T98 765.765.765.765 32.32.32.32",
  "规则：四个手牌用空格分隔，从 N 开始按顺时针顺序 N、E、S、W；每个手牌按 黑桃.红心.方块.梅花 用点分隔；10 必须写成 T；没有的牌张组用空串表示（例如 2..AJ.9）。",
  "如果无法确定方位，请按图片从上到下、从左到右的顺序对应 N、E、S、W。",
].join("\n");

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** 调用 OpenAI 兼容的视觉接口识别图片，返回原始文本（PBN 发牌串）。 */
export async function aiRecognizeImage(file: File, settings: AISettings): Promise<string> {
  if (!settings.apiKey) throw new Error("请先在设置中填写 API Key");
  const dataUrl = await fileToDataUrl(file);
  const url = `${settings.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0,
      messages: [
        { role: "system", content: AI_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "请识别这张桥牌图片中的四家牌。" },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI 接口返回 ${res.status}${body ? `：${body.slice(0, 200)}` : ""}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("AI 接口未返回内容");
  return content;
}
