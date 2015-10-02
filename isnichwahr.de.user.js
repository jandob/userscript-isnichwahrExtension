
// ==UserScript==
// @name         isnichwahrExtension
// @namespace    http://jandob.com
// @version      0.8
// @description  extends isnichwahr functionality
// @author       jandob
// @match        http://www.isnichwahr.de/*
// @grant        GM_openInTab
// @grant        GM_info
// @updateURL    https://github.com/jandob/userscripts/raw/master/isnichwahr.de.user.js
// ==/UserScript==
var isTampermonkey = GM_info.scriptHandler === "Tampermonkey";
var $ = jQuery;

$('.service-links').remove();

if (window.location.href.indexOf("isnichwahr.de/r") > -1){
    $('.navbar').remove();
    $('body').attr('style', 'padding-top: 0px !important');
    $('div.panel-panel.top').remove()

    $('div.panel-panel.right').remove()
    $('div.panel-panel.left').removeClass (function (index, css) {
        console.log(index);
        console.log(css);
        return (css.match(/(^|\s)col-\S+/g) || []).join(' ');
    });
    $('div.panel-panel.left').addClass('col-xs-12 col-md-10 col-md-offset-1');
}
if (window.location.href.indexOf("isnichwahr.de/list") > -1) {

    var visitedLinks = JSON.parse(localStorage.getItem("visitedLinks"));
    if (visitedLinks === undefined || visitedLinks === null || visitedLinks.length > 1000) {
        visitedLinks = {};
    }
    var newLinks = [];

    function getType(element) {
        return $(element).parent().prev().find('.term-category a').text()
    }
    function openLink(element, open_in_background) {
        var url = 'http://www.isnichwahr.de' + $(element).attr('href');
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

    $('.view-link-liste tbody tr td:nth-child(3) a').each( function(i, element) {
        var url = 'http://www.isnichwahr.de' + $(this).attr('href');
        if (!(url in visitedLinks)) {
            $(this).css( "color", "red" );
            newLinks.push(this);
        }
        $(this).click( function (event) {
            event.preventDefault();
            openLink(this, false);
        });
    });
    $('.view-link-liste .text-center:first').remove();
    controls = $('<ul class="pagination"></ul>');
    $('<div class="text-center"><div/>').prependTo('.view-link-liste').append(controls);

    $('<li><a class="hans">Cleanup!</a></li>')
    .appendTo(controls).click( function() {
        localStorage.removeItem("visitedLinks");
        location.reload();
    });
    $('<li><a class="hans">Mark all as seen!</a></li>')
    .appendTo(controls).click( function() {
        $('[id="liste"] tbody tr td:nth-child(3) a').each( function(i, element) {
            var url = $(this).attr('href');
            $(this).css( "color", "" );
            visitedLinks[url] = getType(this);
            localStorage.setItem("visitedLinks", JSON.stringify(visitedLinks));
        });
        newLinks = [];
    });
    $('<li><a class="hans">Open all Pics!</a></li>')
    .appendTo(controls).click( function() {
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
    $('<li><a class="hans">Open all Videos!</a></li>')
    .appendTo(controls).click( function() {
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
    $('<li><a class="hans">Open all new!</a></li>')
    .appendTo(controls).click( function() {
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
    $('a.hans').css({"cursor": "pointer"});
}
