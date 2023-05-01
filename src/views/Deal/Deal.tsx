import Hand from "./Hand";
import Board from "./Board";
import handFilter from "./HandFilter";
import { useState, ChangeEvent } from "react";
import ShowAllBoards from "../../Components/ShowAllBoards/ShowAllBoards";

import "./index.css";

function deal(boardSize: number) {
  const boards: Hand[][] = [];
  while (boardSize--) {
    while (true) {
      const players: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
      const B = new Board(Math.floor(Math.random() * 16));
      B.shuffle();
      B.deal(players);

      if (handFilter({ hand: players[0], points: [24, 37] })) {
        boards.push(players);
        break;
      }
    }
  }
  return boards;
}

export default function Deal() {
  const [board_size, setBoard_size] = useState<string>("");
  const [boards, setBoards] = useState<Hand[][]>([]);
  const [beautify, setBeautify] = useState<boolean>(false);
  function handleClick() {
    setBoards(deal(Number(board_size)))
  }

  function handleInput(e: ChangeEvent) {
    setBoard_size((e.target as HTMLInputElement).value)
  }

  function handleBeautify(e: ChangeEvent) {
    setBeautify((e.target as HTMLInputElement).checked)
  }

  return (
    <>
      <div className="deal-setting">
        <input value={board_size} onChange={handleInput}></input>
        <fieldset>
          <legend>Choose your deal's features:</legend>

          <div>
            <input type="checkbox" id="beautify" name="beautify" onChange={handleBeautify} />是否需要美化？
          </div>
        </fieldset>

        <button onClick={handleClick}>Get new boards</button>

      </div>
      <ShowAllBoards all_boards={boards} beautify={beautify} />
    </>
  )
}