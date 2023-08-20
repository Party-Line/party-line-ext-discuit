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
                    let value = (event.data.get) ? message : message.data
                    
                    if (event.data.action == 'window-verify') {
                        let jwt = value
                        
                        // save the JSON web token
                        sessionStorage.setItem('jwt', jwt)
                        
                        // wait until the data has been written
                        while (sessionStorage.getItem('jwt') !== jwt) {}
                        
                        value = true
                    }
                    
                    // browsers no longer allow you to send data from an extension to a webpage in a custom event
                    // and so we save the data to session storage and dispatch an event telling the webpage to get it
                    sessionStorage.setItem(event.data.action, JSON.stringify(value))
                    window.dispatchEvent(new Event(event.data.action))
                }
            },
            
            // on error
            function(err) {
                if (err) {
                    sessionStorage.setItem(event.data.action + '-error', JSON.stringify(err))
                    window.dispatchEvent(new Event(event.data.action + '-error'))
                }
            }
        )
})