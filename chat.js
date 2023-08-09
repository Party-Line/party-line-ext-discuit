// look for messages from the chat window
window.addEventListener('message', (event) => {
    // make sure the message is coming from us
    if (event.origin !== 'http://localhost' && event.origin !== 'https://discuitchat.net')  { return }
    
    // send them to the background script
    browser.runtime.sendMessage(event.data)
})