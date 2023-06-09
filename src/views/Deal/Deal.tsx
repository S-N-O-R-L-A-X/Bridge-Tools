import Hand from "./Hand";
import Board from "./Board";
import handFilter, { OneFilterProps, OneHandFilterProps } from "./HandFilter";
import { useState, ChangeEvent, useRef, createContext, useCallback } from "react";
import ShowAllBoards from "../../Components/ShowAllBoards/ShowAllBoards";
import HandSetting from "../../Components/HandSetting/HandSetting";

import "./index.css";
import Card from "./Card";
import { idx2card } from "../../Utils/utils";
import { Position, PROGRAM_POSITIONS } from "../../Utils/maps";

interface DealContextProps {
  known_cards: number[];
  changeKnown_cards: Function;
}

export const DealContext = createContext<DealContextProps>({ known_cards: new Array(52).fill(-1), changeKnown_cards: () => {} });

function deal(boardSize: number, hand_filter: Record<string, OneFilterProps>) {
  console.log(hand_filter)
  const boards: Hand[][] = [];
  while (boardSize--) {
    while (true) {
      const players: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
      const B = new Board(Math.floor(Math.random() * 16));
      const { N, S, E, W } = hand_filter;
      if (hand_filter["N"]) {
        B.deal(players, { "N": N.cards! });
        if (handFilter({ "N": { hand: players[0], ...hand_filter["N"] } })) {
          boards.push(players);
          break;
        }
      }
      else if (hand_filter["S"]) {
        B.deal(players, { "S": S.cards! });
        if (handFilter({ "S": { hand: players[1], ...hand_filter["S"] } })) {
          boards.push(players);
          break;
        }
      }
      else if (hand_filter["E"]) {
        B.deal(players, { "E": E.cards! });
        if (handFilter({ "E": { hand: players[2], ...hand_filter["E"] } })) {
          boards.push(players);
          break;
        }
      }
      else {
        B.deal(players, { "W": W.cards! });
        if (handFilter({ "W": { hand: players[3], ...hand_filter["W"] } })) {
          boards.push(players);
          break;
        }
      }

    }
  }
  return boards;
}

export default function Deal() {
  const [board_size, setBoard_size] = useState<number>(1);
  const [boards, setBoards] = useState<Hand[][]>([]);
  const [beautify, setBeautify] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>("N");
  const [known_cards, setKnown_cards] = useState<number[]>(new Array(52).fill(-1)); // all cards
  const [filter, setFilter] = useState<OneFilterProps>();

  function changeKnown_cards(known_cards: number[]) {
    setKnown_cards(known_cards);
  }

  const Nref = useRef<HTMLDivElement>(null);

  const getData = useCallback((position: Position, setting: OneFilterProps) => {
    setFilter(setting);
  }, [])

  function handleClick() {
    const cards: Card[] = [];
    known_cards.forEach((known_card, idx) => {
      if (known_card > 0) {
        cards.push(idx2card(idx));
      }
    })
    const hand_filter: Record<string, OneFilterProps> = {};
    hand_filter[position! as string] = { ...filter, cards };
    setBoards(deal(Number(board_size), hand_filter));
  }

  function handleSize(e: ChangeEvent) {
    setBoard_size(Number((e.target as HTMLInputElement).value));
  }

  function handleBeautify(e: ChangeEvent) {
    setBeautify((e.target as HTMLInputElement).checked);
  }

  function handlePositionChange(e: any) {
    setPosition(e.target.value);
  }

  return (
    <>
      <div className="deal-setting">
        请输入你需要的牌数<input value={board_size} onChange={handleSize} placeholder="请输入你需要的牌数"></input>
        <fieldset>
          <legend>Choose your deal's features:</legend>

          <div>
            <input type="checkbox" id="beautify" name="beautify" onChange={handleBeautify} />是否需要美化？
          </div>
          请选择你需要设置的位置：
          <DealContext.Provider value={{ known_cards, changeKnown_cards }}>
            <div className="position-choice" onChange={handlePositionChange}>
              {PROGRAM_POSITIONS.map((pos) => (
                <>
                  <input type="radio" name="position" id={pos} value={pos} defaultChecked={pos === "N"} />
                  <label htmlFor={pos}>{pos}</label>
                </>
              ))}
            </div>
            <HandSetting ref={Nref} position={position} getData={getData} />
          </DealContext.Provider>
        </fieldset>
        <br />
        <button onClick={handleClick}>Get new boards</button>

      </div>
      <ShowAllBoards all_boards={boards} beautify={beautify} />
    </>
  )
}