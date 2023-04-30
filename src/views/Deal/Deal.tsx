import Hand from "./Hand";
import Board from "./Board";
import { useState, ChangeEventHandler, ChangeEvent } from "react";
import ShowCards from "../../Components/ShowCards/ShowCards";

function deal(boardSize: number) {
  const boards: Hand[][] = [];
  while (boardSize--) {
    while (true) {
      const players: Hand[] = [new Hand(), new Hand(), new Hand(), new Hand()];
      const B = new Board(Math.floor(Math.random() * 16));
      B.shuffle();
      B.deal(players);
      boards.push(players);
      break;
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
  const [boards, setBoards] = useState<Hand[][]>([]);
  function handleClick() {
    setBoards(deal(Number(board_size)))
    console.log(boards);
  }

  function handleChange(e: ChangeEvent) {
    setBoard_size((e.target as HTMLInputElement).value)
  }

  return (
    <>
      <input value={board_size} onChange={handleChange}></input>
      <button onClick={handleClick}>Get new boards</button>
      {/* {
        <div>
          {boards.map((board: Hand[]) =>
            <div>{...board.map((hand) => hand.show())}</div>
          )}
        </div>
      } */}
      {boards.length > 0 &&
        <ShowCards all_hands={boards[0]} />
      }
    </>
  )
}