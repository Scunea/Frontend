import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initializeIcons, mergeStyles } from '@fluentui/react';
import { NeutralColors } from '@fluentui/theme';
import reportWebVitals from './reportWebVitals';

// Initialize translations
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
  ':global(body):not(.loginBody)': {
    backgroundColor: NeutralColors.gray10
  },
  ':global(.invisible)': {
    display: 'none !important'
  }
});

navigator.serviceWorker
  .register('/service-worker.js')
  .then(function (registration) {
    console.log('[Service Worker] Registered successfully.');
    subscribeUserToPush(import.meta.env.VITE_DOMAIN ?? '');
    return registration;
  })
  .catch(function (err) {
    console.error('[Service Worker] Unable to register.', err);
  });

function subscribeUserToPush(domain: string) {
  return navigator.serviceWorker
    .register('/service-worker.js')
    .then(function (registration) {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '',
        ),
      };

      return registration.pushManager.subscribe(subscribeOptions);
    })
    .then(function (pushSubscription) {
      if (localStorage.getItem("token") && localStorage.getItem("school")) {
        fetch(domain + '/notifications', {
          method: 'POST',
          body: JSON.stringify(pushSubscription),
          headers: new Headers({
            'Authorization': localStorage.getItem('token') ?? "",
            'School': localStorage.getItem('school') ?? "",
            'Content-Type': 'application/json'
          })
        }).then(res => res.json()).then(json => {
          if (!json?.error) {
            console.log('[Push Notifications] Subscribed successfully.');
          }
        });
    }
      return pushSubscription;
    });
}

function urlBase64ToUint8Array(base64String: string) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

createRoot(document.getElementById('root')!).render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
