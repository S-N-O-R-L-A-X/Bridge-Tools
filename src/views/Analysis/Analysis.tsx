import { useEffect } from "react";
import ShowTricks from "../../Components/PlayBoard/ShowTricks";
import { analyzeOffline } from "../../Utils/utils";

function MatrixAdd(a: number[][], b: (string | number)[][]) {
  for (let i = 0; i < a.length; ++i) {
    for (let j = 0; j < a[0].length; ++j) {
      a[i][j] += Number(b[i][j]);
    }
  }
}

export default function Analysis(props: any) {
  const { all_boards = [] } = props;
  const table = new Array(4).fill(0).map(() => new Array(5).fill(0));

  useEffect(() => {
    all_boards.forEach((board: any) => {
      analyzeOffline(board).then((res) => {
        MatrixAdd(table, res);
      })
    })

  }, [all_boards])

  return (
    <>
      This is under constuction...
      The average tricks:
      <ShowTricks ddtricks={table} />
    </>
  )
}

