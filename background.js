if (!('browser' in self)) {
    self.browser = self.chrome
}

// look for messages from the content scripts
browser.runtime.onMessage.addListener(function (request, sender, callback) {
    if (request) {
        switch (request.action) {
            case 'ext-init' :
                extInit(request.url)
                break
            case 'ext-script' :
                callback(true)
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
            case 'ext-shutdown' :
                extShutdown()
                break
            case 'window-loaded' :
                if (request.get) {
                    callback(winLoaded)
                } else {
                    winLoaded = true
                }
                break
            case 'window-display' :
                if (request.get) {
                    callback(winDisplay)
                } else {
                    winDisplay = request.value
                }
                break
            case 'window-message' :
                if (request.get) {
                    callback(winMessage)
                } else {
                    winMessage = request.value
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
        }
    }
})

var ws = null
var wsTimer = null

var extLoaded = false

var winLoaded = false
var winDisplay = 'max'
var winMessage = false

var disCookies = null
var disSession = null
var disUser = null
var disCommunities = null

// allows the global variables to persist
function keepAlive(url) {
    let wsURL = url.replace('http', 'ws')
    ws = new WebSocket(wsURL + ':8080')

    ws.onmessage = function (event) {
        // send a keep alive before the service worker
        // becomes inactive (i.e. 30 seconds)
        wsTimer = setTimeout(function () {
            ws.send(JSON.stringify({ type: 'keepalive' }))
        }, 20000)
    }

    ws.onclose = function (event) {
        // restart the web socket connection
        setTimeout(keepAlive, 20000, url)
    }

    ws.onopen = function (event) {
        ws.send(JSON.stringify({ type: 'keepalive' }))
    }
}

function extShutdown() {
    ws = null
    
    if (wsTimer) {
        clearTimeout(wsTimer)
    }
    
    extLoaded = false

    winLoaded = false
    winDisplay = 'max'
    winMessage = false

    disCookies = null
    disSession = null
    disUser = null
    disCommunities = null
}

// Note: onMessage callbacks can not be called within a fetch promise
// and so the client can't make API calls and get a response back.
// To get around this we get all the API data during initialization
// and send it to the chat window in the "ext-data" response.
function extInit(url) {
    extShutdown()
    keepAlive(url)
    
    let pCookies = browser.cookies.getAll({ url: 'https://discuit.net' })
    .then((cookies) => {
        disCookies = cookies
        
        for (let key in disCookies) {
            let cookie = disCookies[key]
            
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
