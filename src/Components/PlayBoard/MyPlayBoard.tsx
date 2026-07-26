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

function generateRemainingPBN(board: Board, playedCards: PlayedCard[]): string {
  const positions: Position[] = ["N", "S", "E", "W"];
  const origHands: Hand[] = [board.Nhand, board.Shand, board.Ehand, board.Whand];
  const playedMap: Record<string, Set<string>> = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
  for (const pc of playedCards) playedMap[pc.position].add(pc.suit + pc.rank);

  const handStrs = positions.map((pos, i) => {
    const hand = origHands[i];
    const bySuit = COLORS.map(s => {
      return hand.hand[s]
        .filter(r => !playedMap[pos].has(s + r))
        .sort((a, b) => Card.RANK[a] - Card.RANK[b])
        .join("")
        .replace(/10/g, "T");
    });
    return bySuit.join(".");
  });

  return `N:${handStrs[0]} ${handStrs[2]} ${handStrs[1]} ${handStrs[3]}`;
}

declare const calcDDTable: (pbn: string) => any;

function runDDS(pbn: string): (string | number)[][] {
  const res = calcDDTable(pbn);
  const t: (string | number)[][] = [[], [], [], []];
  const denoms = ["N", "S", "H", "D", "C"];
  const declarers: Position[] = ["N", "S", "E", "W"];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++)
      t[r][c] = res[denoms[c]][declarers[r]];
  return t;
}

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
  const [ddsLoading, setDdsLoading] = useState(false);
  const [previewCard, setPreviewCard] = useState<{ suit: string; rank: string } | null>(null);
  const [previewDDS, setPreviewDDS] = useState<(string | number)[][] | null>(null);

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
    if (playedCards.length === 0) {
      setDdsTable(null);
      return;
    }
    setDdsLoading(true);
    const id = setTimeout(() => {
      try {
        const pbn = generateRemainingPBN(board, playedCards);
        if (typeof calcDDTable === "function") setDdsTable(runDDS(pbn));
      } catch { }
      setDdsLoading(false);
    }, 50);
    return () => clearTimeout(id);
  }, [board, playedCards]);

  useEffect(() => {
    if (!previewCard) { setPreviewDDS(null); return; }
    const id = setTimeout(() => {
      try {
        const previewCards = [...playedCards, { position: currentPlayer, suit: previewCard.suit, rank: previewCard.rank }];
        const pbn = generateRemainingPBN(board, previewCards);
        if (typeof calcDDTable === "function") setPreviewDDS(runDDS(pbn));
      } catch { }
    }, 50);
    return () => clearTimeout(id);
  }, [previewCard, playedCards, board, currentPlayer]);

  const handleCardClick = useCallback((position: Position, suit: string, rank: string) => {
    if (position !== currentPlayer) return;
    const playedMap: Record<string, Set<string>> = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
    for (const pc of playedCards) playedMap[pc.position].add(pc.suit + pc.rank);
    if (playedMap[position].has(suit + rank)) return;

    const newCard: PlayedCard = { position, suit, rank };
    const newPlayedCards = [...playedCards, newCard];
    const newCurrentTrick = [...currentTrick, newCard];

    setPlayedCards(newPlayedCards);
    setPreviewCard(null);

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
    setPreviewCard(null);
    setPreviewDDS(null);
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
        <div className="hand-title">{handLabels[pos]}</div>
        {COLORS.map(suit => (
          hand[suit].length > 0 && (
            <div key={suit} className="suit-row">
              <span className={`suit-icon ${SUIT_COLORS[suit]}`}>{SUIT_ICONS[suit]}</span>
              <div className="cards-row">
                {hand[suit].map(rank => (
                  <button
                    key={rank}
                    className={`card-btn ${isCurrent ? "clickable" : ""} ${SUIT_COLORS[suit]}`}
                    onClick={() => handleCardClick(pos, suit, rank)}
                    onMouseEnter={() => isCurrent && setPreviewCard({ suit, rank })}
                    onMouseLeave={() => setPreviewCard(null)}
                    disabled={!isCurrent}
                  >
                    {rank}
                  </button>
                ))}
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

  return (
    <div className="my-playboard">
      <div className="board-header">
        <span>第 {board.boardnum} 副牌 | 有局: {board.vul} | 发牌: {board.dealer}</span>
        {!gameOver && <span className="current-turn">当前出牌: {handLabels[currentPlayer]}</span>}
        <button className="new-board-btn" onClick={resetBoard}>发新牌</button>
      </div>

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

      <div className="dds-section">
        <div className="dds-current">
          <h3>当前四明手分析</h3>
          {ddsLoading && <span className="dds-loading">计算中...</span>}
          {ddsTable ? <ShowTricks ddtricks={ddsTable} /> : <span className="dds-hint">点击牌开始打牌后显示</span>}
        </div>
        {previewCard && previewDDS && (
          <div className="dds-preview">
            <h3>如打 {SUIT_ICONS[previewCard.suit]}{previewCard.rank} 后</h3>
            <ShowTricks ddtricks={previewDDS} />
          </div>
        )}
      </div>
    </div>
  );
}
