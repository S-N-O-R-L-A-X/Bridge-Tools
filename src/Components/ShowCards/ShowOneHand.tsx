import Hand from "../../views/Deal/Hand";
import { HTMLAttributes, ReactNode } from "react"
import { NUMBER2COLOR, NUMBER2COLORICON, NUMBER2COLORSHORT, Position, POSITION2FULL } from "../../Utils/maps";
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

  return (
    <>
      {cards.map((suit: string[], index: number) =>
        beautify ?
          <div key={index} className={className + NUMBER2COLOR[index]}> {NUMBER2COLORICON[index] + " "} {canClick ? suit.map((v: string) => <button>{v}</button>) : suit}</div>
          : <div key={index} className={className + NUMBER2COLOR[index]}> {NUMBER2COLORSHORT[index] + " "} {canClick ? suit.map((v: string) => <button>{v}</button>) : suit}</div>)}
    </>
  )
}