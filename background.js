// look for messages from the content scripts
browser.runtime.onMessage.addListener(function(request, sender, callback) {
    if (request) {
        switch (request.action) {
            case 'window-toggle' :
                winToggle(callback, request.left)
                break
            case 'window-minimize' :
                winMinimize(callback)
                break
            case 'window-maximize' :
                winMaximize(callback)
                break
            case 'window-loaded' :
                if (request.get) {
                    callback(winChatLoaded)
                } else {
                    winChatLoaded = true
                }
                break
        }
    }
})

var winChatId = null
var winChatLoaded = false

function winToggle(callback, winLeft) {
    if (winChatId === null) {
        let settings = {
            // panel would be preferrable, so we don't have 
            // the title / button bar, but it is deprecated
            type: 'popup',
            
            // this does not work
            // alwaysOnTop: true,
            
            focused: true,
            state: 'normal',
            
            // url: 'http://localhost',
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
        
        // let the script know the window is loading
        callback({ action: 'window-loading' })
        
        // create the chat window
        browser.windows.create(settings)
        .then(
            // on created
            function(win) {
                winChatId = win.id
                
                browser.windows.onRemoved.addListener((winId) => {
                    winChatId = null
                    winChatLoaded = false
                })
            },
            
            // on error
            function(err) {
            
            }
        )
    } else {
        // get the chat window info
        browser.windows.get(winChatId)
        .then(
            // on success
            function(win) {
                // minimize the chat window when open
                if (win.state == 'normal') {
                    browser.windows.update(win.id, {
                        // we use state / minimized because
                        // focused / false does not work
                        state: 'minimized'
                    })
                // otherwise open it to normal size
                } else {
                    browser.windows.update(win.id, {
                        state: 'normal'
                    })
                }
            },
            
            // on error
            function(err) {
            
            }
        )
    }
}

function winMinimize(callback) {
    if (winChatId === null) { return }
    
    // get the chat window info
    browser.windows.get(winChatId)
    .then(
        // on success
        function(win) {
            if (win.state != 'minimized') {
                browser.windows.update(win.id, {
                    state: 'minimized'
                })
            }
        },
        
        // on error
        function(err) {
        
        }
    )
}

function winMaximize(callback) {
    if (winChatId === null) { return }
    
    // get the chat window info
    browser.windows.get(winChatId)
    .then(
        // on success
        function(win) {
            if (win.state != 'maximized') {
                browser.windows.update(win.id, {
                    state: 'maximized'
                })
            }
        },
        
        // on error
        function(err) {
        
        }
    )
}
