import Hand from "./Hand";
import Board from "./Board";
import handFilter, { HandFilterProps } from "./HandFilter";
import { useState, ChangeEvent, useRef, createContext } from "react";
import ShowAllBoards from "../../Components/ShowAllBoards/ShowAllBoards";
import HandSetting from "../../Components/HandSetting/HandSetting";

import "./index.css";
import Card from "./Card";
import { idx2card } from "../../Utils/utils";

interface DealContextProps {
  known_cards: number[];
  changeKnown_cards: Function;
}

export const DealContext = createContext<DealContextProps>({ known_cards: new Array(52).fill(0), changeKnown_cards: () => {} });

function deal(boardSize: number, hand_filter: Omit<HandFilterProps, "hand">) {
  const boards: Hand[][] = [];
  while (boardSize--) {
    while (true) {
      const players: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
      const B = new Board(Math.floor(Math.random() * 16));
      const fixed_cards = hand_filter.cards;
      let known_cards = undefined;
      if (fixed_cards) {
        known_cards = { "N": fixed_cards };
      }
      B.deal(players, known_cards);
      if (handFilter({ hand: players[0], ...hand_filter })) {
        boards.push(players);
        break;
      }
    }
  }
  return boards;
}

export default function Deal() {
  const [board_size, setBoard_size] = useState<number>(1);
  const [boards, setBoards] = useState<Hand[][]>([]);
  const [beautify, setBeautify] = useState<boolean>(false);
  const [known_cards, setKnown_cards] = useState<number[]>(new Array(52).fill(0)); // all cards

  function changeKnown_cards(known_cards: number[]) {
    setKnown_cards(known_cards);
  }

  const Nref = useRef<HTMLDivElement>(null);
  const Sref = useRef<HTMLDivElement>(null);
  const Eref = useRef<HTMLDivElement>(null);
  const Wref = useRef<HTMLDivElement>(null);

  function handleClick() {
    const low = Number((Nref.current?.children[0] as HTMLInputElement).value);
    const high = Number((Nref.current?.children[1] as HTMLInputElement).value);
    const spade = Number((Nref.current?.children[2] as HTMLInputElement).value);
    const heart = Number((Nref.current?.children[3] as HTMLInputElement).value);
    const diamond = Number((Nref.current?.children[4] as HTMLInputElement).value);
    const club = Number((Nref.current?.children[5] as HTMLInputElement).value);
    const solid = (Nref.current?.children[6] as HTMLInputElement).checked;

    const cards: Card[] = [];
    known_cards.forEach((known_card, idx) => {
      if (known_card > 0) {
        cards.push(idx2card(idx));
      }
    })
    setBoards(deal(Number(board_size), { points: [low, high], shapes: [spade, heart, diamond, club], solid, cards }));
  }

  function handleSize(e: ChangeEvent) {
    setBoard_size(Number((e.target as HTMLInputElement).value));
  }

  function handleBeautify(e: ChangeEvent) {
    setBeautify((e.target as HTMLInputElement).checked);
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
          <DealContext.Provider value={{ known_cards, changeKnown_cards }}>
            <HandSetting ref={Nref} position="N" />
            <HandSetting ref={Sref} position="S" />
            <HandSetting ref={Eref} position="E" />
            <HandSetting ref={Wref} position="W" />
          </DealContext.Provider>
        </fieldset>
        <br />
        <button onClick={handleClick}>Get new boards</button>

      </div>
      <ShowAllBoards all_boards={boards} beautify={beautify} />
    </>
  )
}