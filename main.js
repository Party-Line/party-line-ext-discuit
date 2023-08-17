// about:debugging#/runtime/this-firefox
// chrome://extensions

// TODO: fix chat window height / shrinking issue
// TODO: figure out branding for icons and Disc header

// TODO: verify everything is working on all Desktop browsers and iPhone Chrome
// TODO: get persistent chat logs working

// minimize the chat window when Discuit is clicked
window.addEventListener('click', (event) => {
    browser.runtime.sendMessage({ action: 'window-minimize' })
})

// handle callback messages
function onCallback(message) {
    let plToggle = document.querySelector('#pl-toggle')
    
    if (message) {
        switch (message.action) {
            case 'window-loading' :
                // show the loading icon
                plToggle.innerHTML = '⏳'
                
                // wait for the chat window to load
                winLoading()
                
                break
        }
    }
}

// chat window is loading
function winLoading() {
    let plToggle = document.querySelector('#pl-toggle')
    
    // has the chat window loaded
    browser.runtime.sendMessage({ action: 'window-loaded', get: true })
    .then(
        // on callback
        function (loaded) {
            if (loaded) {
                // hide the loading icon
                plToggle.innerHTML = '💬️'
                plToggle.style.transform = 'none'
            } else {
                // rotate the icon while we wait
                if (plToggle.style.transform == 'none') {
                    plToggle.style.transform = 'rotate(90deg)'
                } else {
                    plToggle.style.transform = 'none'
                }
                
                setTimeout(winLoading, 250)
            }
        }
    )
}

// toggle the chat window
function winToggle(event) {
    event.stopPropagation()
    
    // display the window over the main sidebar
    let sidebar = document.querySelector('.sidebar-right')
    
    // display the window over the last 1/3 of the screen
    // this is needed for pages that don't have a sidebar
    let sidebarLeft = (window.screen.width / 3) * 2
    
    if (sidebar) {
        sidebarLeft = sidebar.offsetLeft - 5
    } else {
        // display the window over the post sidebar
        sidebar = document.querySelector('aside .right')
        
        if (sidebar) {
            sidebarLeft = sidebar.offsetLeft - 5
        }
    }
    
    browser.runtime.sendMessage(
        {
            action: 'window-toggle',
            mobile: (window.screen.width < 900) ? true : false,
            left: sidebarLeft
        }
    )
    .then(
        // on callback
        onCallback,
        
        // on error
        function (err) {
            // TODO
        }
    )
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
        div.innerHTML = '💬️'
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
