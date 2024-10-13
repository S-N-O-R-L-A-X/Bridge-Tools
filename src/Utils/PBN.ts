import Hand from "../models/Hand";

export function parseHand(hand: Hand) {
	let ret = "";
	function replace10(cards: string[]) {
		cards.forEach((card) => {
			if (card === "10") {
				ret += "T";
			}
			else {
				ret += card;
			}
		})
	}
	replace10(hand.hand["S"]);
	ret += ".";
	replace10(hand.hand["H"]);
	ret += ".";
	replace10(hand.hand["D"]);
	ret += ".";
	replace10(hand.hand["C"]);
	return ret;
}

export function convertAllHandsToPBN(allHands: Hand[]) {
	let str = "N:";
	str += parseHand(allHands[0]) + " " + parseHand(allHands[2]) + " " + parseHand(allHands[1]) + " " + parseHand(allHands[3]);
	return str;
}

export default function exportPBN(allHands: Hand[], boardNumber: number) {
	const pbn = `% PBN 2.1
% EXPORT

[Date ${new Date().getFullYear()}]
[Board "${boardNumber}"]
[West ""]
[North ""]
[East ""]
[South ""]
[Deal ${convertAllHandsToPBN(allHands)}]
`

	// download
	const blob = new Blob([pbn], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	// 创建一个临时的 <a> 标签，设置 href 属性为刚刚创建的 URL  
	const link = document.createElement('a');
	link.href = url;
	link.download = 'test.pbn'; // 设置下载文件的名称  

	// 将 <a> 标签插入到 DOM 中并触发点击事件  
	document.body.appendChild(link);
	link.click();

	// 从 DOM 中移除临时的 <a> 标签  
	document.body.removeChild(link);

	// 释放刚刚创建的 URL 对象  
	URL.revokeObjectURL(url);
}
