import { CONTRACTCOLORS, PROGRAM_POSITIONS } from "../../Utils/maps";

interface ShowTricksProps {
  ddtricks?: (string | number)[][] | string;
}

export default function ShowTricks(props: ShowTricksProps) {
  const { ddtricks = "*".repeat(20) } = props;
  let tricks = [];
  if (typeof ddtricks === "string") {
    for (let i = 0; i < 4; ++i) {
      const player_trick = [];
      for (let j = 0; j < 5; ++j) {
        if (ddtricks[i * 4 + j] !== "*") {
          player_trick.push(parseInt(ddtricks[i * 4 + j], 16));
        }
        else {
          player_trick.push("*");
        }
      }
      tricks.push(player_trick);
    }
  }
  else {
    tricks = ddtricks;
  }

  return (
    <table>
      <tbody>
        <tr><td></td>{CONTRACTCOLORS.map((v) => <td key={v}>{v}</td>)}</tr>
        {tricks.map((trick, idx) => <tr key={"row" + idx}><td>{PROGRAM_POSITIONS[idx]}</td>{trick.map((t, idx2) => <td key={"row" + idx + "col" + idx2}>{t}</td>)}</tr>)}
      </tbody>
    </table>
  )
}