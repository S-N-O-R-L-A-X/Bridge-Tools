import Hand from "../../views/Deal/Hand";
import { HTMLAttributes } from "react"
import { NUMBER2COLOR, NUMBER2COLORICON, NUMBER2COLORSHORT, POSITION2FULL } from "../../Utils/maps";
interface ShowOneHandProps extends HTMLAttributes<HTMLElement> {
  hand: Hand;
  position: "N" | "E" | "S" | "W";
  beautify?: boolean;
}

export default function ShowOneHand(props: ShowOneHandProps) {

  const { hand, position, beautify = false } = props;
  let className = POSITION2FULL[position];
  return (
    <>
      {hand.showWithoutColors().map((suit: string, index: number) => beautify ? <div key={index} className={className + NUMBER2COLOR[index]}> {NUMBER2COLORICON[index] + " " + suit}</div> : <div key={index} className={className + NUMBER2COLOR[index]}> {NUMBER2COLORSHORT[index] + " " + suit}</div>)}
    </>
  )
}