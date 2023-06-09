import { useContext, useState } from "react";
import { COLORS, POSITION2NUMBER, RANK2CARD } from "../../Utils/maps";
import { DealContext } from "../../views/Deal/DealContext";
import { HandSettingContext } from "./HandSetting";


export default function KnownCards() {
  const [show, setShow] = useState<boolean>(false);
  const [to_deal_cards, setTo_deal_cards] = useState(new Set<number>());
  const hand_context = useContext(HandSettingContext);
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
    to_deal_cards.forEach((card) => known_cards[card] === -1 ? known_cards[card] = POSITION2NUMBER[hand_context.position!] : known_cards[card] = -1);
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
    <>
      <button onClick={handleClick}>设置{hand_context.position}的已知牌张信息</button>
      {
        show &&
        <div>
          {
            COLORS.map((color, key) =>
              <div key={key}>{color}  {RANK2CARD.map((val, idx) =>
                <button key={key + idx} onClick={(e) => handleCardClick(13 * key + idx, e)}
                  disabled={deal_context.known_cards[13 * key + idx] !== -1 && deal_context.known_cards[13 * key + idx] !== 0}
                  className={(deal_context.known_cards[13 * key + idx] >= 0 ? "known" : "unknown") + " " + (to_deal_cards.has(13 * key + idx) ? "now" : "")}>
                  {val}
                </button>)}
              </div>
            )
          }
          <button onClick={handleSubmit}>确认</button> <button onClick={handleCancel}>取消</button>
        </div>
      }
    </>
  )
}
