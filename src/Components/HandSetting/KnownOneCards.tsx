import { useContext, useEffect, useState } from "react";
import { COLORS, NUMBER2COLOR, RANK2CARD } from "../../Utils/maps";
import { DealContext } from "../../views/Deal/Deal";
import { HandSettingContext } from "./HandSetting";

export default function KnownOneCards() {
  const [show, setShow] = useState<boolean>(false);
  const [to_deal_cards, setTo_deal_cards] = useState(new Set<number>());
  const deal_context = useContext(DealContext);
  const { known_cards, changeKnown_cards } = deal_context;
  function handleClick() {
    setShow(true);
  }

  function handleCardClick(card: number, e: any) {
    if (to_deal_cards.has(card)) {
      to_deal_cards.delete(card);
      setTo_deal_cards(new Set(to_deal_cards));
    }
    else {
      setTo_deal_cards(new Set(to_deal_cards.add(card)));
    }
  }

  function handleSubmit() {
    to_deal_cards.forEach((card) => known_cards[card] === 0 ? known_cards[card] = 1 : known_cards[card] = 0);
    console.log(known_cards);
    changeKnown_cards([...known_cards]);
    to_deal_cards.clear();
    setTo_deal_cards(new Set(to_deal_cards));
    setShow(false);
  }

  function handleCancel() {
    to_deal_cards.clear();
    setTo_deal_cards(new Set(to_deal_cards));
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
                      {
                        COLORS.map((color, key) =>
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