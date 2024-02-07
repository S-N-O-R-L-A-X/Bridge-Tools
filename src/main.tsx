import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import App from './App'
import PlayBoard from './Components/PlayBoard/PlayBoard'
import './index.css'
import BridgeSolver from './views/AnalysisOnline(abandoned)/BridgeSolverOnline'
import DealWithHands from './views/Deal/DealWithHands'

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
        element: <PlayBoard />
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
