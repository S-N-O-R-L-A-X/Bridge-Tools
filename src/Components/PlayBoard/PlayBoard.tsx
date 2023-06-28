import "./PlayBoard.css";
import { useState } from "react";

export default function PlayBoard() {
  const [isLoading, setIsLoading] = useState(true);

  function handleOnload() {
    setIsLoading(false);
  }

  return (
    <>
      {isLoading && <h3>Please wait for several seconds...</h3>}
      <iframe onLoad={handleOnload} id="bridgeweb-board" name="myiframe" src="https://dds.bridgewebs.com/bridgesolver/upload.htm"></iframe>
      <p>This page is from <a href="https://dds.bridgewebs.com/bridgesolver/upload.htm">https://dds.bridgewebs.com/bridgesolver/upload.htm</a></p>
    </>
  )
}