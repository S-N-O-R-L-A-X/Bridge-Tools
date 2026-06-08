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
      
      // Process boards in batches for parallel execution
      const BATCH_SIZE = 10;
      
      for (let i = 0; i < all_boards.length; i += BATCH_SIZE) {
        if (cancelled) return;

        const batch = all_boards.slice(i, i + BATCH_SIZE);
        
        // Calculate all boards in this batch in parallel
        const promises = batch.map(async (board) => {
          if (!board.ddsTricks) {
            board.ddsTricks = await analyzeOffline(board);
          }
          return board.ddsTricks;
        });
        
        const results = await Promise.all(promises);
        
        // Add results to tmp
        for (const result of results) {
          tmp = MatrixAdd(tmp, result);
        }

        // Update progress
        const completed = Math.min(i + BATCH_SIZE, all_boards.length);
        setProgress({ current: completed, total });
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