// ==UserScript==
// @name         isnichwahrExtension
// @namespace    http://jandob.com
// @version      0.2
// @description  extends isnichwahr functionality
// @author       jandob
// @match        http://www.isnichwahr.de/
// @grant        none
// @updateURL
// ==/UserScript==

//localStorage.setItem("lastname", "Smith");
//localStorage.removeItem("visitedLinks");
var visitedLinks = JSON.parse(localStorage.getItem("visitedLinks"));
if (visitedLinks === null || visitedLinks.length > 500) {
    visitedLinks = {};
}
//console.log(visitedLinks);
var newLinks = [];
function getType(element) {
    return $(element).parent().prev().children('a').text();
}
$('[id="liste"] tbody tr td:nth-child(3) a').each( function(i, element) {
    var link = $(this).attr('href');
    if (!(link in visitedLinks)) {
        $(this).css( "color", "red" );
        newLinks.push(this);
    }
    $(this).click( function () {
        console.log('click', this);
        $(this).css( "color", "" );
        var index = newLinks.indexOf(this);
        if (index > -1) {
            newLinks.splice(index, 1);
        }
        visitedLinks[link] = getType(this);
        localStorage.setItem("visitedLinks", JSON.stringify(visitedLinks));
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
        var link = $(this).attr('href');
        $(this).css( "color", "" );
        visitedLinks[link] = getType(this);
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
            link.click();
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
            link.click();
        }
    }
});
$('<button class="hans" type="button">Open all new!</button>')
.insertAfter('#middlecategories').click( function() {
    var i = newLinks.length;
    var opened = 0;
    while (i--) {
        if (opened < 5) {
            opened++;
            newLinks[i].click();
        }
    }
});
$('button.hans').css({"margin": "10px", "padding": "5px"});
