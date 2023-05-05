import { ChangeEvent, useState } from "react"

export default function HandShape() {
  const [spades, setSpades] = useState<number>(4);
  const [hearts, setHearts] = useState<number>(3);
  const [diamonds, setDiamonds] = useState<number>(3);
  const [clubs, setClubs] = useState<number>(3);
  const [rest, setRest] = useState<number>(0);

  function handleSpadesChange(e: ChangeEvent) {
    setSpades(Number((e.target as HTMLInputElement).value));
    setRest(13 - spades - hearts - diamonds - clubs);
    console.log(rest);
  }

  function handleHeartsChange(e: ChangeEvent) {
    setHearts(Number((e.target as HTMLInputElement).value));
    setRest(13 - spades - hearts - diamonds - clubs);
  }

  function handleDiamondsChange(e: ChangeEvent) {
    setDiamonds(Number((e.target as HTMLInputElement).value));
    setRest(13 - spades - hearts - diamonds - clubs);
  }

  function handleClubsChange(e: ChangeEvent) {
    setClubs(Number((e.target as HTMLInputElement).value));
    setRest(13 - spades - hearts - diamonds - clubs);
  }

  return (
    <>
      <select
        name="spades"
        defaultValue={spades}
        onChange={handleSpadesChange}
      >
        {new Array(spades + rest + 1).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
      </select>
      <select
        defaultValue={hearts}
        onChange={handleHeartsChange}
      >
        {new Array(hearts + rest + 1).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
      </select>
      <select
        defaultValue={diamonds}
        onChange={handleDiamondsChange}
      >

        {new Array(diamonds + rest + 1).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
      </select>
      <select
        defaultValue={clubs}
        onChange={handleClubsChange}
      >
        {new Array(clubs + rest + 1).fill(0).map((_, idx) => <option value={idx}>{idx}</option>)}
      </select>

    </>

  )
}