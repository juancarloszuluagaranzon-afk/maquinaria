import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ReloadPrompt } from './components/ReloadPrompt'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
        <ReloadPrompt />
    </React.StrictMode>,
)

