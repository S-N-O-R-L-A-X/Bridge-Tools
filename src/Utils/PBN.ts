import Board from "../models/Board";
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

export default function exportPBN(board: Board) {
	const date = new Date();
	const pbn = `% PBN 2.1
% EXPORT
%Content-type: text/x-pbn; charset=ISO-8859-1
[Event ""]
[Site ""]
[Date "${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}"]
[Board "${board.boardnum}"]
[West "?"]
[North "?"]
[East "?"]
[South "?"]
[Dealer "N"]
[Vulnerable "None"]
[Deal "${convertAllHandsToPBN(board.getAllHands())}"]
[Scoring ""]
[Declarer ""]
[Contract ""]
[Result ""]
[DoubleDummyTricks "********************"]
[OptimumResultTable "Declarer;Denomination;Result"]
N NT  0
N  S  0
N  H  0
N  D  0
N  C  0
S NT  0
S  S  0
S  H  0
S  D  0
S  C  0
E NT  0
E  S  0
E  H  0
E  D  0
E  C  0
W NT  0
W  S  0
W  H  0
W  D  0
W  C  0
[OptimumScore ""]
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
