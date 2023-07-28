// about:debugging#/runtime/this-firefox

var settingsWin = 0;

function showChat() {
    if (settingsWin == 0) {
        chrome.runtime.sendMessage(
            {
                action: 'showChat',
                left: document.querySelector('.sidebar-right').offsetLeft
            },
            function(createdWindow) {
                chatWin = createdWindow
            }
        );
        
    } else {
        browser.windows.remove(chatWin)
    }
}

function init() {
    var navbar = document.querySelector('.navbar .notifications-button')
    
    if (!navbar) {
        setTimeout(init, 500)
    } else {
        var notifyIcon = document.querySelector('.right')
        
        let div = document.createElement('div')
        div.innerHTML = '💬️'
        div.onclick = showChat
        div.style.cursor = 'pointer'
        
        notifyIcon.insertBefore(div, notifyIcon.firstChild)
    }
}

init()