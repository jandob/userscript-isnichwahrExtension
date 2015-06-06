// ==UserScript==
// @name         isnichwahrExtension
// @namespace    http://jandob.com
// @version      0.3
// @description  extends isnichwahr functionality
// @author       jandob
// @match        http://www.isnichwahr.de/
// @grant        GM_openInTab
// @grant        GM_info
// @updateURL    https://github.com/jandob/userscripts/raw/master/isnichwahr.de.user.js
// ==/UserScript==
var isTampermonkey = GM_info.scriptHandler === "Tampermonkey";

var visitedLinks = JSON.parse(localStorage.getItem("visitedLinks"));
if (visitedLinks === null || visitedLinks.length > 500) {
    visitedLinks = {};
}
var newLinks = [];

function getType(element) {
    return $(element).parent().prev().children('a').text();
}
function openLink(element, open_in_background) {
    var url = $(element).attr('href');
    console.log('click', element);
    $(element).css( "color", "" );
    var index = newLinks.indexOf(element);
    if (index > -1) {
        newLinks.splice(index, 1);
    }
    visitedLinks[url] = getType(element);
    localStorage.setItem("visitedLinks", JSON.stringify(visitedLinks));
    if (isTampermonkey) {
        GM_openInTab(url, {'active': !open_in_background});
    } else {
        GM_openInTab(url, open_in_background);
    }
}

$('[id="liste"] tbody tr td:nth-child(3) a').each( function(i, element) {
    var url = $(this).attr('href');
    if (!(url in visitedLinks)) {
        $(this).css( "color", "red" );
        newLinks.push(this);
    }
    $(this).click( function (event) {
        event.preventDefault();
        openLink(this, false);
    });
});
$('<button class="hans" type="button">Cleanup!</button>')
.insertAfter('#middlecategories').click( function() {
    localStorage.removeItem("visitedLinks");
    location.reload();
});
$('<button class="hans" type="button">Mark all as seen!</button>')
.insertAfter('#middlecategories').click( function() {
    $('[id="liste"] tbody tr td:nth-child(3) a').each( function(i, element) {
        var url = $(this).attr('href');
        $(this).css( "color", "" );
        visitedLinks[url] = getType(this);
        localStorage.setItem("visitedLinks", JSON.stringify(visitedLinks));
    });
    newLinks = [];
});
$('<button class="hans" type="button">Open all Pics!</button>')
.insertAfter('#middlecategories').click( function() {
    var i = newLinks.length;
    var opened = 0;
    while (i--) {
        var link = newLinks[i];
        if (opened < 5 && getType(link) === "pics") {
            opened++;
            openLink(link, true);
        }
    }
});
$('<button class="hans" type="button">Open all Videos!</button>')
.insertAfter('#middlecategories').click( function() {
    var i = newLinks.length;
    var opened = 0;
    while (i--) {
        var link = newLinks[i];
        if (opened < 5 && (getType(link) === "video" || getType(link) === "klassiker")) {
            opened++;
            openLink(link, true);
        }
    }
});
$('<button class="hans" type="button">Open all new!</button>')
.insertAfter('#middlecategories').click( function() {
    var i = newLinks.length;
    var opened = 0;
    while (i--) {
        var link = newLinks[i];
        if (opened < 5) {
            opened++;
            openLink(link, true);
        }
    }
});
$('button.hans').css({"margin": "10px", "padding": "5px"});
