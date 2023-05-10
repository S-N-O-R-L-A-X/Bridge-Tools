import { useState } from "react";
import { RANK2CARD } from "../../Utils/maps";
import { HandSettingContext } from "./HandSetting";

export default function KnownOneCards() {
  const [show, setShow] = useState<boolean>(false);
  function handleClick() {
    setShow(true);
  }

  function handleCardClick() {

  }

  return (
    <HandSettingContext.Consumer>
      {
        (context) =>
          <>
            <button onClick={handleClick}>{context.position}</button>
            {
              show &&
              <div>
                {RANK2CARD.map((val, idx) => <button onClick={handleCardClick}>{val}</button>)}
                <button>确认</button> <button>取消</button>
              </div>
            }
          </>
      }
    </HandSettingContext.Consumer>
  )
}