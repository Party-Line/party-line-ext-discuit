// look for messages from the content scripts
browser.runtime.onMessage.addListener(function (request, sender, callback) {
    if (request) {
        switch (request.action) {
            case 'window-init' :
                winInit()
                break
            case 'window-toggle' :
                winToggle(callback, request.mobile, request.left)
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
            case 'window-cookies' :
                callback({ action: request.action, data: winCookies })
                break
        }
    }
})

var winChatId = null
var winChatLoaded = false
var winCookies = null

function winInit() {
    // get the Discuit cookies
    browser.cookies.getAll({ url: 'https://discuit.net' })
    .then((cookies) => { winCookies = cookies })
}

function winToggle(callback, mobile, winLeft) {
    if (winChatId === null) {
        // go fullscreen on smaller devices
        // TODO: verify this actually works on mobile
        //       state / maximized doesn't seem to work
        if (mobile) {
            winState = 'normal'
            
            winLeft = 0
            winWidth = window.screen.width
            
            // 5 is spacing
            winTop = 5
            
            // - 45 is the titlebar height
            winHeight = window.screen.height - 45
        } else {
            winState = 'normal'
            
            // display the window over the sidebar
            winLeft = winLeft
            
            // expand it until the edge of the screen 
            // - 20 is the scrollbar width + spacing
            winWidth = window.screen.width - winLeft - 20
            
            // display the window under the navbar
            winTop = window.screen.height - 650
            
            // expand it until the edge of the screen
            winHeight = 650
        }
        
        let settings = {
            // panel would be preferrable, so we don't have 
            // the title / button bar, but it is deprecated
            type: 'popup',
            
            // this does not work
            // alwaysOnTop: true,
            
            focused: true,
            state: winState,
            
            // url: 'http://localhost',
            url: 'https://discuitchat.net',
            
            left: winLeft,
            width: winWidth,
            top: winTop,
            height: winHeight
        }
        
        // let the script know the window is loading
        callback({ action: 'window-loading' })
        
        // create the chat window
        browser.windows.create(settings)
        .then(
            // on created
            function (win) {
                winChatId = win.id
                
                browser.windows.onRemoved.addListener((winId) => {
                    winChatId = null
                    winChatLoaded = false
                    winCookies = null
                })
            },
            
            // on error
            function (err) {
                // TODO
            }
        )
    } else {
        // get the chat window info
        browser.windows.get(winChatId)
        .then(
            // on success
            function (win) {
                // minimize the chat window when open
                if (win.state !== 'minimized') {
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
            function (err) {
                // TODO
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
        function (win) {
            if (win.state !== 'minimized') {
                browser.windows.update(win.id, {
                    state: 'minimized'
                })
            }
        },
        
        // on error
        function (err) {
            // TODO
        }
    )
}

function winMaximize(callback) {
    if (winChatId === null) { return }
    
    // get the chat window info
    browser.windows.get(winChatId)
    .then(
        // on success
        function (win) {
            if (win.state !== 'maximized') {
                browser.windows.update(win.id, {
                    state: 'maximized'
                })
            }
        },
        
        // on error
        function (err) {
            // TODO
        }
    )
}
