import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import App from './App'
import MyPlayBoard from './Components/PlayBoard/MyPlayBoard'
import Board from './models/Board'
import Hand from './models/Hand'
import './index.css'
import BridgeSolver from './views/AnalysisOnline(abandoned)/BridgeSolverOnline'
import DealWithHands from './views/Deal/DealWithHands'
import CalculateContract from './views/CalculateContract/CalculateContract'
import ManualBoardInput from './views/ManualBoard/ManualBoardInput'
import { loadManualBoard, makeBoardFromManual, clearManualBoard } from './Utils/manualBoard'

function createDealtBoard(): Board {
  const b = new Board(Math.floor(Math.random() * 16));
  b.deal([new Hand(), new Hand(), new Hand(), new Hand()]);
  return b;
}

function loadSavedManualBoard(): Board | null {
  const manual = loadManualBoard();
  if (!manual) return null;
  try {
    return makeBoardFromManual(manual);
  } catch {
    return null;
  }
}

function initBoard(): Board {
  return loadSavedManualBoard() ?? createDealtBoard();
}

function PlayBoardPage() {
  const [board, setBoard] = React.useState<Board>(initBoard);
  const handleNewBoard = () => {
    clearManualBoard();
    setBoard(createDealtBoard());
  };
  return <MyPlayBoard board={board} onNewBoard={handleNewBoard} />;
}

const route_info = [
  {
    path: "/",
    element: <App />,
    title: "Home",
    children: [
      {
        path: "/deal-multi",
        title: "设置多家牌进行发牌",
        element: <DealWithHands />
      },
      {
        path: "/solver",
        title: "分析",
        element: <BridgeSolver />
      },
      {
        path: "/play-board",
        title: "打牌面板",
        element: <PlayBoardPage />
      },
      {
        path: "/manual-board",
        title: "手动输入牌",
        element: <ManualBoardInput />
      },
      {
        path: "/calc-contract",
        title: "计算分数",
        element: <CalculateContract />
      },
    ],
  },
];

const router = createHashRouter(route_info);


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.Fragment>
    <RouterProvider router={router} />
  </React.Fragment>,
)
