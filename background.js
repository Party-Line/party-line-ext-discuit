browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request && request.action === 'showChat') {
        let settings = {
            type: 'popup',
            url: 'https://discuitchat.net',
            width: 425,
            height: 650,
            top: window.screen.height - 650,
            left: request.left - 5
        }
        
        browser.windows.create(settings, function (win) {
            sendResponse(win)
        })
    }
})