import Hand from "../../views/Deal/Hand";
import { HTMLAttributes, ReactNode } from "react"
import { NUMBER2COLOR, NUMBER2COLORICON, NUMBER2COLORSHORT, Position, POSITION2FULL } from "../../Utils/maps";
import { callDDSOL } from "../../Utils/callInterface";
interface ShowOneHandProps extends HTMLAttributes<HTMLElement> {
  hand: Hand;
  position: Position;
  canClick?: boolean;
  beautify?: boolean;
}

export default function ShowOneHand(props: ShowOneHandProps) {
  const { hand, position, beautify = false, canClick = false } = props;
  let className = POSITION2FULL[position];
  hand.sortHand();
  const cards = [hand.hand["S"], hand.hand["H"], hand.hand["D"], hand.hand["C"]];

  function handleClick(suit: number, card: string, e?: any) {
    console.log(suit);
    console.log(card);
  }

  return (
    <>
      {cards.map((suit: string[], index: number) =>
        <div key={index} className={className + NUMBER2COLOR[index]}>
          {beautify ? (NUMBER2COLORICON[index] + " ") : (NUMBER2COLORSHORT[index] + " ")} {canClick ? suit.map((v: string) => <button onClick={() => handleClick(index, v)}>{v}</button>) : suit}
        </div>
      )}
    </>
  )
}