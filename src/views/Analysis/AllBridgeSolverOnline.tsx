import { ReactElement, useEffect, useState } from "react";
import { sleep } from "../../Utils/utils";
import Hand from "../Deal/Hand";
import BridgeSolver from "./BridgeSolverOnline";

interface AllBridgeSolverOnlineProps {
  all_boards: Hand[][];
  beautify?: boolean;
}

export default function AllBridgeSolverOnline(props: AllBridgeSolverOnlineProps) {
  const { all_boards, ...rest } = props;
  const [Components, setComponents] = useState<ReactElement[]>([]);

  async function patchRenderComponents() {
    let n = all_boards.length;
    for (let i = 0; i < n; ++i) {
      // const newComponent = <div>aaa</div>
      // Components.push(newComponent);
      // setComponents(Components.slice(0))
      const newComponent = <BridgeSolver key={i} allHands={all_boards[i]} boardNumber={i + 1} {...rest} />;
      Components.push(newComponent);
      setComponents(Components.slice(0));
      if (i >= 9 && i % 9 === 0) {
        await sleep(1000);
      }
    }
  }

  useEffect(() => {
    patchRenderComponents();
  }, [])

  return (
    <div className="all-boards">

      {Components}
      {/* {all_boards.map((board: Hand[], idx) => <BridgeSolver key={idx} allHands={board} boardNumber={idx + 1} {...rest} />)} */}
    </div>
  )
}