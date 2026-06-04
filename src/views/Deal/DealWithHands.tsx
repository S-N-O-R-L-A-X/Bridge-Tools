import { useState, ChangeEvent, useRef, useCallback, useMemo } from "react";

// import models
import Board from "../../models/Board";
import Hand from "../../models/Hand";
import { OneFilterProps } from "../../models/HandFilter";
import Card from "../../models/Card";

// import utils
import { idx2card } from "../../Utils/utils";
import { ColorsShort, Position, PROGRAM_POSITIONS } from "../../Utils/maps";

// import other components
import HandSetting from "../../Components/HandSetting/HandSetting";
import { DealContext } from "./DealContext";
import ShowResults from "../Show/ShowResults";

// import css
import "./index.css";
import Probability from "../../Components/Probability/Probability";

// Import worker
import DealWorker from "../../workers/deal.worker?worker";

// Types for worker data (must match worker's serialized types)
interface CardData {
  suit: ColorsShort;
  rank: string;
}

interface HandData {
  cards: CardData[];
  hand: { [key: string]: string[] };
  points: number;
  shape: { [key: string]: number };
}

interface BoardData {
  boardnum: number;
  vul: string;
  dealer: string;
  Nhand: HandData;
  Shand: HandData;
  Ehand: HandData;
  Whand: HandData;
}

// Convert worker BoardData to Board class instance
function convertToBoard(data: BoardData): Board {
  const board = new Board(data.boardnum);

  const convertHand = (handData: HandData): Hand => {
    const hand = new Hand();
    handData.cards.forEach(cardData => {
      const card = new Card(cardData.suit, cardData.rank);
      hand.add(card);
    });
    hand.sortHand();
    return hand;
  };

  board.Nhand = convertHand(data.Nhand);
  board.Shand = convertHand(data.Shand);
  board.Ehand = convertHand(data.Ehand);
  board.Whand = convertHand(data.Whand);

  return board;
}

export default function DealWithHands() {
  const [board_size, setBoard_size] = useState<number>(1);
  const [boards, setBoards] = useState<Board[]>([]);
  const [beautify, setBeautify] = useState<boolean>(false);
  const [DDS, setDDS] = useState<boolean>(false);
  const [probability, setProbability] = useState<boolean>(false);
  const [known_cards, setKnown_cards] = useState<number[]>(new Array(52).fill(-1)); // all cards
  const [allFilters, setAllFilters] = useState<Record<string, OneFilterProps>>({});
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  function changeKnown_cards(known_cards: number[]) {
    setKnown_cards(known_cards);
  }

  const Nref = useRef<HTMLDivElement>(null);
  const Sref = useRef<HTMLDivElement>(null);
  const Eref = useRef<HTMLDivElement>(null);
  const Wref = useRef<HTMLDivElement>(null);

  const getData = useCallback((position: Position, setting: OneFilterProps) => {
    const tmp = allFilters;
    tmp[position] = setting;
    setAllFilters(tmp);
  }, [])

  function handleClick() {
    const all_known_cards: Card[][] = new Array(4).fill(0).map(() => new Array()); // all_known_cards[position]=cards
    known_cards.forEach((known_card, idx) => {
      if (known_card > -1) {
        all_known_cards[known_card].push(idx2card(idx));
      }
    })

    // Build filters with known cards
    const filters = { ...allFilters };
    all_known_cards.forEach((cards, idx) => {
      if (cards.length > 0) {
        filters[PROGRAM_POSITIONS[idx]] = { ...filters[PROGRAM_POSITIONS[idx]], cards };
      }
    });

    // Start worker
    setIsDealing(true);
    setProgress({ current: 0, total: board_size });
    setBoards([]);

    const worker = new DealWorker();

    worker.onmessage = (e) => {
      const { type, boards: workerBoards, current, total, message } = e.data;

      if (type === 'progress') {
        setProgress({ current, total });
      } else if (type === 'complete') {
        const convertedBoards = workerBoards.map(convertToBoard);
        setBoards(convertedBoards);
        setIsDealing(false);
        setProgress(null);
        worker.terminate();
      } else if (type === 'error') {
        console.error('Deal worker error:', message);
        setIsDealing(false);
        setProgress(null);
        worker.terminate();
        alert(message);
      }
    };

    worker.onerror = (err) => {
      console.error('Worker error:', err);
      setIsDealing(false);
      setProgress(null);
      worker.terminate();
    };

    worker.postMessage({ boardSize: board_size, filters });
  }

  function handleSize(e: ChangeEvent) {
    setBoard_size(Number((e.target as HTMLInputElement).value));
  }

  function handleBeautify(e: ChangeEvent) {
    setBeautify((e.target as HTMLInputElement).checked);
  }

  function handleDDS(e: ChangeEvent) {
    setDDS((e.target as HTMLInputElement).checked);
  }

  function handleProbability(e: ChangeEvent) {
    setProbability((e.target as HTMLInputElement).checked);
  }

  return (
    <>
      <div className="deal-setting">
        请输入你需要的牌数<input value={board_size} onChange={handleSize} placeholder="请输入你需要的牌数"></input>
        <fieldset>
          <legend>Choose your deal's features:</legend>

          <div>
            <input type="checkbox" id="beautify" name="beautify" onChange={handleBeautify} />是否需要美化？
            <input type="checkbox" id="dds" name="dds" onChange={handleDDS} />是否需要四明手分析？（会更花费时间）
            <input type="checkbox" id="probability" name="probability" onChange={handleProbability} />是否需要概率分析？
          </div>
          <DealContext.Provider value={{ known_cards, changeKnown_cards, contextType: "multi" }}>
            <HandSetting ref={Nref} position="N" getData={getData} />
            <HandSetting ref={Sref} position="S" getData={getData} />
            <HandSetting ref={Eref} position="E" getData={getData} />
            <HandSetting ref={Wref} position="W" getData={getData} />
          </DealContext.Provider>
        </fieldset>
        <br />
        <button onClick={handleClick} disabled={isDealing}>
          {isDealing ? `发牌中... (${progress?.current || 0}/${progress?.total || 0})` : 'Get new boards'}
        </button>

      </div>
      {
        useMemo(
          () => probability && <Probability boards={boards} />,
          [probability, boards]
        )
      }

      {useMemo(
        () => <ShowResults all_boards={boards} beautify={beautify} dds={DDS} />,
        [DDS, beautify, boards]
      )}
    </>
  )
}
