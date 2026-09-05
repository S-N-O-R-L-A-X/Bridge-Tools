import { useState, useMemo, useCallback, useEffect } from "react";
import Board from "../../models/Board";
import Hand from "../../models/Hand";
import Card from "../../models/Card";
import { Position, COLORS } from "../../Utils/maps";
import ShowTricks from "./ShowTricks";
import "./MyPlayBoard.css";

interface PlayedCard {
  position: Position;
  suit: string;
  rank: string;
}

const PLAY_ORDER: Position[] = ["N", "E", "S", "W"];

function nextPosition(pos: Position): Position {
  const idx = PLAY_ORDER.indexOf(pos);
  return PLAY_ORDER[(idx + 1) % 4];
}

function getTrickWinner(trick: PlayedCard[]): Position {
  if (trick.length === 0) return "N";
  const ledSuit = trick[0].suit;
  const rankOrder: Record<string, number> = { A: 12, K: 11, Q: 10, J: 9, "10": 8, "9": 7, "8": 6, "7": 5, "6": 4, "5": 3, "4": 2, "3": 1, "2": 0 };
  let best = trick[0];
  for (const c of trick) {
    if (c.suit === ledSuit && rankOrder[c.rank] > rankOrder[best.rank]) best = c;
  }
  return best.position;
}

const SUIT_ICONS: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLORS: Record<string, string> = { S: "black", H: "red", D: "red", C: "black" };

const CLOCKWISE: Position[] = ["N", "E", "S", "W"];

