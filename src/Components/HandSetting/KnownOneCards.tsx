import { useState } from "react";
import { RANK2CARD } from "../../Utils/maps";
import { DealContext } from "../../views/Deal/Deal";
import { HandSettingContext } from "./HandSetting";

export default function KnownOneCards() {
  const [show, setShow] = useState<boolean>(false);
  function handleClick() {
    setShow(true);
  }

  function handleCardClick() {

  }

  function handleSubmit() {
    setShow(false);
  }

  return (
    <DealContext.Consumer>
      {
        (context1) =>
          <HandSettingContext.Consumer>
            {
              (context) =>
                <>
                  <button onClick={handleClick}>{context.position}</button>
                  {
                    show &&
                    <div>
                      <div>S {RANK2CARD.map((val, idx) => <button onClick={handleCardClick} className={context1.known_cards[13 * 0 + idx] ? "known" : "unknown"}>{val}</button>)} </div>
                      <div>H {RANK2CARD.map((val, idx) => <button onClick={handleCardClick}>{val}</button>)} </div>
                      <div>D {RANK2CARD.map((val, idx) => <button onClick={handleCardClick}>{val}</button>)} </div>
                      <div>C {RANK2CARD.map((val, idx) => <button onClick={handleCardClick}>{val}</button>)} </div>

                      <button onClick={handleSubmit}>确认</button> <button onClick={() => setShow(false)}>取消</button>
                    </div>
                  }
                </>
            }
          </HandSettingContext.Consumer>
      }
    </DealContext.Consumer >
  )
}