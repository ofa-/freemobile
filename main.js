function init() {
	var state = getState();
	if (!state) return showError("error loading state");
	setupCarousel(state);
	setupNav(state);
}

function getState() {
	return getJson('data/state.json');
}

function getData(id) {
	return getJson('data/' + id + '.json');
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
		var div = document.createElement('div');
		carousel.masterPages[i].appendChild(div);
		carousel.masterPages[i].dataset.pageIndex = undefined;
	}
	carousel.onFlip(function () { carousel.flip() });
	carousel.flip = function () {
		for (var i=0; i<3; i++) {
			var dataset = this.masterPages[i].dataset;
			var upcoming = dataset.upcomingPageIndex;
			if (upcoming != dataset.pageIndex) {
				var div = this.masterPages[i].firstChild;
				setViewData(div, state.files[upcoming], cache);
			}
		}
		setHomeButt(this.pageIndex == currId ? "::" : ": :"); 
	}
	carousel.home = function () {
		if (this.pageIndex == currId) {
			location.replace("./");
			return;
		}
		var d = this.pageIndex > currId ? -1 : +1;
		this.goToPage((currId - d + nbPages) % nbPages);
		(d == 1) ? this.next() : this.prev();
	}
	carousel.goToPage(currId);
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

function setHomeButt(txt) {
	var home = document.querySelectorAll('#nav p')[1];
	if (home) home.innerHTML = txt;
}

function getDots() {
	return document.querySelectorAll('#nav li');
}

function getJson(url) {
	var req = new XMLHttpRequest();
	req.open('GET', url, false);
	req.send(null);
	var json = null;
	try { eval("json=" + req.responseText); } catch (e) {}
	return json;
}

function getJsonAsync(url, callback) {
	var req = new XMLHttpRequest();
	req.open('GET', url, true);
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
