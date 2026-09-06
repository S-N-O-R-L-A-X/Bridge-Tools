import { useState, useMemo, useCallback, useEffect } from "react";
import Board from "../../models/Board";
import Hand from "../../models/Hand";
import Card from "../../models/Card";
import { Position, COLORS, ColorsShort, TRUMP } from "../../Utils/maps";
import ShowTricks from "./ShowTricks";
import "./MyPlayBoard.css";

interface PlayedCard {
  position: Position;
  suit: string;
  rank: string;
}

interface Contract {
  level: number;
  strain: TRUMP;
  declarer: Position;
}

const PLAY_ORDER: Position[] = ["N", "E", "S", "W"];
const SUIT_ICONS: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLORS: Record<string, string> = { S: "black", H: "red", D: "red", C: "black" };
const SUIT_NAMES: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣", NT: "NT" };
const STRAIN_ORDER: TRUMP[] = ["C", "D", "H", "S", "NT"];
const RANK_ORDER: Record<string, number> = { A: 12, K: 11, Q: 10, J: 9, "10": 8, "9": 7, "8": 6, "7": 5, "6": 4, "5": 3, "4": 2, "3": 1, "2": 0 };

function nextPosition(pos: Position): Position {
  const idx = PLAY_ORDER.indexOf(pos);
  return PLAY_ORDER[(idx + 1) % 4];
}

function getTrickWinner(trick: PlayedCard[], trump: TRUMP): Position {
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

function mustFollowSuit(hand: Record<string, string[]>, trick: PlayedCard[], trump: TRUMP): Record<string, boolean> {
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
    const trumpStr = trump !== "NT" ? trump : null;
    const hasTrump = trumpStr && hand[trumpStr] && hand[trumpStr].length > 0;
    if (hasTrump && trumpStr) {
      for (const s of COLORS) result[s] = s === trumpStr;
    } else {
      for (const s of COLORS) result[s] = hand[s].length > 0;
    }
  }
  return result;
}

function getContractTricks(level: number): number {
  return level + 6;
}

function formatContract(contract: Contract): string {
  const strainStr = contract.strain === "NT" ? "NT" : SUIT_NAMES[contract.strain];
  return `${contract.level}${strainStr} ${contract.declarer}`;
}

function calcHCP(hand: Hand): number {
  return hand.points;
}

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
      if (d == null) throw new Error('DDS result missing ' + denoms[c]);
      t[r][c] = d[declarers[r]];
    }
  return t;
}

