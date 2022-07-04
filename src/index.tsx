import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initializeIcons, mergeStyles } from '@fluentui/react';
import { NeutralColors } from '@fluentui/theme';
import reportWebVitals from './reportWebVitals';

// Initialize translation
import './i18n';

// Initialize icons
initializeIcons();

// Inject some global styles
mergeStyles({
  ':global(body,html,#root)': {
    margin: 0,
    padding: 0,
    height: '100vh',
  },
  ':global(body)': {
    backgroundColor: NeutralColors.gray10
  },
});


createRoot(document.getElementById('root')!).render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
