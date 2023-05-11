import { useContext, useState } from "react";
import { RANK2CARD } from "../../Utils/maps";
import { DealContext } from "../../views/Deal/Deal";
import { HandSettingContext } from "./HandSetting";

export default function KnownOneCards() {
  const [show, setShow] = useState<boolean>(false);
  const set_known_cards: number[] = [];
  const deal_context = useContext(DealContext);

  function handleClick() {
    setShow(true);
  }

  function handleCardClick(card: number, e: any) {
    set_known_cards.push(card);
  }

  function handleSubmit() {
    set_known_cards.forEach((card) => deal_context.known_cards[card] = true)
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
                      <div>S {RANK2CARD.map((val, idx) => <button onClick={(e) => handleCardClick(13 * 0 + idx, e)} disabled={context1.known_cards[13 * 0 + idx]} className={context1.known_cards[13 * 0 + idx] ? "known" : "unknown"}>{val}</button>)} </div>
                      <div>H {RANK2CARD.map((val, idx) => <button onClick={(e) => handleCardClick(13 * 1 + idx, e)} disabled={context1.known_cards[13 * 0 + idx]} className={context1.known_cards[13 * 1 + idx] ? "known" : "unknown"}>{val}</button>)} </div>
                      <div>D {RANK2CARD.map((val, idx) => <button onClick={(e) => handleCardClick(13 * 2 + idx, e)} disabled={context1.known_cards[13 * 0 + idx]} className={context1.known_cards[13 * 2 + idx] ? "known" : "unknown"}>{val}</button>)} </div>
                      <div>C {RANK2CARD.map((val, idx) => <button onClick={(e) => handleCardClick(13 * 3 + idx, e)} disabled={context1.known_cards[13 * 0 + idx]} className={context1.known_cards[13 * 3 + idx] ? "known" : "unknown"}>{val}</button>)} </div>

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