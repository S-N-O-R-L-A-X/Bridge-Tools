import React, { useContext, useEffect, useState } from "react";
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
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const context = useContext(ShowResultsContext);
  const { all_boards } = context;

  useEffect(() => {
    if (all_boards.length === 0) return;

    let cancelled = false;

    async function countTricks() {
      let tmp: number[][] = new Array(4).fill(0).map(() => new Array(5).fill(0));
      const total = all_boards.length;

      for (let i = 0; i < all_boards.length; i++) {
        if (cancelled) return;

        const board = all_boards[i];
        if (!board.ddsTricks) {
          board.ddsTricks = await analyzeOffline(board);
        }
        tmp = MatrixAdd(tmp, board.ddsTricks);

        // Update progress
        setProgress({ current: i + 1, total });
      }

      if (!cancelled) {
        setTable(MatrixDivide(tmp, all_boards.length));
        setProgress(null);
      }
    }

    setProgress({ current: 0, total: all_boards.length });
    countTricks();

    return () => {
      cancelled = true;
    };
  }, [all_boards]);

  return (
    <fieldset className="showStatistics">
      <legend>
        The average tricks:
        {progress && (
          <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#666' }}>
            (计算中... {progress.current}/{progress.total})
          </span>
        )}
      </legend>
      <ShowTricks ddtricks={table} />
    </fieldset>
  )
}

export default Analysis;