function generateRemainingPBN(board: Board, playedCards: PlayedCard[], leader?: Position): string {
  const positions: Position[] = leader ? CLOCKWISE : ["N", "S", "E", "W"];
  const startIdx = leader ? CLOCKWISE.indexOf(leader) : 0;
  const playedMap: Record<string, Set<string>> = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
  for (const pc of playedCards) playedMap[pc.position].add(pc.suit + pc.rank);
  const handByPos: Record<string, Hand> = { N: board.Nhand, S: board.Shand, E: board.Ehand, W: board.Whand };

  const handStrs: string[] = [];
  for (let i = 0; i < 4; i++) {
    const pos = positions[(startIdx + i) % 4];
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

function runDDS(pbn: string): (string | number)[][] {
  const res = (window as any).calcDDTable(pbn);
  const t: (string | number)[][] = [[], [], [], []];
  const denoms = ["N", "S", "H", "D", "C"];
  const declarers: Position[] = ["N", "S", "E", "W"];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      const d = res[denoms[c]];
      if (d == null) {
        if (DBG) console.warn('[DDS] runDDS: missing denom', denoms[c], 'in res, pbn:', pbn);
        throw new Error('DDS result missing ' + denoms[c]);
      }
      t[r][c] = d[declarers[r]];
    }
  return t;
}

function getBestSideTricks(table: (string | number)[][], side: "NS" | "EW"): number {
  if (side === "NS") {
    const rows = [0, 1];
    let best = 0;
    for (const r of rows)
      for (let c = 0; c < 5; c++)
        best = Math.max(best, table[r][c] as number);
    return best;
  }
  const rows = [2, 3];
  let best = 0;
  for (const r of rows)
    for (let c = 0; c < 5; c++)
      best = Math.max(best, table[r][c] as number);
  return best;
}

const DBG = true;

export default function MyPlayBoard() {
  const [board, setBoard] = useState(() => {
    const b = new Board(Math.floor(Math.random() * 16));
    b.deal([new Hand(), new Hand(), new Hand(), new Hand()]);
    return b;
  });
  const [playedCards, setPlayedCards] = useState<PlayedCard[]>([]);
  const [currentTrick, setCurrentTrick] = useState<PlayedCard[]>([]);
  const [trickNumber, setTrickNumber] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<Position>("W");
  const [ddsTable, setDdsTable] = useState<(string | number)[][] | null>(null);
  const [baselineTricks, setBaselineTricks] = useState<number | null>(null);
  const [cardTricks, setCardTricks] = useState<Record<string, number>>({});
  const [computing, setComputing] = useState(false);

  const remainingHands = useMemo(() => {
    const positions: Position[] = ["N", "S", "E", "W"];
    const origHands: Hand[] = [board.Nhand, board.Shand, board.Ehand, board.Whand];
    const playedMap: Record<string, Set<string>> = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
    for (const pc of playedCards) playedMap[pc.position].add(pc.suit + pc.rank);

    const result: Record<string, Record<string, string[]>> = {};
    positions.forEach((pos, i) => {
      const h: Record<string, string[]> = { S: [], H: [], D: [], C: [] };
      for (const s of COLORS) h[s] = origHands[i].hand[s].filter(r => !playedMap[pos].has(s + r)).sort((a, b) => Card.RANK[a] - Card.RANK[b]);
      result[pos] = h;
    });
    return result as Record<Position, Record<string, string[]>>;
  }, [board, playedCards]);

  useEffect(() => {
    const pbn = generateRemainingPBN(board, playedCards);
    const id = setTimeout(() => {
      try {
        if (typeof (window as any).calcDDTable === "function") setDdsTable(runDDS(pbn));
      } catch { }
    }, 50);
    return () => clearTimeout(id);
  }, [board, playedCards]);

  useEffect(() => {
    const cp = currentPlayer;
    if (!cp || !remainingHands[cp]) return;
    if (typeof (window as any).calcDDTable !== "function") return;

    const side = cp === "N" || cp === "S" ? "NS" : "EW";
    let cancelled = false;

    function ddsPromise(pbn: string): Promise<(string | number)[][]> {
      return new Promise((resolve, reject) => setTimeout(() => { try { resolve(runDDS(pbn)); } catch (e) { reject(e); } }, 0));
    }

    function toPBNRank(r: string) { return r === "10" ? "T" : r; }
    function fromPBNRank(r: string) { return r === "T" ? "10" : r; }

    async function compute() {
      setComputing(true);
      setCardTricks({});
      setBaselineTricks(null);
      if (DBG) console.log('[DDS] compute start', cp, side);

      await new Promise(r => setTimeout(r, 0));
      if (cancelled) return;

      let baseTable: (string | number)[][];
      try {
        const basePbn = generateRemainingPBN(board, playedCards);
        baseTable = await ddsPromise(basePbn);
        const bt = getBestSideTricks(baseTable, side);
        if (DBG) console.log('[DDS] baseline', bt);
        if (!cancelled) setBaselineTricks(bt);
      } catch (e) { if (DBG) console.warn('[DDS] baseline failed', e); setComputing(false); return; }

      await new Promise(r => setTimeout(r, 0));
      if (cancelled) return;

      const hand = remainingHands[cp];
      const tricks: Record<string, number> = {};

      const nextPlaysFn = (window as any).nextPlays;
      const leaderPbn = generateRemainingPBN(board, playedCards, cp);
      const curTrickCards = currentTrick.map(c => toPBNRank(c.rank) + c.suit);

      const denoms = ["N", "S", "H", "D", "C"];
      const declarers: Position[] = ["N", "S", "E", "W"];
      const sideRows = side === "NS" ? [0, 1] : [2, 3];

      for (const denom of denoms) {
        if (cancelled) return;

        let result: any;
        try {
          result = nextPlaysFn(leaderPbn, denom, curTrickCards);
        } catch (e) {
          if (DBG) console.warn('[DDS] nextPlays failed', denom, e);
          continue;
        }

        if (DBG) console.log('[DDS] nextPlays result', denom, result);

        if (!result || typeof result !== 'object') continue;

        const resultPlays = result.plays;
        if (Array.isArray(resultPlays)) {
          for (const play of resultPlays) {
            if (!play || typeof play !== 'object') continue;
            const suit = play.suit, rank = play.rank, val = play.score;
            if (!suit || !rank || typeof val !== 'number') continue;
            if (!COLORS.includes(suit)) continue;
            const handKey = suit + rank;
            if (hand[handKey[0] as keyof typeof hand]?.includes(handKey.slice(1))) {
              tricks[handKey] = val;
              setCardTricks({ ...tricks });
              if (DBG) console.log('[DDS] nextPlays card', handKey, val, 'denom', denom);
            }
          }
        }
        await new Promise(r => setTimeout(r, 0));
      }

      if (DBG) console.log('[DDS] done tricks', tricks);
      if (!cancelled) setComputing(false);
    }

    compute();
    return () => { cancelled = true; };
  }, [currentPlayer, playedCards, board, currentTrick]);

  const handleCardClick = useCallback((position: Position, suit: string, rank: string) => {
    if (position !== currentPlayer) return;
    const playedMap: Record<string, Set<string>> = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
    for (const pc of playedCards) playedMap[pc.position].add(pc.suit + pc.rank);
    if (playedMap[position].has(suit + rank)) return;

    const newCard: PlayedCard = { position, suit, rank };
    const newPlayedCards = [...playedCards, newCard];
    const newCurrentTrick = [...currentTrick, newCard];

    setPlayedCards(newPlayedCards);

    if (newCurrentTrick.length === 4) {
      const winner = getTrickWinner(newCurrentTrick);
      setCurrentTrick([]);
      setCurrentPlayer(winner);
      setTrickNumber(t => t + 1);
    } else {
      setCurrentTrick(newCurrentTrick);
      setCurrentPlayer(nextPosition(position));
    }
  }, [currentPlayer, playedCards, currentTrick]);

  useEffect(() => {
    setCurrentPlayer(board.dealer as Position);
  }, [board]);

  const resetBoard = useCallback(() => {
    const b = new Board(Math.floor(Math.random() * 16));
    b.deal([new Hand(), new Hand(), new Hand(), new Hand()]);
    setBoard(b);
    setPlayedCards([]);
    setCurrentTrick([]);
    setTrickNumber(0);
    setCurrentPlayer(b.dealer as Position);
    setDdsTable(null);
    setBaselineTricks(null);
    setCardTricks({});
    setComputing(false);
  }, []);

  const gameOver = trickNumber >= 13;
  const handLabels: Record<Position, string> = { N: "北 (N)", S: "南 (S)", E: "东 (E)", W: "西 (W)" };

  const renderHand = (pos: Position) => {
    const hand = remainingHands[pos];
    if (!hand) return null;
    const isCurrent = pos === currentPlayer && !gameOver;
    const totalCards = COLORS.reduce((sum, s) => sum + hand[s].length, 0);

    return (
      <div className={`hand-area ${pos.toLowerCase()} ${isCurrent ? "active" : ""}`}>
        <div className="hand-title">
          {handLabels[pos]}
          {isCurrent && baselineTricks !== null && (
            <span className="baseline-info">不动: {baselineTricks}墩</span>
          )}
        </div>
        {COLORS.map(suit => (
          hand[suit].length > 0 && (
            <div key={suit} className="suit-row">
              <span className={`suit-icon ${SUIT_COLORS[suit]}`}>{SUIT_ICONS[suit]}</span>
              <div className="cards-row">
                {hand[suit].map((rank, ci) => {
                  const tNum = isCurrent ? cardTricks[suit + rank] : undefined;
                  let diffClass = "";
                  if (tNum !== undefined && baselineTricks !== null) {
                    diffClass = tNum > baselineTricks ? "better" : tNum < baselineTricks ? "worse" : "same";
                  }
                  return (
                    <button
                      key={rank}
                      className={`card-btn ${isCurrent ? "clickable" : ""} ${SUIT_COLORS[suit]} ${diffClass}`}
                      onClick={() => handleCardClick(pos, suit, rank)}
                      disabled={!isCurrent}
                    >
                      <span className="card-rank">{rank}</span>
                      {tNum !== undefined && <span className="card-tricks">{tNum}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ))}
        {totalCards === 0 && <div className="empty-hand">—</div>}
      </div>
    );
  };

  const renderTrickCard = (pos: Position) => {
    const card = currentTrick.find(c => c.position === pos);
    if (!card) return <div className={`trick-slot ${pos.toLowerCase()}`}></div>;
    return (
      <div className={`trick-card ${SUIT_COLORS[card.suit]}`}>
        {SUIT_ICONS[card.suit]}{card.rank}
      </div>
    );
  };

  const tricksLeft = 13 - trickNumber - (currentTrick.length > 0 ? 1 : 0);

  return (
    <div className="my-playboard">
      <div className="board-header">
        <span>第 {board.boardnum} 副牌 | 有局: {board.vul} | 发牌: {board.dealer}</span>
        {!gameOver && <span className="current-turn">当前出牌: {handLabels[currentPlayer]}</span>}
        <button className="new-board-btn" onClick={resetBoard}>发新牌</button>
      </div>

      <div className="playboard-body">
        <div className="bridge-table">
          <div className="hand-n">{renderHand("N")}</div>
          <div className="hand-w">{renderHand("W")}</div>
          <div className="trick-area">
            <div className="trick-grid">
              <div className="trick-n">{renderTrickCard("N")}</div>
              <div className="trick-w">{renderTrickCard("W")}</div>
              <div className="trick-center">
                {gameOver ? (
                  <span className="trick-label">打牌结束</span>
                ) : (
                  <span className="trick-label">第 {trickNumber + 1} 墩</span>
                )}
              </div>
              <div className="trick-e">{renderTrickCard("E")}</div>
              <div className="trick-s">{renderTrickCard("S")}</div>
            </div>
          </div>
          <div className="hand-e">{renderHand("E")}</div>
          <div className="hand-s">{renderHand("S")}</div>
        </div>

        <div className="dds-corner">
          <div className="dds-box">
            <div className="dds-title">全方面四明手</div>
            {ddsTable ? <ShowTricks ddtricks={ddsTable} /> : <span className="dds-hint">计算中...</span>}
            {trickNumber > 0 && <div className="dds-subtitle">还剩 {tricksLeft} 墩</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
