import { useState, ChangeEvent, useRef, useCallback, useMemo } from "react";

// import models
import Hand from "../../models/Hand";
import Board from "../../models/Board";
import handFilter, { OneFilterProps } from "../../models/HandFilter";
import Card from "../../models/Card";

// import utils
import { idx2card } from "../../Utils/utils";
import { Position, PROGRAM_POSITIONS } from "../../Utils/maps";

// import other components
import HandSetting from "../../Components/HandSetting/HandSetting";
import { DealContext } from "./DealContext";
import ShowResults from "../Show/ShowResults";

// import css
import "./index.css";

function deal(boardSize: number, hand_filter: Record<string, OneFilterProps>) {
  const boards: Board[] = [];
  for (let boardNum = 1; boardNum <= boardSize; ++boardNum) {
    while (true) {
      const board = new Board(boardNum);
      const players: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
      const { N, S, W, E } = hand_filter;

      let known_cards: Record<string, Card[]> | undefined = undefined;
      if (N?.cards || S?.cards || W?.cards || E?.cards) {
        known_cards = {};
      }
      if (N?.cards) {
        known_cards!["N"] = N.cards;
      }
      if (S?.cards) {
        known_cards!["S"] = S.cards;
      }
      if (E?.cards) {
        known_cards!["E"] = E.cards;
      }
      if (W?.cards) {
        known_cards!["W"] = W.cards;
      }

      const to_pass_filter = {
        "N": { hand: players[0], ...hand_filter["N"] },
        "S": { hand: players[1], ...hand_filter["S"] },
        "E": { hand: players[2], ...hand_filter["E"] },
        "W": { hand: players[3], ...hand_filter["W"] },
      }

      board.deal(players, known_cards);
      if (handFilter(to_pass_filter)) {
        boards.push(board);
        break;
      }
    }
  }
  return boards;
}

export default function DealWithHands() {
  const [board_size, setBoard_size] = useState<number>(1);
  const [boards, setBoards] = useState<Board[]>([]);
  const [beautify, setBeautify] = useState<boolean>(false);
  const [DDS, setDDS] = useState<boolean>(false);
  const [known_cards, setKnown_cards] = useState<number[]>(new Array(52).fill(-1)); // all cards
  const [allFilters, setAllFilters] = useState<Record<string, OneFilterProps>>({});

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
    all_known_cards.forEach((card, idx) => {
      if (card.length > 0) {
        allFilters[PROGRAM_POSITIONS[idx]] = { ...allFilters[PROGRAM_POSITIONS[idx]], cards: card };
        setAllFilters(allFilters);
      }
    })
    setBoards(deal(Number(board_size), allFilters));
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

  return (
    <>
      <div className="deal-setting">
        请输入你需要的牌数<input value={board_size} onChange={handleSize} placeholder="请输入你需要的牌数"></input>
        <fieldset>
          <legend>Choose your deal's features:</legend>

          <div>
            <input type="checkbox" id="beautify" name="beautify" onChange={handleBeautify} />是否需要美化？
            <input type="checkbox" id="dds" name="dds" onChange={handleDDS} />是否需要四明手分析？（会更花费时间）
          </div>
          <DealContext.Provider value={{ known_cards, changeKnown_cards, contextType: "multi" }}>
            <HandSetting ref={Nref} position="N" getData={getData} />
            <HandSetting ref={Sref} position="S" getData={getData} />
            <HandSetting ref={Eref} position="E" getData={getData} />
            <HandSetting ref={Wref} position="W" getData={getData} />
          </DealContext.Provider>
        </fieldset>
        <br />
        <button onClick={handleClick}>Get new boards</button>

      </div>
      {useMemo(
        () => <ShowResults all_boards={boards.map((b: Board) => { return { board: b } })} beautify={beautify} dds={DDS} />,
        [DDS, beautify, boards]
      )}
    </>
  )
}