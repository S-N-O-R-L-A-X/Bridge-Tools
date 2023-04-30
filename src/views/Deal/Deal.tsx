import Hand from "./Hand";
import Board from "./Board";
import { useState, ChangeEventHandler, ChangeEvent } from "react";

function deal(boardSize: number) {
  const boards: Hand[][] = [];
  while (boardSize--) {
    while (true) {
      const players: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
      const B = new Board(Math.floor(Math.random() * 16));
      B.shuffle();
      B.deal(players);
      boards.push(players);
      // if (handFilter(players[0], [24, 37]) || handFilter(players[0], [22, 23]) || handFilter(players[0], [18, 23])) {
      //   boards.push(players);
      //   break;
      // }
    }
  }
  return boards;
}

export default function Deal() {
  const [board_size, setBoard_size] = useState<string>("");
  let boards: any = [];
  function handleClick() {
    boards = deal(Number(board_size));
  }

  function handleChange(e: ChangeEvent) {
    setBoard_size((e.target as HTMLInputElement).value)
  }

  return (
    <>
      <input value={board_size} onChange={handleChange}></input>
      <button onClick={handleClick}>Get new boards</button>
      {boards.length > 0 &&
        <div>
          {boards}
        </div>
      }

    </>
  )
}