import { ChangeEvent, useContext, useEffect, useState } from "react"
import { NUMBER2COLOR, NUMBER2COLORICON } from "../../Utils/maps";
import { HandSettingContext } from "./HandSetting";

export default function HandAmbiguousShape() {
  const [show, setShow] = useState<boolean>(false);
  const [minSpades, setMinSpades] = useState<number>(0);
  const [minHearts, setMinHearts] = useState<number>(0);
  const [minDiamonds, setMinDiamonds] = useState<number>(0);
  const [minClubs, setMinClubs] = useState<number>(0);
  const [maxSpades, setMaxSpades] = useState<number>(13);
  const [maxHearts, setMaxHearts] = useState<number>(13);
  const [maxDiamonds, setMaxDiamonds] = useState<number>(13);
  const [maxClubs, setMaxClubs] = useState<number>(13);

  const [rest, setRest] = useState<number>(0);

  const context = useContext(HandSettingContext);

  function handleMinSpadesChange(e: ChangeEvent) {
    setMinSpades(Number((e.target as HTMLInputElement).value));
  }

  function handleMinHeartsChange(e: ChangeEvent) {
    setMinHearts(Number((e.target as HTMLInputElement).value));
  }

  function handleMinDiamondsChange(e: ChangeEvent) {
    setMinDiamonds(Number((e.target as HTMLInputElement).value));
  }

  function handleMinClubsChange(e: ChangeEvent) {
    setMinClubs(Number((e.target as HTMLInputElement).value));
  }

  function handleMaxSpadesChange(e: ChangeEvent) {
    setMaxSpades(Number((e.target as HTMLInputElement).value));
  }

  function handleMaxHeartsChange(e: ChangeEvent) {
    setMaxHearts(Number((e.target as HTMLInputElement).value));
  }

  function handleMaxDiamondsChange(e: ChangeEvent) {
    setMaxDiamonds(Number((e.target as HTMLInputElement).value));
  }

  function handleMaxClubsChange(e: ChangeEvent) {
    setMaxClubs(Number((e.target as HTMLInputElement).value));
  }


  function handleClick() {
    setShow(true);
  }

  function handleCancel() {
    context.setShapes(undefined);
    setShow(false);
  }

  const minShapes = [minSpades, minHearts, minDiamonds, minClubs];
  const maxShapes = [maxSpades, maxHearts, maxDiamonds, maxClubs];

  const handleMinFunctions = [handleMinSpadesChange, handleMinHeartsChange, handleMinDiamondsChange, handleMinClubsChange];
  const handleMaxFunctions = [handleMaxSpadesChange, handleMaxHeartsChange, handleMaxDiamondsChange, handleMaxClubsChange];

  useEffect(() => {
    // setRest(13 - spades - hearts - diamonds - clubs);
    if (show) {
      // context.setShapes([spades, hearts, diamonds, clubs]);
    }
  }, [minSpades, minHearts, minDiamonds, minClubs, rest])

  return (
    <HandSettingContext.Consumer>
      {
        (context) => (
          <>
            <button onClick={handleClick}>需要模糊牌型？</button>
            {show &&
              (
                <table>
                  <tr><td>position</td><td>min</td><td>max</td></tr>
                  {
                    handleMinFunctions.map((handle, idx) =>
                      <tr>
                        <td>{NUMBER2COLORICON[idx]}</td>
                        <td>
                          <select name={NUMBER2COLOR[idx]} defaultValue={minShapes[idx]} onChange={handle}>
                            {new Array(minShapes[idx] + rest + 1).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
                          </select>
                        </td>
                        <td>
                          <select name={NUMBER2COLOR[idx]} defaultValue={maxShapes[idx]} onChange={handleMaxFunctions[idx]}>
                            {new Array(maxShapes[idx] + rest + 1).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
                          </select>
                        </td>
                      </tr>)
                  }
                  <button onClick={handleCancel}>取消设置</button>
                </table>
              )
            }
          </>
        )
      }
    </HandSettingContext.Consumer>

  )

}