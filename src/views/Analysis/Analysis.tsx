import { useContext, useEffect, useState } from "react";
import ShowTricks from "../../Components/PlayBoard/ShowTricks";
import { analyzeOffline } from "../../Utils/utils";
import { CompleteBoard, ShowResultsContext } from "../Show/ShowResults";

function MatrixAdd(a: number[][], b: (string | number)[][]) {
  for (let i = 0; i < a.length; ++i) {
    for (let j = 0; j < a[0].length; ++j) {
      a[i][j] += Number(b[i][j]);
    }
  }
  return a.slice();
}

function MatrixDivide(a: number[][], b: number) {
  for (let i = 0; i < a.length; ++i) {
    for (let j = 0; j < a[0].length; ++j) {
      a[i][j] /= b;
    }
  }
  return a.slice();
}

export default function Analysis() {
  const [table, setTable] = useState(new Array(4).fill(0).map(() => new Array(5).fill(0)));
  const context = useContext(ShowResultsContext);
  const { all_boards } = context;
  useEffect(() => {
    async function countTricks() {
      for (const board of all_boards) {
        if (!board.ddtricks) {
          board.ddtricks = await analyzeOffline(board.board);
        }
        MatrixAdd(table, board.ddtricks as (string | number)[][]);
      }
      return Promise.resolve();
    }
    countTricks().then(()=>{
      if (all_boards.length > 0) {
        setTable(MatrixDivide(table, all_boards.length));
      }
    })
  }, [all_boards.length])

  return (
    <>
      The average tricks:
      <ShowTricks ddtricks={table} />
    </>
  )
}

