chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('main-window.html', {
        'id':'mainWindow',
        'outerBounds': {
            'width': 480,
            'height': 640
        }
    });
});