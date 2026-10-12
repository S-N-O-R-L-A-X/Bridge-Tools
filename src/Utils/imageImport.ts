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
  preset: string;
  disableThinking: boolean;
}

export interface AIProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  note?: string;
  disableThinking?: boolean;
}

/** 预设的 OpenAI 兼容视觉接口，选中后会自动填入接口地址与模型。 */
export const AI_PRESETS: AIProviderPreset[] = [
  {
    id: "qwen3.5-4b",
    label: "Qwen3.5-4B（自建视觉，推荐）",
    baseUrl: "http://localhost:8000/v1",
    model: "Qwen/Qwen3.5-4B",
    note: "本地 transformers serve / vLLM 部署的 OpenAI 兼容接口",
    disableThinking: true,
  },
  {
    id: "glm-4v",
    label: "GLM-4V-9B（自建视觉）",
    baseUrl: "http://localhost:8000/v1",
    model: "THUDM/GLM-4V-9B",
    note: "本地 vLLM 部署；注意 GLM-4-9B-0414 为纯文本模型，无法识图",
  },
  {
    id: "glm-4.1v",
    label: "GLM-4.1V-9B-Thinking（自建视觉）",
    baseUrl: "http://localhost:8000/v1",
    model: "THUDM/GLM-4.1V-9B-Thinking",
    note: "本地 vLLM 部署，识别更准但更慢",
    disableThinking: true,
  },
  {
    id: "siliconflow",
    label: "SiliconFlow 硅基流动",
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "Qwen/Qwen3.5-4B",
    note: "需填写 SiliconFlow API Key，模型名以平台实际可用为准",
    disableThinking: true,
  },
  {
    id: "zhipu",
    label: "智谱 GLM 云（glm-4v-flash）",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4v-flash",
    note: "需填写智谱开放平台的 API Key",
  },
  {
    id: "openai",
    label: "OpenAI（gpt-4o-mini）",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    note: "需填写 OpenAI API Key",
  },
  {
    id: "custom",
    label: "自定义（OpenAI 兼容）",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    note: "手动填写接口地址与模型名",
  },
];

export const DEFAULT_AI_PRESET_ID = "qwen3.5-4b";

export function getPreset(id: string): AIProviderPreset {
  return AI_PRESETS.find((p) => p.id === id) ?? AI_PRESETS[AI_PRESETS.length - 1];
}

const SUIT_ORDER: ColorsShort[] = ["S", "H", "D", "C"];
const AI_SETTINGS_KEY = "bridge-tools:ai-vision-settings";

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AISettings>;
      const preset = getPreset(parsed.preset ?? DEFAULT_AI_PRESET_ID);
      return {
        baseUrl: parsed.baseUrl ?? preset.baseUrl,
        apiKey: parsed.apiKey ?? "",
        model: parsed.model ?? preset.model,
        preset: parsed.preset ?? DEFAULT_AI_PRESET_ID,
        disableThinking: parsed.disableThinking ?? preset.disableThinking ?? false,
      };
    }
  } catch {
    // ignore
  }
  const preset = getPreset(DEFAULT_AI_PRESET_ID);
  return {
    baseUrl: preset.baseUrl,
    apiKey: "",
    model: preset.model,
    preset: preset.id,
    disableThinking: preset.disableThinking ?? false,
  };
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

/** 解析模型输出的 JSON 牌型：{"N":{"S":"AKQJ","H":"..","D":..,"C":..}, "E":...}。 */
function parseJsonHands(raw: string): Partial<Record<Position, RanksBySuit>> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const keyMap: Record<string, Position> = {
    N: "N",
    E: "E",
    S: "S",
    W: "W",
    北: "N",
    东: "E",
    南: "S",
    西: "W",
  };
  const result: Partial<Record<Position, RanksBySuit>> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const pos = keyMap[key.trim().charAt(0).toUpperCase()] ?? keyMap[key.trim()];
    if (!pos || typeof value !== "object" || value === null) continue;
    const suitObj = value as Record<string, unknown>;
    const bySuit = emptyRanks();
    for (const suit of SUIT_ORDER) {
      const v = suitObj[suit] ?? suitObj[suit.toLowerCase()];
      if (typeof v === "string") bySuit[suit] = parseSuitInput(v).ranks;
    }
    const count = bySuit.S.length + bySuit.H.length + bySuit.D.length + bySuit.C.length;
    if (count > 0) result[pos] = bySuit;
  }
  return countCards(result) > 0 ? result : null;
}