export default function MyPlayBoard() {
  const [board, setBoard] = useState(() => {
    const b = new Board(Math.floor(Math.random() * 16));
    b.deal([new Hand(), new Hand(), new Hand(), new Hand()]);
    return b;
  });

  const [contract, setContract] = useState<Contract | null>(null);
  const [playedCards, setPlayedCards] = useState<PlayedCard[]>([]);
  const [currentTrick, setCurrentTrick] = useState<PlayedCard[]>([]);
  const [trickNumber, setTrickNumber] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<Position>("W");
  const [nsTricks, setNsTricks] = useState(0);
  const [ewTricks, setEwTricks] = useState(0);
  const [ddsTable, setDdsTable] = useState<(string | number)[][] | null>(null);
  const [baselineTricks, setBaselineTricks] = useState<number | null>(null);
  const [cardTricks, setCardTricks] = useState<Record<string, number>>({});
  const [computing, setComputing] = useState(false);

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedStrain, setSelectedStrain] = useState<TRUMP | null>(null);
  const [selectedDeclarer, setSelectedDeclarer] = useState<Position | null>(null);

  const contractReady = selectedLevel !== null && selectedStrain !== null && selectedDeclarer !== null;

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
    if (!contract) return;
    const pbn = generateRemainingPBN(board, playedCards);
    const id = setTimeout(() => {
      try {
        if (typeof (window as any).calcDDTable === "function") setDdsTable(runDDS(pbn));
      } catch { }
    }, 50);
    return () => clearTimeout(id);
  }, [board, playedCards, contract]);

  useEffect(() => {
    if (!contract) return;
    const cp = currentPlayer;
    if (!cp || !remainingHands[cp]) return;
    if (typeof (window as any).calcDDTable !== "function") return;

    const side = cp === "N" || cp === "S" ? "NS" : "EW";
    let cancelled = false;

    function ddsPromise(pbn: string): Promise<(string | number)[][]> {
      return new Promise((resolve, reject) => setTimeout(() => { try { resolve(runDDS(pbn)); } catch (e) { reject(e); } }, 0));
    }

    function toPBNRank(r: string) { return r === "10" ? "T" : r; }

    async function compute() {
      setComputing(true);
      setCardTricks({});
      setBaselineTricks(null);

      await new Promise(r => setTimeout(r, 0));
      if (cancelled) return;

      let baseTable: (string | number)[][];
      try {
        const basePbn = generateRemainingPBN(board, playedCards);
        baseTable = await ddsPromise(basePbn);
        const sideRows = side === "NS" ? [0, 1] : [2, 3];
        let best = 0;
        for (const r of sideRows)
          for (let c = 0; c < 5; c++)
            best = Math.max(best, baseTable[r][c] as number);
        if (!cancelled) setBaselineTricks(best);
      } catch { setComputing(false); return; }

      await new Promise(r => setTimeout(r, 0));
      if (cancelled) return;

      const hand = remainingHands[cp];
      const tricks: Record<string, number> = {};
      const nextPlaysFn = (window as any).nextPlays;
      const leaderPbn = generateRemainingPBN(board, playedCards, cp);
      const curTrickCards = currentTrick.map(c => toPBNRank(c.rank) + c.suit);

      const denoms = ["N", "S", "H", "D", "C"];

      for (const denom of denoms) {
        if (cancelled) return;
        let result: any;
        try { result = nextPlaysFn(leaderPbn, denom, curTrickCards); } catch { continue; }
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
            }
          }
        }
        await new Promise(r => setTimeout(r, 0));
      }

      if (!cancelled) setComputing(false);
    }

    compute();
    return () => { cancelled = true; };
  }, [currentPlayer, playedCards, board, currentTrick, contract]);

  const handleConfirmContract = useCallback(() => {
    if (!contractReady) return;
    const c: Contract = { level: selectedLevel!, strain: selectedStrain!, declarer: selectedDeclarer! };
    setContract(c);
    setPlayedCards([]);
    setCurrentTrick([]);
    setTrickNumber(0);
    setNsTricks(0);
    setEwTricks(0);
    setDdsTable(null);
    setBaselineTricks(null);
    setCardTricks({});
    setCurrentPlayer(c.declarer);
  }, [selectedLevel, selectedStrain, selectedDeclarer, contractReady]);

  const handleCardClick = useCallback((position: Position, suit: string, rank: string) => {
    if (!contract) return;
    if (position !== currentPlayer) return;
    const playedMap: Record<string, Set<string>> = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
    for (const pc of playedCards) playedMap[pc.position].add(pc.suit + pc.rank);
    if (playedMap[position].has(suit + rank)) return;

    const allowed = mustFollowSuit(remainingHands[position], currentTrick, contract.strain);
    if (!allowed[suit]) return;

    const newCard: PlayedCard = { position, suit, rank };
    const newPlayedCards = [...playedCards, newCard];
    const newCurrentTrick = [...currentTrick, newCard];

    setPlayedCards(newPlayedCards);

    if (newCurrentTrick.length === 4) {
      const winner = getTrickWinner(newCurrentTrick, contract.strain);
      const winnerSide = winner === "N" || winner === "S" ? "NS" : "EW";
      if (winnerSide === "NS") setNsTricks(t => t + 1);
      else setEwTricks(t => t + 1);
      setCurrentTrick([]);
      setCurrentPlayer(winner);
      setTrickNumber(t => t + 1);
    } else {
      setCurrentTrick(newCurrentTrick);
      setCurrentPlayer(nextPosition(position));
    }
  }, [currentPlayer, playedCards, currentTrick, contract, remainingHands]);

  useEffect(() => {
    if (contract) setCurrentPlayer(contract.declarer);
  }, [board]);

  const resetBoard = useCallback(() => {
    const b = new Board(Math.floor(Math.random() * 16));
    b.deal([new Hand(), new Hand(), new Hand(), new Hand()]);
    setBoard(b);
    setContract(null);
    setPlayedCards([]);
    setCurrentTrick([]);
    setTrickNumber(0);
    setNsTricks(0);
    setEwTricks(0);
    setCurrentPlayer("W");
    setDdsTable(null);
    setBaselineTricks(null);
    setCardTricks({});
    setComputing(false);
    setSelectedLevel(null);
    setSelectedStrain(null);
    setSelectedDeclarer(null);
  }, []);

  const gameOver = trickNumber >= 13;
  const handLabels: Record<Position, string> = { N: "N", S: "S", E: "E", W: "W" };

  const renderHand = (pos: Position) => {
    const hand = remainingHands[pos];
    if (!hand) return null;
    const isCurrent = pos === currentPlayer && !gameOver && contract !== null;

    return (
      <div className={`bridge-seat ${isCurrent ? "bridge-seat-active" : ""}`}>
        <div className="bridge-seat-name">
          <span className="bridge-seat-direction">{handLabels[pos]}</span>
        </div>
        <div className="bridge-suit-list">
          {COLORS.map(suit => (
            hand[suit].length > 0 && (
              <div key={suit} className="bridge-suit-line">
                <span className={`bridge-suit-label ${SUIT_COLORS[suit] === "red" ? "bridge-card-red" : ""}`}>{SUIT_ICONS[suit]}</span>
                <div className="bridge-card-row">
                  {hand[suit].map((rank) => {
                    const tNum = isCurrent ? cardTricks[suit + rank] : undefined;
                    let diffClass = "";
                    if (tNum !== undefined && baselineTricks !== null) {
                      diffClass = tNum > baselineTricks ? "bridge-card-good" : tNum < baselineTricks ? "bridge-card-worse" : "";
                    }
                    const canPlay = isCurrent && contract !== null;
                    const allowed = canPlay ? mustFollowSuit(hand, currentTrick, contract!.strain) : null;
                    const isAllowed = allowed ? allowed[suit] : false;
                    return (
                      <button
                        key={rank}
                        className={`bridge-card ${SUIT_COLORS[suit] === "red" ? "bridge-card-red" : ""} ${canPlay && isAllowed ? "bridge-card-clickable" : ""} ${diffClass}`}
                        onClick={() => handleCardClick(pos, suit, rank)}
                        disabled={!canPlay || !isAllowed}
                      >
                        <span>{rank}</span>
                        {tNum !== undefined && baselineTricks !== null && (
                          <em>{tNum > baselineTricks ? `+${tNum - baselineTricks}` : tNum < baselineTricks ? `${tNum - baselineTricks}` : "="}</em>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  const renderTrickCard = (pos: Position) => {
    const card = currentTrick.find(c => c.position === pos);
    if (!card) return <div className="played-card-placeholder trick-card-slot"></div>;
    return (
      <div className={`trick-card-played ${SUIT_COLORS[card.suit] === "red" ? "bridge-card-red" : ""}`}>
        {SUIT_ICONS[card.suit]}{card.rank}
      </div>
    );
  };

  return (
    <div className="my-playboard">
      <div className="result-layout">
        <section className="bridge-table">
          <div className="vul-board">
            <svg className="vul-board-svg" viewBox="0 0 224 132">
              <rect x="2" y="2" width="220" height="128" fill="#fff" stroke="#050505" strokeWidth="4" />
              <polygon fill="#fff" points="4,4 220,4 162,48 62,48" />
              <polygon fill="#fff" points="220,4 220,128 162,84 162,48" />
              <polygon fill="#fff" points="4,128 220,128 162,84 62,84" />
              <polygon fill="#fff" points="4,4 62,48 62,84 4,128" />
              <line x1="4" y1="4" x2="62" y2="48" stroke="#050505" strokeWidth="4" />
              <line x1="220" y1="4" x2="162" y2="48" stroke="#050505" strokeWidth="4" />
              <line x1="4" y1="128" x2="62" y2="84" stroke="#050505" strokeWidth="4" />
              <line x1="220" y1="128" x2="162" y2="84" stroke="#050505" strokeWidth="4" />
              <text x="112" y="26" fill="#111" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="900">
                {board.vul === "NS" ? "N" : board.vul === "EW" ? "E" : board.vul === "Both" ? "B" : "D"}
              </text>
            </svg>
            <button className="board-number" onClick={resetBoard}>第 {board.boardnum} 副</button>
          </div>

          <div className="seat seat-north">{renderHand("N")}</div>
          <div className="seat seat-west">{renderHand("W")}</div>

          <div className="trick-center">
            <div className="trick-grid">
              <div className="trick-card-slot trick-card-north">{renderTrickCard("N")}</div>
              <div className="trick-card-slot trick-card-west">{renderTrickCard("W")}</div>
              <div className="trick-card-slot trick-card-east">{renderTrickCard("E")}</div>
              <div className="trick-card-slot trick-card-south">{renderTrickCard("S")}</div>
            </div>
          </div>

          <div className="seat seat-east">{renderHand("E")}</div>
          <div className="seat seat-south">{renderHand("S")}</div>

          {contract && (
            <div className="table-status table-status-bottom">
              <span>{formatContract(contract)} | {getContractTricks(contract.level)} 墩</span>
              <span>NS:{nsTricks} EW:{ewTricks}/{trickNumber}</span>
            </div>
          )}
        </section>

        <section className="contract-panel">
          <h4 className="contract-panel-title">定约选择</h4>

          <div className="contract-level-grid">
            {[1, 2, 3, 4, 5, 6, 7].map(level => (
              <button
                key={level}
                className={`analysis-choice ${selectedLevel === level ? "analysis-choice-active" : ""}`}
                onClick={() => setSelectedLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="contract-strain-grid">
            <button
              className={`analysis-choice ${selectedStrain === "C" ? "analysis-choice-active" : ""}`}
              onClick={() => setSelectedStrain("C")}
            >
              ♣
            </button>
            <button
              className={`analysis-choice analysis-choice-red ${selectedStrain === "D" ? "analysis-choice-active" : ""}`}
              onClick={() => setSelectedStrain("D")}
            >
              ♦
            </button>
            <button
              className={`analysis-choice analysis-choice-red ${selectedStrain === "H" ? "analysis-choice-active" : ""}`}
              onClick={() => setSelectedStrain("H")}
            >
              ♥
            </button>
            <button
              className={`analysis-choice ${selectedStrain === "S" ? "analysis-choice-active" : ""}`}
              onClick={() => setSelectedStrain("S")}
            >
              ♠
            </button>
            <button
              className={`analysis-choice ${selectedStrain === "NT" ? "analysis-choice-active" : ""}`}
              onClick={() => setSelectedStrain("NT")}
            >
              NT
            </button>
          </div>

          <div className="contract-declarer-grid">
            {(["N", "E", "S", "W"] as Position[]).map(pos => (
              <button
                key={pos}
                className={`analysis-choice ${selectedDeclarer === pos ? "analysis-choice-active" : ""}`}
                onClick={() => setSelectedDeclarer(pos)}
              >
                {pos}
              </button>
            ))}
          </div>

          <button
            className="confirm-contract-btn"
            onClick={handleConfirmContract}
            disabled={!contractReady || contract !== null}
          >
            {contract ? `已确认: ${formatContract(contract)}` : "确认定约"}
          </button>

          {contract && (
            <button className="reset-btn" onClick={resetBoard}>
              重新发牌
            </button>
          )}
        </section>

        <aside className="result-info-panel">
          <div className="info-box">
            <h4 className="info-box-title">四明手分析</h4>
            {ddsTable ? <ShowTricks ddtricks={ddsTable} /> : <span className="dds-hint">计算中...</span>}
            {trickNumber > 0 && <div className="dds-subtitle">还剩 {13 - trickNumber} 墩</div>}
          </div>

          <div className="info-box">
            <h4 className="info-box-title">大牌点</h4>
            <table className="hcp-table">
              <tbody>
                <tr>
                  <td></td>
                  <td>{calcHCP(board.Nhand)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td>{calcHCP(board.Whand)}</td>
                  <td></td>
                  <td>{calcHCP(board.Ehand)}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>{calcHCP(board.Shand)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {contract && (
            <div className="info-box">
              <h4 className="info-box-title">当前定约</h4>
              <div className="contract-display">
                <span className="contract-level">{contract.level}</span>
                <span className={`contract-strain ${contract.strain === "H" || contract.strain === "D" ? "bridge-card-red" : ""}`}>
                  {SUIT_NAMES[contract.strain]}
                </span>
                <span className="contract-declarer">{contract.declarer}</span>
              </div>
              <div className="contract-target">
                需要 {getContractTricks(contract.level)} 墩 | 已得 {nsTricks} 墩
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
