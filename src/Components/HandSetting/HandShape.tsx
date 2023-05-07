import { ChangeEvent, useEffect, useState } from "react"
import { NUMBER2COLOR, NUMBER2COLORICON } from "../../Utils/maps";
import { HandSettingContext } from "./HandSetting";

export default function HandShape() {
  const [spades, setSpades] = useState<number>(4);
  const [hearts, setHearts] = useState<number>(3);
  const [diamonds, setDiamonds] = useState<number>(3);
  const [clubs, setClubs] = useState<number>(3);
  const [rest, setRest] = useState<number>(0);

  function handleSpadesChange(e: ChangeEvent) {
    setSpades(Number((e.target as HTMLInputElement).value));
  }

  function handleHeartsChange(e: ChangeEvent) {
    setHearts(Number((e.target as HTMLInputElement).value));
  }

  function handleDiamondsChange(e: ChangeEvent) {
    setDiamonds(Number((e.target as HTMLInputElement).value));
  }

  function handleClubsChange(e: ChangeEvent) {
    setClubs(Number((e.target as HTMLInputElement).value));
  }

  const shapes = [spades, hearts, diamonds, clubs];
  const handleFunctions = [handleSpadesChange, handleHeartsChange, handleDiamondsChange, handleClubsChange];

  useEffect(() => {
    setRest(13 - spades - hearts - diamonds - clubs);
  }, [spades, hearts, diamonds, clubs, rest])

  return (
    <HandSettingContext.Consumer>
      {
        (context) => (
          <>
            请输入{context.position}牌型
            {handleFunctions.map((handle, idx) =>
              <>
                {NUMBER2COLORICON[idx]}
                <select name={NUMBER2COLOR[idx]} defaultValue={shapes[idx]} onChange={handle}>
                  {new Array(shapes[idx] + rest + 1).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
                </select>
              </>
            )}
          </>
        )
      }
    </HandSettingContext.Consumer>

  )
}