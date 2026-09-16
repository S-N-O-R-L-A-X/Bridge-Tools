import Board from "../models/Board";
import Hand from "../models/Hand";
import Card from "../models/Card";
import { Position, COLORS, TRUMP } from "./maps";

export interface PlayedCard {
  position: Position;
  suit: string;
  rank: string;
}

export interface Contract {
  level: number;
  strain: TRUMP;
  declarer: Position;
}

export interface PlaySnapshot {
  playedCards: PlayedCard[];
  currentTrick: PlayedCard[];
  trickNumber: number;
  currentPlayer: Position;
  nsTricks: number;
  ewTricks: number;
}

export const PLAY_ORDER: Position[] = ["N", "E", "S", "W"];
export const SUIT_ICONS: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_COLORS: Record<string, string> = { S: "black", H: "red", D: "red", C: "black" };
export const SUIT_NAMES: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣", NT: "NT" };
export const RANK_ORDER: Record<string, number> = { A: 12, K: 11, Q: 10, J: 9, "10": 8, "9": 7, "8": 6, "7": 5, "6": 4, "5": 3, "4": 2, "3": 1, "2": 0 };

export const isNS = (pos: Position): boolean => pos === "N" || pos === "S";

export function nextPosition(pos: Position): Position {
  const idx = PLAY_ORDER.indexOf(pos);
  return PLAY_ORDER[(idx + 1) % 4];
}

export function getTrickWinner(trick: PlayedCard[], trump: TRUMP): Position {
  if (trick.length === 0) return "N";
  const ledSuit = trick[0].suit;
  let best = trick[0];
  for (const c of trick) {
    const cIsTrump = trump !== "NT" && c.suit === trump;
    const bestIsTrump = trump !== "NT" && best.suit === trump;
    const ledIsTrump = trump !== "NT" && ledSuit === trump;
    if (cIsTrump && !bestIsTrump) {
      best = c;
    } else if (cIsTrump && bestIsTrump) {
      if (RANK_ORDER[c.rank] > RANK_ORDER[best.rank]) best = c;
    } else if (!cIsTrump && !bestIsTrump) {
      if (c.suit === ledSuit && best.suit === ledSuit && RANK_ORDER[c.rank] > RANK_ORDER[best.rank]) best = c;
      else if (c.suit === ledSuit && best.suit !== ledSuit) best = c;
    }
  }
  return best.position;
}

export function mustFollowSuit(hand: Record<string, string[]>, trick: PlayedCard[], trump: TRUMP): Record<string, boolean> {
  if (trick.length === 0) {
    const result: Record<string, boolean> = {};
    for (const s of COLORS) result[s] = hand[s].length > 0;
    return result;
  }
  const ledSuit = trick[0].suit;
  const hasLedSuit = hand[ledSuit] && hand[ledSuit].length > 0;
  const result: Record<string, boolean> = {};
  if (hasLedSuit) {
    for (const s of COLORS) result[s] = s === ledSuit;
  } else {
    for (const s of COLORS) result[s] = hand[s].length > 0;
  }
  return result;
}

export function getContractTricks(level: number): number {
  return level + 6;
}

export function formatContract(contract: Contract): string {
  const strainStr = contract.strain === "NT" ? "NT" : SUIT_NAMES[contract.strain];
  return `${contract.level}${strainStr} ${contract.declarer}`;
}

export function calcHCP(hand: Hand): number {
  return hand.points;
}

export function generateRemainingPBN(board: Board, playedCards: PlayedCard[], leader?: Position): string {
  const startIdx = leader ? PLAY_ORDER.indexOf(leader) : 0;
  const playedMap: Record<string, Set<string>> = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
  for (const pc of playedCards) playedMap[pc.position].add(pc.suit + pc.rank);
  const handByPos: Record<string, Hand> = { N: board.Nhand, S: board.Shand, E: board.Ehand, W: board.Whand };

  const handStrs: string[] = [];
  for (let i = 0; i < 4; i++) {
    const pos = PLAY_ORDER[(startIdx + i) % 4];
    const hand = handByPos[pos];
    const bySuit = COLORS.map(s => {
      return hand.hand[s]
        .filter(r => !playedMap[pos].has(s + r))
        .sort((a, b) => Card.RANK[a] - Card.RANK[b])
        .join("")
        .replace(/10/g, "T");
    });
    handStrs.push(bySuit.join("."));
  }

  return `${leader ?? "N"}:${handStrs.join(" ")}`;
}

export function runDDS(pbn: string): (string | number)[][] {
  const res = (window as any).calcDDTable(pbn);
  const t: (string | number)[][] = [[], [], [], []];
  const denoms = ["N", "S", "H", "D", "C"];
  const declarers: Position[] = ["N", "S", "E", "W"];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      const d = res[denoms[c]];
      if (d == null) throw new Error('DDS result missing ' + denoms[c]);
      t[r][c] = d[declarers[r]];
    }
  return t;
}