/** 把识别出来的文本解析成四家牌，附带牌型校验警告。 */
export function parseHandsFromText(raw: string): ParsedHands {
  const text = normalizeText(raw);
  const boardnum = detectBoardNumber(text);

  let hands: Partial<Record<Position, RanksBySuit>> | null = parseJsonHands(raw);
  if (!hands || countCards(hands) < 40) {
    const pbn = parsePbnDeal(text);
    const segHands = parseSeatSegments(text);
    const best = countCards(pbn ?? {}) >= countCards(segHands) ? pbn : segHands;
    if (countCards(best ?? {}) > countCards(hands ?? {})) hands = best;
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
  "你是桥牌牌型识别助手。图片是一副桥牌的四家手牌，每家按 ♠黑桃 ♥红心 ♦方块 ♣梅花 四门花色显示 13 张牌。",
  "请识别图片中每个方位（N北 E东 S南 W西）的每一门花色，并以 JSON 输出。",
  "只输出一个 JSON 对象，不要任何解释、Markdown 代码块或多余文字。格式如下：",
  '{"N":{"S":"AKQJ4","H":"KJ3","D":"A5","C":"862"},"E":{"S":"T98","H":"T98","D":"T98","C":"T98"},"S":{"S":"765","H":"765","D":"765","C":"765"},"W":{"S":"32","H":"32","D":"32","C":"32"}}',
  "规则：",
  "1. 顶层键只能是 N、E、S、W；每个键下只能是 S、H、D、C 四门花色。",
  "2. 每门花色的值只用字符 A K Q J T 9 8 7 6 5 4 3 2；10 必须写成 T，绝不能写成 10；该花色没有牌时用空字符串。",
  "3. 每家必须正好 13 张牌，同一门花色内不能出现重复的牌。",
  "4. 按图片上的方位标记判断 N/E/S/W；若没有标记，按上=N、下=S、左=W、右=E 推断。",
  "只输出 JSON，务必保证四家共 52 张且无重复。",
].join("\n");

const MAX_IMAGE_DIM = 2048;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(width, height));
        if (scale >= 1) {
          resolve(src);
          return;
        }
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** 调用 OpenAI 兼容的视觉接口识别图片，返回原始文本（PBN 发牌串）。 */
export async function aiRecognizeImage(file: File, settings: AISettings): Promise<string> {
  if (!settings.baseUrl) throw new Error("请先在接口设置中填写接口地址");
  if (!settings.model) throw new Error("请先在接口设置中填写模型名称");
  const dataUrl = await fileToDataUrl(file);
  const base = settings.baseUrl.trim().replace(/\/+$/, "");
  const url = /\/chat\/completions$/.test(base) ? base : `${base}/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: settings.model,
        stream: false,
        temperature: 0,
        max_tokens: 4096,
        ...(settings.disableThinking ? { enable_thinking: false } : {}),
        messages: [
          { role: "system", content: AI_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "请识别这张桥牌图片，只输出规定的 JSON。" },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
  } catch (e) {
    if (controller.signal.aborted) {
      throw new Error("请求超时（180 秒）接口仍无响应，请检查网络、接口地址或模型是否可用。");
    }
    throw new Error(
      `无法连接接口，可能是网络错误或浏览器跨域（CORS）限制：${e instanceof Error ? e.message : String(e)}。` +
        "若在浏览器中直连第三方接口被拦截，可改用支持 CORS 的接口或本地代理。",
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI 接口返回 ${res.status}${body ? `：${body.slice(0, 200)}` : ""}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string; reasoning_content?: string } }[];
  };
  const message = json.choices?.[0]?.message;
  const content = (message?.content || message?.reasoning_content || "").trim();
  if (!content) throw new Error("AI 接口未返回内容");
  return content;
}
