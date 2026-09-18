import { useState, useMemo, useCallback, useEffect } from "react";
import Board from "../../models/Board";
import Hand from "../../models/Hand";
import Card from "../../models/Card";
import { Position, COLORS, TRUMP } from "../../Utils/maps";
import { PlayedCard, Contract, PlaySnapshot, nextPosition, getTrickWinner, mustFollowSuit, generateRemainingPBN, runDDS } from "../../Utils/bridgePlay";

type HandBySuit = Record<string, string[]>;
type RemainingHands = Record<Position, HandBySuit>;

const POSITIONS: Position[] = ["N", "S", "E", "W"];

export default function usePlayGame(board: Board) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [playedCards, setPlayedCards] = useState<PlayedCard[]>([]);
  const [currentTrick, setCurrentTrick] = useState<PlayedCard[]>([]);
  const [trickNumber, setTrickNumber] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<Position>("W");
  const [nsTricks, setNsTricks] = useState(0);
  const [ewTricks, setEwTricks] = useState(0);
  const [ddsTable, setDdsTable] = useState<(string | number)[][] | null>(null);
  const [cardTricks, setCardTricks] = useState<Record<string, number>>({});
  const [computing, setComputing] = useState(false);
  const [undoStack, setUndoStack] = useState<PlaySnapshot[]>([]);

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedStrain, setSelectedStrain] = useState<TRUMP | null>(null);
  const [selectedDeclarer, setSelectedDeclarer] = useState<Position | null>(null);
  const [showTrickStatus, setShowTrickStatus] = useState(false);

  const contractReady = selectedLevel !== null && selectedStrain !== null && selectedDeclarer !== null;

  const clearPlayState = useCallback(() => {
    setContract(null);
    setPlayedCards([]);
    setCurrentTrick([]);
    setTrickNumber(0);
    setNsTricks(0);
    setEwTricks(0);
    setDdsTable(null);
    setCardTricks({});
    setUndoStack([]);
    setComputing(false);
    setCurrentPlayer("W");
    setSelectedLevel(null);
    setSelectedStrain(null);
    setSelectedDeclarer(null);
  }, []);

  useEffect(() => {
    clearPlayState();
  }, [board, clearPlayState]);

  const resetBoard = clearPlayState;

  const remainingHands = useMemo<RemainingHands>(() => {
    const origHands: Hand[] = [board.Nhand, board.Shand, board.Ehand, board.Whand];
    const playedMap: Record<string, Set<string>> = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
    for (const pc of playedCards) playedMap[pc.position].add(pc.suit + pc.rank);

    const result: Record<string, HandBySuit> = {};
    POSITIONS.forEach((pos, i) => {
      const h: HandBySuit = { S: [], H: [], D: [], C: [] };
      for (const s of COLORS) h[s] = origHands[i].hand[s].filter(r => !playedMap[pos].has(s + r)).sort((a, b) => Card.RANK[a] - Card.RANK[b]);
      result[pos] = h;
    });
    return result as RemainingHands;
  }, [board, playedCards]);

  const origHands = useMemo(() => {
    const sortRanks = (ranks: string[]) => [...ranks].sort((a, b) => Card.RANK[a] - Card.RANK[b]);
    const sortHand = (h: Hand): HandBySuit => {
      const copy: HandBySuit = { S: [], H: [], D: [], C: [] };
      for (const s of COLORS) copy[s] = sortRanks(h.hand[s]);
      return copy;
    };
    return {
      N: sortHand(board.Nhand),
      S: sortHand(board.Shand),
      E: sortHand(board.Ehand),
      W: sortHand(board.Whand),
    };
  }, [board]);

  const playedMap = useMemo(() => {
    const map: Record<string, Set<string>> = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
    for (const pc of playedCards) map[pc.position].add(pc.suit + pc.rank);
    return map;
  }, [playedCards]);

  useEffect(() => {
    if (!contract) return;
    if (!showTrickStatus) return;
    if (trickNumber >= 13) return;
    if (typeof (window as any).calcDDTable !== "function") return;

    const contractNow = contract;

    function toPBNRank(r: string) { return r === "10" ? "T" : r; }
    function fromPBNRank(r: string) { return r === "T" ? "10" : r; }

    let cancelled = false;

    function compute() {
      const tricks: Record<string, number> = {};
      const nextPlaysFn = (window as any).nextPlays;
      const leader = currentTrick.length > 0 ? currentTrick[0].position : currentPlayer;
      const completedTrickCards = playedCards.filter(c => !currentTrick.includes(c));
      const curTrickCards = currentTrick.map(c => toPBNRank(c.rank) + c.suit);
      const trump: string = contractNow.strain === "NT" ? "N" : contractNow.strain;

      const positions: Position[] = ["N", "E", "S", "W"];
      for (const pos of positions) {
        const hand = remainingHands[pos];
        if (!hand) continue;
        const handLeader = curTrickCards.length > 0 ? leader : pos;
        const handPbn = generateRemainingPBN(board, completedTrickCards, handLeader);

        let result: any;
        try { result = nextPlaysFn(handPbn, trump, curTrickCards); } catch { continue; }
        if (!result || typeof result !== 'object' || result.error || !Array.isArray(result.plays)) continue;

        const posIsNS = pos === "N" || pos === "S";

        for (const play of result.plays) {
          if (!play || typeof play !== 'object') continue;
          const suit = play.suit, rank = fromPBNRank(play.rank), val = play.score;
          if (!suit || !rank || typeof val !== 'number') continue;
          if (!COLORS.includes(suit)) continue;
          const assign = (r: string) => {
            if (hand[suit as keyof typeof hand]?.includes(r)) {
              const alreadyWon = posIsNS ? nsTricks : ewTricks;
              tricks[pos + suit + r] = val + alreadyWon;
            }
          };
          assign(rank);
          if (Array.isArray(play.equals)) {
            for (const eq of play.equals) assign(fromPBNRank(eq));
          }
        }
      }

      if (cancelled) return;
      setCardTricks(tricks);
      if (!cancelled) setComputing(false);
    }

    setComputing(true);
    setCardTricks({});

    const timer = setTimeout(() => {
      if (cancelled) return;
      compute();
    }, 120);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [currentPlayer, playedCards, board, currentTrick, contract, nsTricks, ewTricks, showTrickStatus, trickNumber]);

  const handleConfirmContract = useCallback(() => {
    if (!contractReady) return;
    const c: Contract = { level: selectedLevel!, strain: selectedStrain!, declarer: selectedDeclarer! };
    setContract(c);
    setPlayedCards([]);
    setCurrentTrick([]);
    setTrickNumber(0);
    setNsTricks(0);
    setEwTricks(0);
    setCardTricks({});
    setUndoStack([]);
    setCurrentPlayer(nextPosition(c.declarer));
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

    setUndoStack(prev => [...prev, { playedCards, currentTrick, trickNumber, currentPlayer, nsTricks, ewTricks }]);

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

  const undoPlay = useCallback(() => {
    if (undoStack.length === 0) return;
    const snap = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setPlayedCards(snap.playedCards);
    setCurrentTrick(snap.currentTrick);
    setTrickNumber(snap.trickNumber);
    setCurrentPlayer(snap.currentPlayer);
    setNsTricks(snap.nsTricks);
    setEwTricks(snap.ewTricks);
  }, [undoStack]);

  useEffect(() => {
    if (typeof (window as any).calcDDTable !== "function") return;
    const pbn = generateRemainingPBN(board, []);
    let cancelled = false;
    setTimeout(() => {
      if (cancelled) return;
      try {
        const result = runDDS(pbn);
        if (!cancelled) setDdsTable(result);
      } catch { }
    }, 50);
    return () => { cancelled = true; };
  }, [board]);

  const gameOver = trickNumber >= 13;

  return {
    contract, ddsTable, cardTricks, computing,
    currentTrick, trickNumber, currentPlayer, nsTricks, ewTricks,
    playedCards, playedMap, remainingHands, origHands,
    selectedLevel, selectedStrain, selectedDeclarer, showTrickStatus, contractReady,
    gameOver, undoLength: undoStack.length,
    setSelectedLevel, setSelectedStrain, setSelectedDeclarer, setShowTrickStatus,
    handleConfirmContract, handleCardClick, undoPlay, resetBoard,
  };
}