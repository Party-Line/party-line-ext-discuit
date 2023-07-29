var windowChat = null

function toggle(callback, winLeft) {
    if (windowChat == null) {
        let settings = {
            type: 'popup',
            
            // you must add this to your hosts
            // to debug / run the app locally
            // 127.0.0.1 discuitchat.local
            // url: 'http://discuitchat.local',
            url: 'https://discuitchat.net',
            
            // display the window over the sidebar
            left: winLeft,
            
            // expand it until the edge of the screen 
            // - 20 is the scrollbar width + spacing
            width: window.screen.width - winLeft - 20,
            
            // display the window under the navbar
            top: window.screen.height - 650,
            
            // expand it until the edge of the screen
            height: 650
        }
        
        browser.windows.create(settings, function (win) {
            windowChat = win
        })
    } else {
        browser.windows.remove(windowChat.id)
        .then(function() {}, function(err) {
            windowChat = null
        })
    }
}

browser.runtime.onMessage.addListener(function(request, sender, callback) {
    if (request) {
        switch (request.action) {
            case 'toggle' :
                toggle(callback, request.left)
                break
        }
    }
})