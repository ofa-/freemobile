function init() {
	hideUrlBar();
	setupNav();
	setupLoading();
	getStateAsync(function(state) {
		if (state)
			setupCarousel(state);
		else
			showError("error loading state");
	});
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

function setupCarousel(state) {
	var carousel = new SwipeView('#data', {
		numberOfPages: state.files.length,
		hastyPageFlip: true
	});
	initNav(carousel);
	initCarousel(carousel, state);
}

function initNav(carousel) {
	var butts = document.querySelectorAll('#nav p');
	butts[0].onclick = function() { carousel.prev(); }
	butts[1].onclick = function() { carousel.home(); }
	butts[2].onclick = function() { carousel.next(); }
}

function initCarousel(carousel, state) {
	var cache = {};
	var currId = state.files.indexOf(state.currId);
	var nbPages = state.files.length;
	carousel.pageIndex = currId;
	var local = localStorage.getItem(state.currId);
	if (local) {
		eval("local=" + local);
		if (state.timestamp - local.timestamp > 30) {
			localStorage.removeItem(state.currId);
		}
	}
	for (var i = 0; i < 3; i++) {
		var div = carousel.masterPages[i];
		var dataId = (currId + i - 1 + nbPages) % nbPages;
		div.appendChild(document.createElement("dummy"));
		setViewData(div, state.files[dataId], cache);
	}
	removeLoading();
	carousel.onFlip(function () { carousel.flip() });
	carousel.flip = function () {
		var dir = this.directionX;
		var mp = (this.currentMasterPage - dir + 3) % 3;
		var id = (this.pageIndex - dir + nbPages) % nbPages;
		var div = this.masterPages[mp];
		setViewData(div, state.files[id], cache);
		setHomeButt(this.pageIndex == currId ? "::" : ": :"); 
	}
	carousel.home = function () {
		var d = currId - this.pageIndex;
		if (Math.abs(d) > nbPages/2) d -= nbPages;
		if (d == 0) location.replace("./");
		else if (d > 0)  while (d--) this.next();
		else if (d < 0)  while (d++) this.prev();
	}
}

function setViewData(dest, id, cache) {
	var cacheId = "id_" + id;
	var entry = cache[cacheId];
	if (!entry) {
		entry = createEntry(id);
		cache[cacheId] = entry;
	}
	dest.replaceChild(entry.view, dest.firstChild);
}

function createEntry(id) {
	var entry = {};
	var create = function(data) {
		entry.data = data;
		localStorage.setItem(id, objToString(data));
		if (entry.data) 
			entry.view.innerHTML = formatData(entry.data);
		else
			entry.view.innerHTML = error("error loading data " + id);
	}
	var local = localStorage.getItem(id);
	if (local) {
		entry.view = document.createElement("div");
		eval("local=" + local);
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
	return h ? h + " h " + m + " min" : m ? m + " min " + s + "s" : s + "s";
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
	var str = '{';
	for (var p in obj) {
		if (obj.hasOwnProperty(p)) {
			var v = obj[p];
			str += p + ":" + (
			(v.constructor === Array) ?	'[' + v + ']' :
			(typeof(v) == 'object') ?	objToString(v) :
							v
			) + ",";
		}
	}
	str += '}';
	return str;
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
	var req = new XMLHttpRequest();
	req.open('GET', "manifest.mf", false);
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
