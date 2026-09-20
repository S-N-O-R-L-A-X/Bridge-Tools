import Board from "../models/Board";
import Hand from "../models/Hand";
import Card from "../models/Card";
import { COLORS, ColorsShort, Position } from "./maps";

export type RanksBySuit = Record<ColorsShort, string[]>;

export interface ManualBoardData {
  boardnum: number;
  hands: Record<Position, RanksBySuit>;
}

const STORAGE_KEY = "bridge-tools:manual-board";

export interface ParsedSuitResult {
  ranks: string[];
  invalid: string[];
  hasDuplicate: boolean;
}

/**
 * 解析单个花色的输入字符串。
 * 支持 A K Q J T(或 10) 9 8 7 6 5 4 3 2，大小写不限，允许空格/逗号等分隔符。
 */
export function parseSuitInput(input: string): ParsedSuitResult {
  const norm = ("" + input).toUpperCase().replace(/10/g, "T");
  const ranks: string[] = [];
  const invalidSet = new Set<string>();

  for (const ch of norm) {
    if (ch === "T") { ranks.push("10"); continue; }
    if (ch === "1" || ch === "0") continue;
    if ("AKQJ98765432".includes(ch)) ranks.push(ch);
    else if (!/[ \t,.;/、|－\-]/.test(ch)) invalidSet.add(ch);
  }

  const seen = new Set(ranks);
  return { ranks, invalid: [...invalidSet], hasDuplicate: seen.size !== ranks.length };
}

export function makeHandFromRanks(bySuit: Partial<RanksBySuit>): Hand {
  const hand = new Hand();
  const cards: Card[] = [];
  for (const suit of COLORS) {
    for (const rank of bySuit[suit] ?? []) cards.push(new Card(suit, rank));
  }
  hand.addCards(cards);
  return hand;
}

export function makeBoardFromManual(data: ManualBoardData): Board {
  const hands = data.hands ?? { N: {}, S: {}, E: {}, W: {} };
  const board = new Board(data.boardnum);
  board.Nhand = makeHandFromRanks(hands.N);
  board.Shand = makeHandFromRanks(hands.S);
  board.Ehand = makeHandFromRanks(hands.E);
  board.Whand = makeHandFromRanks(hands.W);
  return board;
}

export function saveManualBoard(data: ManualBoardData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function loadManualBoard(): ManualBoardData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ManualBoardData;
    if (typeof data !== "object" || data === null || !data.hands) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearManualBoard(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}