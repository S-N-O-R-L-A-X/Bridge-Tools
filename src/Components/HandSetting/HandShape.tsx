import { ChangeEvent, useContext, useEffect, useState } from "react"
import HandAmbiguousShape from "./HandAmbiguousShape";
import { HandSettingContext } from "./HandSetting";
import HandSpecificShape from "./HandSpecificShape";

export default function HandShape() {
  const [show, setShow] = useState<boolean>(false);
  const [specificShape, setSpecificShape] = useState<boolean>(true);

  const context = useContext(HandSettingContext);

  function changeShape() {
    setSpecificShape(!specificShape);
    context.setShapeType(!specificShape);
  }

  function handleClick() {
    setShow(true);
  }

  function handleCancel() {
    context.setShapes(undefined);
    context.setAmbiguousShape(undefined);
    setShow(false);
  }

  return (
    <HandSettingContext.Consumer>
      {
        (context) => (
          <>
            <button onClick={handleClick}>设置{context.position}牌型</button>
            {show &&
              (
                <>
                  <span onChange={changeShape}>
                    <input type="radio" name="shape" id="specific" defaultChecked /><label htmlFor="specific">精确牌型</label>
                    <input type="radio" name="shape" id="ambiguous" /><label htmlFor="ambiguous">模糊牌型</label>
                  </span>
                  {specificShape ? <HandSpecificShape /> : <HandAmbiguousShape />}
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