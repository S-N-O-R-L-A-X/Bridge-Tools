import "./PlayBoard.css";

export default function PlayBoard() {
  return (
    <>
      <iframe id="bridgeweb-board" name="myiframe" src="https://dds.bridgewebs.com/bridgesolver/upload.htm" style={{ "display": "block" }}></iframe>
      <p>This page is from <a href="https://dds.bridgewebs.com/bridgesolver/upload.htm">https://dds.bridgewebs.com/bridgesolver/upload.htm</a></p>
    </>
  )
}