self.addEventListener('push', event => {
    if (event.data) {
        const data = JSON.parse(event.data?.text());
        self.registration.showNotification('newMessage' ? 'New message!' : data?.event === 'newActivity' ? 'New activity!' : data?.event === 'newReport' ? 'New report!' : 'newGrades' ? 'New grades!' : '', {
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