import { ChangeEvent, useContext, useEffect, useState } from "react"
import { NUMBER2COLOR, NUMBER2COLORICON } from "../../Utils/maps";
import { HandSettingContext } from "./HandSetting";

export default function HandAmbiguousShape() {
  const [minSpades, setMinSpades] = useState<number>(0);
  const [minHearts, setMinHearts] = useState<number>(0);
  const [minDiamonds, setMinDiamonds] = useState<number>(0);
  const [minClubs, setMinClubs] = useState<number>(0);
  const [maxSpades, setMaxSpades] = useState<number>(13);
  const [maxHearts, setMaxHearts] = useState<number>(13);
  const [maxDiamonds, setMaxDiamonds] = useState<number>(13);
  const [maxClubs, setMaxClubs] = useState<number>(13);


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

  const minShapes = [minSpades, minHearts, minDiamonds, minClubs];
  const maxShapes = [maxSpades, maxHearts, maxDiamonds, maxClubs];

  const handleMinFunctions = [handleMinSpadesChange, handleMinHeartsChange, handleMinDiamondsChange, handleMinClubsChange];
  const handleMaxFunctions = [handleMaxSpadesChange, handleMaxHeartsChange, handleMaxDiamondsChange, handleMaxClubsChange];

  useEffect(() => {
    // setRest(13 - spades - hearts - diamonds - clubs);
    context.setAmbiguousShape([[minSpades, maxSpades], [minHearts, maxHearts], [minDiamonds, maxDiamonds], [minClubs, maxClubs]]);

  }, [minSpades, minHearts, minDiamonds, minClubs, maxSpades, maxHearts, maxDiamonds, maxClubs])

  return (
    <HandSettingContext.Consumer>
      {
        (context) => (
          <>
            <table className="ambiguous-table">
              <tbody>
                <tr><td>colors</td><td>min</td><td>max</td></tr>
                {
                  handleMinFunctions.map((handle, idx) =>
                    <tr>

                      <td>{NUMBER2COLORICON[idx]}</td>
                      <td>
                        <select name={NUMBER2COLOR[idx]} defaultValue={minShapes[idx]} onChange={handle}>
                          {new Array(14).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
                        </select>
                      </td>
                      <td>
                        <select name={NUMBER2COLOR[idx]} defaultValue={maxShapes[idx]} onChange={handleMaxFunctions[idx]}>
                          {new Array(14).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
                        </select>
                      </td>
                    </tr>)
                }
              </tbody>
            </table>
          </>
        )
      }
    </HandSettingContext.Consumer>

  )

}