import { ChangeEvent, useContext, useEffect, useState } from "react"
import { NUMBER2COLOR, NUMBER2COLORICON } from "../../Utils/maps";
import HandAmbiguousShape from "./HandAmbiguousShape";
import { HandSettingContext } from "./HandSetting";

export default function HandShape() {
  const [show, setShow] = useState<boolean>(false);
  const [spades, setSpades] = useState<number>(4);
  const [hearts, setHearts] = useState<number>(3);
  const [diamonds, setDiamonds] = useState<number>(3);
  const [clubs, setClubs] = useState<number>(3);
  const [rest, setRest] = useState<number>(0);

  const context = useContext(HandSettingContext);

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

  function handleClick() {
    setShow(true);
  }

  function handleCancel() {
    context.setShapes(undefined);
    setShow(false);
  }

  const shapes = [spades, hearts, diamonds, clubs];
  const handleFunctions = [handleSpadesChange, handleHeartsChange, handleDiamondsChange, handleClubsChange];

  useEffect(() => {
    setRest(13 - spades - hearts - diamonds - clubs);
    if (show) {
      context.setShapes([spades, hearts, diamonds, clubs]);
    }
  }, [spades, hearts, diamonds, clubs, rest])

  return (
    <HandSettingContext.Consumer>
      {
        (context) => (
          <>
            <button onClick={handleClick}>设置{context.position}牌型</button>
            {show &&
              (
                <>
                  {
                    handleFunctions.map((handle, idx) =>
                      <>
                        {NUMBER2COLORICON[idx]}
                        <select name={NUMBER2COLOR[idx]} defaultValue={shapes[idx]} onChange={handle}>
                          {new Array(shapes[idx] + rest + 1).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
                        </select>
                      </>)

                  }
                  <HandAmbiguousShape />
                  <button onClick={handleCancel}>取消设置</button>
                </>
              )
            }
          </>
        )
      }
    </HandSettingContext.Consumer>

  )
}