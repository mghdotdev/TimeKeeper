chrome.app.runtime.onLaunched.addListener(function() {

	var windowWidth = 430;
	var windowHeight = 600;

	// bottom right
	var top =  (screen.availHeight - windowHeight) - 50;
	var left = (screen.availWidth - windowWidth) - 50;

	chrome.app.window.create('../app.html', {
		'bounds': {
			'width': windowWidth,
			'height': windowHeight,
			'top': top,
			'left': left 
		}
	});
});