import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, RouterProvider, createHashRouter, Link, Route, Routes } from 'react-router-dom'
import App from './App'
import './index.css'
import Analysis from './views/Analysis/Analysis'
import BridgeSovler from './views/Analysis/BridgeSolverOnline'
import Deal from './views/Deal/Deal'
import DealWithAnalysis from './views/Deal/DealWithAnalysis'
import DealWithHands from './views/Deal/DealWithHands'

const route_info = [
  {
    path: "/",
    element: <App />,
    title: "Home",
    children: [
      {
        path: "/deal",
        title: "设置一家牌进行发牌",
        element: <Deal />
      },
      {
        path: "/deal-multi",
        title: "设置多家牌进行发牌",
        element: <DealWithHands />
      },
      {
        path: "/analysis",
        title: "分析",
        element: <Analysis />
      },
      {
        path: "/solver",
        title: "分析",
        element: <BridgeSovler />
      },
      {
        path: "/deal-analysis",
        title: "分析",
        element: <DealWithAnalysis />
      },
    ],
  },
];

const router = createHashRouter(route_info);


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
