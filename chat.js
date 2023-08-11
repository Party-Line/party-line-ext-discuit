// look for messages from the chat window
window.addEventListener('message', (event) => {
    // make sure the message is coming from us
    if (event.origin !== 'http://localhost' && event.origin !== 'https://discuitchat.net')  { return }
    
    // send them to the background script
    browser.runtime.sendMessage(event.data)
    .then(
            // on callback
            function(message) {
                if (message) {
                    // browsers no longer allow you to send data from an extension to a webpage in a custom event
                    // and so we save the data to session storage and dispatch an event telling the webpage to get it
                    sessionStorage.setItem(message.action, JSON.stringify(message.data))
                    window.dispatchEvent(new Event('ext-' + message.action));
                }
            },
            
            // on error
            function(err) {
                if (err) {
                    sessionStorage.setItem(message.action + '-error', JSON.stringify(err))
                    window.dispatchEvent(new Event('ext-' + message.action + '-error'));
                }
            }
        )
})