function init() {
	setupNav();
	hideUrlBar();
	setupLoading();
	buildCarousel();
}

function getStateAsync(callback) {
	getJsonAsync('data/state.json', callback);
}

function getDataAsync(id, callback) {
	getJsonAsync('data/' + id + '.json', callback);
}

function setupNav() {
	var nav = document.getElementById("nav");
	nav.innerHTML = "<p>&lt;</p><p>::</p><p>&gt;</p>";
	nav.children[1].onclick = function() { location.reload(true) }
}

function setupLoading() {
	var data = document.getElementById("data");
	data.innerHTML = "<div><div></div></div>";
	data.firstChild.style.cssText = "width:100%;height:100%";
	data.firstChild.firstChild.style.cssText = "width:100%;height:100%";
	data.firstChild.firstChild.appendChild(makeLoadingScreen());
}

function removeLoading() {
	var data = document.getElementById("data");
	data.removeChild(data.firstChild);
}

function hideUrlBar() {
	window.onorientationchange = function () {
		window.scrollTo(0, 0);
	}
	window.onorientationchange();
}

function buildCarousel() {
	getStateAsync(function(state) {
		if (state)
			updateLocal(state);
		else
			state = getLocalItem("state");

		if (state)
			setupCarousel(state);
		else
			showError("no data");
	});
}

function getLocalItem(key) {
	return eval("(" + localStorage.getItem("freemobile_" + key) + ")");
}

function setLocalItem(key, obj) {
	localStorage.setItem("freemobile_" + key, objToString(obj));
}

function updateLocal(state) {
	var local = getLocalItem("state");
	if (local && local.timestamp < state.timestamp)
		invalidateLocal(local, state);
	setLocalItem("state", state);
}

function invalidateLocal(local, state) {
	var currId = state.files.indexOf(local.currId);
	var stopId = state.files.indexOf(state.currId);
	var size = state.files.length;
	if (currId == -1)
		currId = (stopId + 1) % size;
	while (currId != stopId) {
		setLocalItem(state.files[currId], 0);
		currId = ++currId % size;
	}
	setLocalItem(state.files[currId], 0);
}

function populateCache(state) {
	var cache = {};
	cache.size = state.files.length;
	cache.currId = state.files.indexOf(state.currId);
	for (var i=0; i < cache.size; i++) {
		cache[i] = createEntry(state.files[i]);
	}
	return cache;
}

function setupCarousel(state) {
	var cache = populateCache(state);
	var carousel = new SwipeView('#data', {
		numberOfPages: cache.size,
		hastyPageFlip: true
	});
	initCarousel(carousel, cache);
	initNav(carousel);
}

function initNav(carousel) {
	var butts = document.querySelectorAll('#nav p');
	butts[0].onclick = function() { carousel.prev(); }
	butts[1].onclick = function() { carousel.home(); }
	butts[2].onclick = function() { carousel.next(); }
}

function initCarousel(carousel, cache) {
	var currId = cache.currId;
	var nbPages = cache.size;
	for (var i = 0; i < 3; i++) {
		var div = carousel.masterPages[i];
		div.appendChild(document.createElement("dummy"));
	}
	carousel.onFlip(function () {
		for (var i=-1; i<2; i++) {
			var mpId = (carousel.currentMasterPage + i + 3) % 3;
			var pgId = (carousel.pageIndex + i + nbPages) % nbPages;
			setViewData(carousel.masterPages[mpId], cache[pgId]);
		}
		setHomeButt(carousel.pageIndex == currId ? "::" : ": :"); 
	});
	carousel.home = function () {
		var d = currId - this.pageIndex;
		if (Math.abs(d) > nbPages/2) d -= nbPages;
		if (d == 0) location.replace("./");
		else if (d > 0)  while (d--) this.next();
		else if (d < 0)  while (d++) this.prev();
	}
	carousel.goToPage(currId);
	removeLoading();
}

function setViewData(dest, entry) {
	dest.replaceChild(entry.view, dest.firstChild);
}

