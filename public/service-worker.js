/*
This file is part of Scunea.
Copyright (C) 2025  Mateo Hideg

Scunea is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Scunea is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Scunea.  If not, see <https://www.gnu.org/licenses/>.
*/

self.addEventListener('push', event => {
    if (event.data) {
        const data = JSON.parse(event.data?.text());
        self.registration.showNotification('newMessage' ? 'New message!' : data?.event === 'newActivity' ? 'New activity!' : data?.event === 'newReport' ? 'New report!' : data?.event === 'newGrades' ? 'New grades!' : '', {
            icon: '/icon192.png',
            body: data?.title,
            tag: data?.event
        });
    }
});

self.addEventListener('notificationclick', function (event) {
    const clickedNotification = event.notification;
    clickedNotification.close();

    const urlToOpen = new URL(clickedNotification.tag === 'newMessage' ? '/#messages' : clickedNotification.tag === 'newActivity' ? '/#activities' : clickedNotification.tag === 'newReport' ? '/#reports' : clickedNotification.tag === 'newGrades' ? '/#grades' : '', self.location.origin).href;

    const promiseChain = clients
        .matchAll({
            type: 'window',
            includeUncontrolled: true,
        })
        .then((windowClients) => {
            let matchingClient = null;

            for (let i = 0; i < windowClients.length; i++) {
                const windowClient = windowClients[i];
                if (windowClient.url === urlToOpen) {
                    matchingClient = windowClient;
                    break;
                }
            }

            if (matchingClient) {
                return matchingClient.focus();
            } else {
                return clients.openWindow(urlToOpen);
            }
        });

    event.waitUntil(promiseChain);
});
