// about:debugging#/runtime/this-firefox
// chrome://extensions
// edge://extensions

// TODO: create a build script for the manifest
// TODO: get client authentication keys working
// TODO: fix chat window height / shrinking issue
// TODO: get unicode emoticons working
// TODO: add the ability to create / manage channels
// TODO: change the innerHTML toggle logic to use a DOM node instead
// TODO: verify new message still works

if (!('browser' in self)) {
    self.browser = self.chrome
}

var winLeft = 0
var winWidth = 0
var winTop = 0
var winLeft = 0

var winMessageTimer = null
var winDisplayTimer = null

var windowFrame = null

var toggleTimer = null

var toggleURL = browser.runtime.getURL('toggle.png')
var toggleIMG = '<img src="' + toggleURL + '" />'

var toggleNewURL = browser.runtime.getURL('toggle-new.png')
var toggleNewIMG = '<img src="' + toggleNewURL + '" />'

// chat window is loading
function winLoading() {
    let plToggle = document.querySelector('#pl-toggle')
    
    // has the chat window loaded
    browser.runtime.sendMessage({ action: 'window-loaded', get: true })
    .then(
        // on callback
        function (loaded) {
            if (loaded) {
                clearTimeout(toggleTimer)
                
                // hide the loading icon
                plToggle.innerHTML = toggleIMG
                plToggle.style.transform = 'none'
                plToggle.style.marginTop = '0px'
                
                // look for new messages
                winMessage()
                
                // look for display changes
                winDisplay()
            } else {
                // rotate the icon while we wait
                if (plToggle.style.transform == 'none') {
                    plToggle.style.transform = 'rotate(90deg)'
                    plToggle.style.marginTop = '10px'
                } else {
                    plToggle.style.transform = 'none'
                    plToggle.style.marginTop = '0px'
                }
                
                toggleTimer = setTimeout(winLoading, 250)
            }
        }
    )
}

// chat window messages
function winMessage() {
    let plToggle = document.querySelector('#pl-toggle')
    
    // does the chat window have a new message
    browser.runtime.sendMessage({ action: 'window-message', get: true })
    .then(
        // on callback
        function (message) {
            if (message) {
                // update the toggle icon to new
                if (plToggle.innerHTML !== toggleNewIMG) {
                    plToggle.innerHTML = toggleNewIMG
                }
            } else {
                // revert the toggle icon to its default
                if (plToggle.innerHTML !== toggleIMG) {
                    plToggle.innerHTML = toggleIMG
                }
            }
            
            winMessageTimer = setTimeout(winMessage, 1000)
        }
    )
}

// chat window display
function winDisplay() {
    // did the chat window request a display update
    browser.runtime.sendMessage({ action: 'window-display', get: true })
    .then(
        // on callback
        function (display) {
            if (display) {
                switch (display) {
                    // minimize
                    case 'minimize' :
                        document.querySelector('#pl-win').style.top = (window.innerHeight - 47) + 'px'
                        document.querySelector('#pl-win').style.height = '47px'
                        break
                    // maximize
                    case 'maximize' :
                        document.querySelector('#pl-win').style.top = winTop + 'px'
                        document.querySelector('#pl-win').style.height = winHeight + 'px'
                        break
                    case 'close' :
                        if (document.querySelector('#pl-win')) {
                            clearTimeout(winMessageTimer)
                            clearTimeout(winDisplayTimer)
                            
                            document.querySelector('#pl-win').remove()
                            windowFrame = null
                            
                            browser.runtime.sendMessage({ action: 'ext-shutdown' })
                        }
                        break
                }
            }
            
            winDisplayTimer = setTimeout(winDisplay, 250)
        }
    )
}

