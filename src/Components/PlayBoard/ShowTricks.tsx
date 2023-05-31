import { CONTRACTCOLORS } from "../../Utils/maps";

interface ShowTricksProps {
  ddtricks: (string | number)[][] | string;
}

export default function ShowTricks(props: ShowTricksProps) {
  const { ddtricks } = props;

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
        <tr>{CONTRACTCOLORS.map((v) => <td>{v}</td>)}</tr>
        {tricks.map((trick) => <tr>{trick.map((t) => <td>{t}</td>)}</tr>)}
      </tbody>
    </table>
  )
}