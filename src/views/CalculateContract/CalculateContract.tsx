import { CONTRACTCOLORS } from "../../Utils/maps";

export default function CalculateContract() {
	const others = ["PASS", "X", "XX"];
	return (
		<>
			{new Array(7).fill(0).map((_, idx) => idx + 1).map((num) =>
				<div>
					{CONTRACTCOLORS.map((color) => <button key={num + color}>{num}{color}</button>)}
				</div>
			)}
			{others.map((text) => <button key={text}>{text}</button>)}
		</>
	)
}