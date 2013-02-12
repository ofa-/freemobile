function init() {
	var state = getState();
	if (!state) {
		showError("error loading state");
		return;
	}
	setupCarousel(state);
	setupNav(state);
}

function getState() {
	return getJson('state.json');
}

function getData(id) {
	return getJson('data/' + id + '.json');
}

function getDataAsync(id, action) {
	getJsonAsync('data/' + id + '.json', action);
}

function setupCarousel(state) {
	var cache = {};
	var currId = state.files.indexOf(state.currId);
	var nbPages = state.files.length;
	var carousel = new SwipeView('#data', {
		numberOfPages: nbPages,
		hastyPageFlip: true
	});
	for (var i=0; i<3; i++) {
		var pre = document.createElement('pre');
		carousel.masterPages[i].appendChild(pre);
		//var page = (currId + i - 1 + nbPages) % nbPages;
		var page = (i - 1 + nbPages) % nbPages;
		setViewData(pre, state.files[page], cache);
	}
	carousel.onFlip(function () {
		for (var i=0; i<3; i++) {
			var dataset = carousel.masterPages[i].dataset;
			var upcoming = dataset.upcomingPageIndex;
			if (upcoming != dataset.pageIndex) {
				var pre = carousel.masterPages[i].firstChild;
				setViewData(pre, state.files[upcoming], cache);
			}
		}
	});
	carousel.home = function () {
		this.goToPage(currId);
	}
	state.carousel = carousel;
}

function setViewData(dest, id, cache) {
	var cacheId = "id_" + id;
	var data = cache[cacheId];
	if (!data) {
		data = getData(id);
		cache[cacheId] = data;
	}
	dest.innerHTML = formatData(data) || "error loading data " + id;
}

function formatData(data) {
	return data ? objToString(data) : false;
}

function setViewDataAsync(dest, id, cache) {
	var cached = "id_" + id;
	if (cache[cached]) {
		dest.innerHTML = cache[cached];
	}
	else {
		cache[cached] = "loading...";
		getDataAsync(id, function (data) {
			cache[cached] = data;
			dest.innerHTML = data || "error loading data " + id;
		});
	}
}

function objToString (obj) {
    var str = '';
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            str += p + '::' + obj[p] + '\n';
        }
    }
    return str;
}

function showError(msg) {
	document.getElementById("data").innerHTML = msg;
}

function setupNav(state) {
	var nav = document.getElementById("nav");
	elt = document.createElement("p");
	elt.innerHTML = "&lt;";
	elt.onclick = function() { state.carousel.prev(); }
	nav.appendChild(elt);
	elt = document.createElement("p");
	elt.innerHTML = "::";
	elt.onclick = function() { state.carousel.home(); }
	nav.appendChild(elt);
	elt = document.createElement("p");
	elt.innerHTML = "&gt;";
	elt.onclick = function() { state.carousel.next(); }
	nav.appendChild(elt);
}

function getDots() {
	return document.querySelectorAll('#nav li');
}

function getJson(url) {
	var req = new XMLHttpRequest();
	req.open('GET', url, false);
	req.send(null);
	var json = eval("json=" + req.responseText);
	return json;
}

function getJsonAsync(url, callback) {
	var req = new XMLHttpRequest();
	req.open('GET', url, true);
	req.onreadystatechange = function () {
		if (req.readyState != 4)
			return;
		if (req.status == 200 || req.status == 304) {
			var json = eval("json=" + req.responseText);
			callback(json);
		}
		else {
			callback(false);
		}
	}
	req.send(null);
}
