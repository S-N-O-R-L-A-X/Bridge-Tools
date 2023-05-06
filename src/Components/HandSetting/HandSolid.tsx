import { ChangeEvent, useState } from "react";

interface HandSolidProps {
  position: "N" | "E" | "S" | "W";
}

export default function HandSolid(props: HandSolidProps) {
  const [solid, setSolid] = useState<boolean>(false);
  function handleSolid(e: ChangeEvent) {
    setSolid((e.target as HTMLInputElement).checked);
  }
  return (
    <>
      北家是否有坚固套 <input type="checkbox" id="solid" name="solid" onChange={handleSolid} />
    </>
  )
}