function createEntry(id) {
	var entry = {};
	var create = function(data) {
		entry.data = data;
		setLocalItem(id, data);
		if (entry.data) 
			entry.view.innerHTML = formatData(entry.data);
		else
			entry.view.innerHTML = error("error loading data " + id);
	}
	var local = getLocalItem(id);
	if (local) {
		entry.view = document.createElement("div");
		create(local);
	}
	else {
		entry.view = makeLoadingScreen();
		getDataAsync(id, create);
	}
	return entry;
}

function formatData(data) {
	var date = new Date(data.timestamp * 1000);
	var day = pad02(date.getDate()) + "." + pad02(date.getMonth()+1);
	var hour = date.getHours();
	var voice = data.voice_nat + data.voice_int + data.voice_spe;
	var sms = data.sms_nat + data.sms_int;
	var mms = data.mms_nat + data.mms_int;
	var datA = (data.data_nat + data.data_int).toFixed(0);
	var cost = (data.cost).toFixed(2);
	return format1(day, hour, voice, sms, mms, datA, cost);
}

function format1(day, hour, voice, sms, mms, data, cost) {
        var html = "";
	var time = pretty_time(voice);
	var t1 = time.split(" ")[0];
	var t2 = time.substring(t1.length);
	html += "<div>";
        html += "<p class=header>";
        html += day + "<span>" + hour + "h</span>";
        html += "</p><p>";
        html += "<span>" + t1 + "</span>" + t2;
        html += "</p><p>";
        html += "<span>" + sms + "</span> SMS";
        html += "</p><p>";
        html += "<span>" + mms + "</span> MMS";
        html += "</p><p>";
        html += "<span>" + data + "</span> Mo";
        html += "</p><p class=footer>";
        html += "<span>Total</span> " + cost + " €";
        html += "</p>";
	html += "</div>";
        return html;
}

function pad02(num) {
	num = "0" + num ;
	return num.substring(num.length - 2);
}

function pretty_time(sec) {
	var h = Math.floor(sec / 3600);
	var m = Math.floor((sec - h * 3600) / 60);
	var s = sec % 60;
	return h ? h + " h " + m + " min" : m ? m + " min " + s + "s" : s + " s";
}

function error(msg) {
	return "<div><center>" + msg + "</center></div>";
}

function makeLoadingScreen() {
	var div = document.createElement("div")
	div.innerHTML = "<div><center>loading</center></div>";
	div.firstChild.appendChild(create_spinner());
	return div;
}

function objToString (obj) {
	var str = "";
	for (var p in obj) {
		var v = obj[p];
		str += p + ":" + (
			(v.constructor === Array) ?	'[' + v + ']' :
			(v.constructor === Object) ?	objToString(v) :
							v
		) + ",";
	}
	return obj ? "{" + str + "}" : "null";
}

function showError(msg) {
	var elt = document.querySelectorAll('#data div')[3];
	elt.innerHTML = error(msg);
}

function setHomeButt(txt) {
	var home = document.querySelectorAll('#nav p')[1];
	home.innerHTML = txt;
}

function getDots() {
	return document.querySelectorAll('#nav li');
}

function getVersion() {
	var manifest = document.documentElement.getAttribute("manifest");
	var req = new XMLHttpRequest();
	req.open('GET', manifest, false);
	req.send(null);
	var version = req.responseText.split('\n')[1];
	return version;
}

function nocache(url) {
	return url + "?" + new Date().getTime();
}

function getJson(url) {
	var req = new XMLHttpRequest();
	req.open('GET', nocache(url), false);
	req.send(null);
	var json = null;
	try { eval("json=" + req.responseText); } catch (e) {}
	return json;
}

function getJsonAsync(url, callback) {
	var req = new XMLHttpRequest();
	req.open('GET', nocache(url), true);
	req.onreadystatechange = function () {
		if (req.readyState != 4)
			return;
		if (req.status == 200 || req.status == 304) {
			var json = null;
			try { eval("json=" + req.responseText); } catch (e) {}
			callback(json);
		}
		else {
			callback(false);
		}
	}
	req.send(null);
}
