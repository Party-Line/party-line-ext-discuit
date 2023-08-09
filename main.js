// about:debugging#/runtime/this-firefox
// chrome://extensions

// TODO: fix chat window height / shrinking issue
// TODO: get persistent chat logging working
// TODO: get window to go fullscreen on mobile
// TODO: get window to appear on all pages (e.g. in posts and notifications)
// TODO: verify everything is working on all Desktop browsers and iPhone Chrome
// TODO: figure out branding for icons and Disc header
// TODO: get Discuit accounts / login integrated

// minimize the chat window when Discuit is clicked
window.addEventListener('click', (event) => {
    browser.runtime.sendMessage({ action: 'window-minimize' })
})

// handle callback messages
function onCallback(request) {
    let plToggle = document.querySelector('#pl-toggle')
    
    if (request) {
        switch (request.action) {
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
        function(loaded) {
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
    
    browser.runtime.sendMessage(
        {
            action: 'window-toggle',
            // display the window over the right sidebar
            left: document.querySelector('.sidebar-right').offsetLeft - 5
        }
    )
    .then(
        // on callback
        onCallback,
        
        // on error
        function(err) {
        
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