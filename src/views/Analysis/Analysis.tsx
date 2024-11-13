import React, { useContext, useMemo, useState } from "react";
import ShowTricks from "../../Components/PlayBoard/ShowTricks";
import { analyzeOffline } from "../../Utils/utils";
import { ShowResultsContext } from "../Show/ShowResults";
import "./analysis.css"

function MatrixAdd(a: number[][], b: (string | number)[][]) {
  const ret: number[][] = [];
  for (let i = 0; i < a.length; ++i) {
    ret[i] = [];
    for (let j = 0; j < a[0].length; ++j) {
      ret[i][j] = a[i][j] + Number(b[i][j]);
    }
  }
  return ret;
}

function MatrixDivide(a: number[][], b: number) {
  const ret: number[][] = [];
  for (let i = 0; i < a.length; ++i) {
    ret[i] = [];
    for (let j = 0; j < a[0].length; ++j) {
      ret[i][j] = a[i][j] / b;
    }
  }
  return ret;
}

function Analysis() {
  const [table, setTable] = useState(new Array(4).fill(0).map(() => new Array(5).fill(0)));
  const context = useContext(ShowResultsContext);
  const { all_boards } = context;

  let tmp: number[][] = new Array(4).fill(0).map(() => new Array(5).fill(0));
  useMemo(() => {
    async function countTricks() {
      for (const board of all_boards) {
        if (!board.ddsTricks) {
          board.ddsTricks = await analyzeOffline(board);
        }
        tmp = MatrixAdd(tmp, board.ddsTricks);
      }
      return Promise.resolve(tmp);
    }
    countTricks().then((res) => {
      if (all_boards.length > 0) {
        setTable(MatrixDivide(res, all_boards.length));
      }
    })

  }, [all_boards])

  return (
    <fieldset className="showStatistics">
      <legend>The average tricks:</legend>
      <ShowTricks ddtricks={table} />
    </fieldset>
  )
}

export default Analysis;