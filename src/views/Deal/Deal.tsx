import Hand from "./Hand";
import Board from "./Board";
import handFilter, { HandFilterProps } from "./HandFilter";
import { useState, ChangeEvent, useRef } from "react";
import ShowAllBoards from "../../Components/ShowAllBoards/ShowAllBoards";
import HandSetting from "../../Components/HandSetting/HandSetting";

import "./index.css";
import Card from "./Card";

function deal(boardSize: number, hand_filter: Omit<HandFilterProps, "hand">) {
  const boards: Hand[][] = [];

  while (boardSize--) {
    while (true) {
      const players: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
      const B = new Board(Math.floor(Math.random() * 16));
      B.deal(players, { "N": [new Card("S", "A")] });
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

  const Nref = useRef<HTMLDivElement>(null);
  function handleClick() {
    const low = Number((Nref.current?.children[0] as HTMLInputElement).value);
    const high = Number((Nref.current?.children[1] as HTMLInputElement).value);
    const spade = Number((Nref.current?.children[2] as HTMLInputElement).value);
    const heart = Number((Nref.current?.children[3] as HTMLInputElement).value);
    const diamond = Number((Nref.current?.children[4] as HTMLInputElement).value);
    const club = Number((Nref.current?.children[5] as HTMLInputElement).value);
    const solid = (Nref.current?.children[6] as HTMLInputElement).checked;
    setBoards(deal(Number(board_size), { points: [low, high], shapes: [spade, heart, diamond, club], solid }));
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
            {/* <input type="checkbox" id="beautify" name="beautify" onChange={handleBeautify} />请选择你需要的点力 */}
          </div>

          <HandSetting ref={Nref} />
        </fieldset>

        <button onClick={handleClick}>Get new boards</button>

      </div>
      <ShowAllBoards all_boards={boards} beautify={beautify} />
    </>
  )
}