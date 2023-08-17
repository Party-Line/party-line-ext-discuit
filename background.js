// look for messages from the content scripts
browser.runtime.onMessage.addListener(function (request, sender, callback) {
    if (request) {
        switch (request.action) {
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
                    callback(winLoaded)
                } else {
                    winLoaded = true
                }
                break
            case 'window-verify' :
                // verify the data from the client matches what we have in the extension
                if (request.data.sid == disSession && request.data.username == disUser.username) {
                    callback({ action: request.action, data: request.data.jwt })
                } else {
                    callback({ action: request.action, data: null })
                }
                break
            case 'ext-loaded' :
                if (request.get) {
                    callback(extLoaded)
                }
                break
            case 'ext-data' :
                let data = null
                
                // verify we are logged in and have some data
                if (disSession && disUser !== null && disCommunities !== null) {
                    // TODO: distill the Discuit specific community 
                    // data into a common object format
                    data = {
                        sid: disSession,
                        username: disUser.username,
                        channels: disCommunities
                    }
                }
                
                callback({
                    action: request.action,
                    data: data
                })
                break
        }
    }
})

var winId = null
var winLoaded = false

var disCookies = null
var disSession = null
var disUser = null
var disCommunities = null

var extLoaded = false

// Note: onMessage callbacks can not be called within a fetch promise
// and so the client can't make API calls and get a response back.
// So, to get around this we get all API data during window creation
// and cache it for later usage.
function disInit() {
    let pCookies = browser.cookies.getAll({ url: 'https://discuit.net' })
    .then((cookies) => {
        disCookies = cookies
        
        for (let key in disCookies) {
            let cookie = disCookies[key];
            
            if (cookie.name == 'SID') {
                disSession = cookie.value
                break
            }
        }
    })

    let pUser = fetch('https://discuit.net/api/_user', {
        method: 'GET',
        credentials: 'include'
    })
    .then((response) => {
        if (response.status == 200) {
            return response.json()
        } else {
            return null
        }
    })
    .then((user) => {
        disUser = user
    })
    
    let pCommunities = fetch('https://discuit.net/api/communities?set=subscribed', {
        method: 'GET',
        credentials: 'include'
    })
    .then((response) => {
        if (response.status == 200) {
            return response.json()
        } else {
            return null
        }
    })
    .then((communities) => {
        disCommunities = communities
    })
    
    Promise.all([pCookies, pUser, pCommunities]).then((values) => {
        extLoaded = true
    })
}

function winToggle(callback, mobile, winLeft) {
    if (winId === null) {
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
        
        // get the Discuit data
        disInit()
        
        // create the chat window
        browser.windows.create(settings)
        .then(
            // on created
            function (win) {
                winId = win.id
                
                browser.windows.onRemoved.addListener((id) => {
                    winId = null
                    winLoaded = false
                    
                    disCookies = null
                    disSession = null
                    disUser = null
                    disCommunities = null
                    
                    extLoaded = false
                })
            },
            
            // on error
            function (err) {
                // TODO
            }
        )
    } else {
        // get the chat window info
        browser.windows.get(winId)
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
    if (winId === null) { return }
    
    // get the chat window info
    browser.windows.get(winId)
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
    if (winId === null) { return }
    
    // get the chat window info
    browser.windows.get(winId)
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