// toggle the chat window
function winToggle(event) {
    event.stopPropagation()
    
    if (windowFrame === null) {
        // display the window over the main sidebar
        let sidebar = document.querySelector('.sidebar-right')
        
        // display the window over the last 1/3 of the screen
        // this is needed for pages that don't have a sidebar
        winLeft = (window.innerWidth / 3) * 2
        
        if (sidebar) {
            winLeft = sidebar.offsetLeft //- 5
        } else {
            // display the window over the post sidebar
            sidebar = document.querySelector('aside .right')
            
            if (sidebar) {
                winLeft = sidebar.offsetLeft //- 5
            }
        }
        
        // mobile is any window that a width under 900px
        let mobile = (window.innerWidth < 900) ? true : false
        
        // 50px + 15px of spacing to the top of the sidebar
        let navbarHeight = 65
        
        // go fullscreen on mobile devices
        // TODO: verify this actually works on mobile
        if (mobile) {
            winLeft = 0
            winWidth = window.innerWidth
            
            winTop = 0
            winHeight = window.innerHeight
        } else {
            // display the window over the sidebar
            winLeft = winLeft
            
            // expand it until the edge of the screen 
            // - 30 is the scrollbar width + spacing
            winWidth = window.innerWidth - winLeft - 30
            
            // display the window under the navbar
            winTop = window.innerHeight - 650
            if (winTop < navbarHeight) { winTop = navbarHeight }
            
            // expand it until the edge of the screen
            winHeight = 650
        }
        
        // create the chat window
        windowFrame = document.createElement('iframe')
        windowFrame.style.border = '1px solid #000000'
        windowFrame.style.borderRadius = '5px'
        windowFrame.style.borderBottom = '0px'
        windowFrame.style.borderBottomLeftRadius = '0px'
        windowFrame.style.borderBottomRightRadius = '0px'
        windowFrame.width = '100%'
        windowFrame.height = '100%'
        
        // decide what URL to use based on the manifest
        if (browser.runtime.getManifest().content_scripts[1].matches == 'http://localhost/*') {
            windowFrame.src = 'http://localhost'
        } else {
            windowFrame.src = 'https://discuitchat.net'
        }
        
        // create the container 
        let div = document.createElement('div')
        div.id = 'pl-win'
        div.style.zIndex = 999999
        div.style.position = 'fixed'
        div.style.top = winTop + 'px'
        div.style.left = winLeft + 'px'
        div.style.width = winWidth + 'px'
        div.style.height = winHeight + 'px'
        div.style.backgroundColor = '#FFFFFF'
        
        // append the chat window to the container
        div.appendChild(windowFrame)
        
        // append the container to the Discuit page
        document.body.appendChild(div)
        
        // initialize the extension
        browser.runtime.sendMessage({
            action: 'ext-init',
            // remove the trailing slash that Chrome adds
            url: windowFrame.src.replace(/\/$/, '')
        })
        .then(
            // on callback
            function (loaded) {
                // show the loading icon
                document.querySelector('#pl-toggle').innerHTML = '⏳'
                
                // wait for the chat window to load
                winLoading()
            }
        )
    } else {
        // TODO: should this maximize the window ?
        // browser.runtime.sendMessage({ action: 'window-display', value: 'max' })
    }
}

function init() {
    // get the Discuit navbar
    let dtNavbar = document.querySelector('.navbar')
    
    if (dtNavbar == null) {
        // retry until React has loaded the navbar
        setTimeout(init, 500)
    } else {
        // remove the existing chat button
        let plToggle = document.querySelector('#pl-toggle')
        if (plToggle) { plToggle.remove() }
        
        // create a new chat button
        let div = document.createElement('div')
        div.id = 'pl-toggle'
        div.innerHTML = toggleIMG
        div.onclick = winToggle
        div.style.cursor = 'pointer'
        
        // get the navbar's right column
        let dtNavbarRight = document.querySelector('.navbar .right')
        
        if (dtNavbarRight) {
            // add the chat button next to the notifications button
            dtNavbarRight.insertBefore(div, dtNavbarRight.firstChild)
        } else {
            console.log('Party Line - The ".navbar .right" column is missing')
        }
    }
}

init()
