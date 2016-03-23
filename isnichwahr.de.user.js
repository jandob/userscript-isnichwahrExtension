// ==UserScript==
// @name         isnichwahrExtension
// @namespace    http://jandob.com
// @version      1.1
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

if (window.location.href.indexOf("isnichwahr.de/r") > -1) {
    $('.navbar').remove();
    $('body').attr('style', 'padding-top: 10px !important');
    $('div.panel-panel.top').remove();

    $('div.panel-panel.right').remove();
    $('div.panel-panel.left').removeClass (function (index, css) {
        return (css.match(/(^|\s)col-\S+/g) || []).join(' ');
    });
    $('div.panel-panel.left').addClass('col-xs-12 col-md-10 col-md-offset-1');
}
if (window.location.href.indexOf("isnichwahr.de/list") > -1) {

    var storageUri = localStorage.getItem("visitedLinksUUID");
    var visitedLinks = JSON.parse(localStorage.getItem("visitedLinks"));
    if (visitedLinks === undefined || visitedLinks === null) {
        visitedLinks = {};
        localStorage.setItem("visitedLinks", JSON.stringify(visitedLinks));
    }

    var newLinks = [];
    var $currentLinks = $('.view-link-liste tbody tr td:nth-child(3) a');
    var currentLinks = {};
    function updateVisited() {
        newLinks = [];
        $currentLinks.each( function(i, element) {
            if (!($(this).attr('href') in visitedLinks)) {
                $(this).css( "color", "red" );
                newLinks.push(this);
            } else {
                $(this).removeAttr('style');
            }
        });
    }
    var storage = {
        create: function() {
            $.ajax({
                url:"https://api.myjson.com/bins",
                type:"POST",
                data: JSON.stringify(visitedLinks),
                contentType:"application/json; charset=utf-8",
                dataType:"json"
            }).done( function(data) {
                storageUri=data.uri;
                localStorage.setItem("visitedLinksUUID", data.uri);
                window.location.reload();
            });
        },
        set: function () {
            var data=JSON.stringify(visitedLinks);
            localStorage.setItem("visitedLinks", data);
            $.ajax({
                url: storageUri,
                type:"PUT",
                data: data,
                contentType:"application/json; charset=utf-8",
                dataType:"json"
            }).done( function(data) {
                visitedLinks = data;
                localStorage.setItem("visitedLinks", JSON.stringify(visitedLinks));
            });
        },
        get: function () {
            visitedLinks=JSON.parse(localStorage.getItem("visitedLinks"));
            updateVisited();
            return $.get(storageUri).done( function(data) {
                visitedLinks=data;
                localStorage.setItem("visitedLinks", JSON.stringify(visitedLinks));
                updateVisited();
                console.log('got visitedLinks from server, nr of links: ',
                            $.map(visitedLinks, function(n, i) { return i; }).length);
            });
        }
    };
    if (storageUri === null || storageUri === undefined || storageUri == "undefined" ) {
        console.log("creating new storageUri");
        storage.create(visitedLinks);
    } else {
        storage.get();

        if (visitedLinks.length > 1000) {
            $.each(visitedLinks, function(link, type) {
                if (!(currentLinks.hasOwnProperty(link))) {
                    delete visitedLinks[link];
                }
            });
            storage.set();
        }

        $currentLinks.each(function() {
            var url = $(this).attr('href');
            currentLinks[url] = getType(this);
        });
        // initialize newLinks
        $currentLinks.each( function(i, element) {
            $(this).click( function (event) {
                event.preventDefault();
                openLink(this, false);
            });
        });

        function getType(element) {
            var elementTypes = {
                '.fa-film, .fa-youtube': 'video',
                '.glyphicon-picture': 'pics'
            };
            var foundType = false;
            $.each(elementTypes, function(selector, type) {
                if ($(element).parent().parent().has(selector)[0]) {
                    foundType = type;
                    return false; //break
                }
            });
            return foundType;
        }

        function openLink(element, open_in_background) {
            var url = $(element).attr('href');
            $(element).css( "color", "" );
            var index = newLinks.indexOf(element);
            if (index > -1) {
                newLinks.splice(index, 1);
            }
            visitedLinks[url] = getType(element);
            storage.set();
            url = 'http://www.isnichwahr.de' + url;
            if (isTampermonkey) {
                GM_openInTab(url, {'active': !open_in_background});
            } else {
                GM_openInTab(url, open_in_background);
            }
        }

        // remove upper pagination
        $('.view-link-liste .text-center:first').remove();
        // add buttons instead
        controls = $('<ul class="pagination"></ul>');
        $('<div class="text-center"><div/>').prependTo('.view-link-liste').append(controls);
        var uuid = storageUri.split('/').pop();
        var $uuidInput = $('<input type="text">').attr('size', uuid.length).val(uuid).change(function (event) {
            var oldUri = storageUri;
            storageUri='https://api.myjson.com/bins/' + $uuidInput.val();
            storage.get().done( function(data) {
                localStorage.setItem("visitedLinksUUID", storageUri);
                localStorage.setItem("visitedLinks", JSON.stringify({}));
                window.location.reload();
            }).fail( function () {
                alert("invalid id");
                storageUri = oldUri;
                uuid = storageUri.split('/').pop();
                $uuidInput.val(uuid);
            });
        });
        $('<li></li>').css("vertical-align","top").css("padding", "5px 10px")
                .html($uuidInput).appendTo(controls);
        // populate buttons
        function addButton(text, callback) {
            $('<li><a class="hans">' + text + '</a></li>').appendTo(controls).click(callback);
        }
        addButton('Mark all as seen!', function() {
            $currentLinks.each( function(i, element) {
                var url = $(this).attr('href');
                $(this).css( "color", "" );
                visitedLinks[url] = getType(this);

            });
            storage.set();
            updateVisited();
        });
        addButton('Open all pics!', function() {
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
        addButton('Open all videos!', function() {
            var i = newLinks.length;
            var opened = 0;
            while (i--) {
                var link = newLinks[i];
                if (opened < 5 && (getType(link) === "video")) {
                    opened++;
                    openLink(link, true);
                }
            }
        });
        addButton('Open all new!', function() {
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
}
