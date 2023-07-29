// about:debugging#/runtime/this-firefox

function toggle() {
    // send a message to the background 
    // script to toggle the chat window
    browser.runtime.sendMessage(
        {
            action: 'toggle',
            // display the window over the right sidebar
            left: document.querySelector('.sidebar-right').offsetLeft - 5
        },
        function(win) {
            // callback
        }
    )
}

// TODO: get the minimize button to change window height too
// TODO: fix chat window height / shrinking issue
// TODO: add a loading screen for the window
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
        div.onclick = toggle
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