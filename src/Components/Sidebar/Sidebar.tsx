import { Link } from "react-router-dom";
import "./index.css";

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <ul className="sidebarMenuInner">
        <li><Link to="/">Home</Link></li>
        <li><Link to="deal">Deal With One Hand Setting</Link></li>
        <li><Link to="deal-multi">Deal With Multi Hands Setting</Link></li>
        <li><Link to="analysis">Analysis</Link></li>
        <li><a href="https://www.ccba.org.cn/wbf20vp/" target="_blank">imp to vp</a></li>
        <li>Calculate points of contract</li>
        <li><a href="http://playbridge.com/pb_shuffle_project.php" target="_blank">一个其他的发牌网站</a></li>
        <li><a href="https://bridge.esmarkkappel.dk/main/main.html" target="_blank">单套结构打法</a></li>
      </ul>
    </nav>

  )
}