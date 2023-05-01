import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, RouterProvider, createHashRouter, Link, Route, Routes } from 'react-router-dom'
import App from './App'
import './index.css'
import Deal from './views/Deal/Deal'

const route_info = [
  {
    path: "/",
    element: <App />,
    title: "Home",
    children: [
      {
        path: "/deal",
        title: "发牌",
        element: <Deal />
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
