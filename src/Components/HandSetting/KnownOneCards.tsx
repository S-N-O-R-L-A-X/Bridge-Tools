import { useContext, useEffect, useState } from "react";
import { NUMBER2COLOR, RANK2CARD } from "../../Utils/maps";
import { DealContext } from "../../views/Deal/Deal";
import { HandSettingContext } from "./HandSetting";

export default function KnownOneCards() {
  const [show, setShow] = useState<boolean>(false);
  const [to_deal_cards, setTo_deal_cards] = useState(new Set<number>());
  const deal_context = useContext(DealContext);

  function handleClick() {
    setShow(true);
  }

  function handleCardClick(card: number, e: any) {
    to_deal_cards.add(card);
    setTo_deal_cards(new Set(to_deal_cards.add(card)));
  }

  function handleSubmit() {
    to_deal_cards.forEach((card) => deal_context.known_cards[card] === 0 ? deal_context.known_cards[card] = 1 : deal_context.known_cards[card] = 0);
    to_deal_cards.clear();
    setTo_deal_cards(to_deal_cards);
    setShow(false);
  }

  function handleCancel() {
    to_deal_cards.clear();
    setTo_deal_cards(to_deal_cards);
    setShow(false);
  }

  useEffect(() => {
    console.log(to_deal_cards)
  }, [to_deal_cards]);

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
                      {
                        ["S", "H", "D", "C"].map((color, key) =>
                          <div>{color}  {RANK2CARD.map((val, idx) =>
                            <button onClick={(e) => handleCardClick(13 * key + idx, e)}
                              disabled={context1.known_cards[13 * key + idx] !== 1 && context1.known_cards[13 * key + idx] !== 0}
                              className={(context1.known_cards[13 * key + idx] ? "known" : "unknown") + " " + (to_deal_cards.has(13 * key + idx) ? "now" : "")}>
                              {val}
                            </button>)}
                          </div>
                        )
                      }
                      <button onClick={handleSubmit}>确认</button> <button onClick={handleCancel}>取消</button>
                    </div>
                  }
                </>
            }
          </HandSettingContext.Consumer>
      }
    </DealContext.Consumer >
  )
}