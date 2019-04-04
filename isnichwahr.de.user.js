// ==UserScript==
// @name         isnichwahrExtension
// @namespace    http://jandob.com
// @version      2.4
// @description  extends isnichwahr functionality
// @author       jandob
// @match        https://www.isnichwahr.de/*
// @grant        GM_openInTab
// @grant        GM_info
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require      https://unpkg.com/vue
// @run-at       document-end
// @downloadURL  https://github.com/jandob/userscripts/raw/master/isnichwahr.de.user.js
// ==/UserScript==

/* jshint ignore:start */
var inline_src = (<><![CDATA[
/* jshint ignore:end */
/* jshint esnext: false */
/* jshint esversion: 6 */
/* jshint asi: true */

const isTampermonkey = GM_info.scriptHandler === 'Tampermonkey'
const $ = jQuery

class Storage {
    async init(initialvalue, storageUri) {
        this.baseUrl = 'https://api.myjson.com/bins'
        if (storageUri) {
          this.storageUri = storageUri
        } else {
          this.storageUri = localStorage.getItem('synchronized_storage_uri')
        }
        if (!this.storageUri) {
           console.log('init new storage')
           this.storageUri = await fetch(this.baseUrl, {
             method: "POST",
             body: JSON.stringify(initialvalue),
             headers: new Headers({
                'Content-Type':"application/json; charset=utf-8",
                'Accept': 'application/json'
             })
           }).then(response => response.json())
             .then(data => data.uri)
        }
        // we have a storage uri now
        localStorage.setItem('synchronized_storage_uri', this.storageUri)

        let data = await fetch(this.storageUri)
          .then(response => response.json())
        localStorage.setItem('synchronized_storage', JSON.stringify(data))
        this.synced = true
        console.log("finished init",this.storageUri)
    }
    _push_request(val) {
      return fetch(this.storageUri, {
         method: "PUT",
         body: JSON.stringify(val),
         headers: new Headers({
            'Content-Type':"application/json; charset=utf-8",
            'Accept': 'application/json'
         })
      })
    }
    // pushes to storage, makes sure the latest push is executed
    _push (val) {
      if (this.currentRequest) {
        this.pendingRequest = val
        return
      }
      this.currentRequest = true
      this._push_request(val).then( () => {
         console.log("push done")
         this.currentRequest = false
         if (this.pendingRequest) {
           this._push(this.pendingRequest)
           this.pendingRequest = false
         }
      })
    }
    set(val) {
      localStorage.setItem('synchronized_storage', JSON.stringify(val))
      this._push(val)
    }
    get() {
      return JSON.parse(localStorage.getItem('synchronized_storage'))
    }
}
$('.service-links').remove()
// matches individual links
if (window.location.href.indexOf('isnichwahr.de/r') > -1) {
    $('.navbar').remove()
    $('body').attr('style', 'padding-top: 10px !important')
    $('div.panel-panel.top').remove()

    $('div.panel-panel.right').remove()
    $('div.panel-panel.left').removeClass (function (index, css) {
        return (css.match(/(^|\s)col-\S+/g) || []).join(' ')
    })
    $('div.panel-panel.left').addClass('col-xs-12 col-md-10 col-md-offset-1')
}
function getType(element) {
            var elementTypes = {
                '.fa-youtube': 'video',
                '.fa-film': 'gif',
                '.glyphicon-picture': 'pic'
            }
            var foundType = false
            $.each(elementTypes, function(selector, type) {
                if ($(element).parent().parent().has(selector)[0]) {
                    foundType = type
                    return false //break
                }
            })
            return foundType
        }
function openInTab(url, open_in_background) {
    if (isTampermonkey) {
        GM_openInTab(url, {'active': !open_in_background})
    } else {
        GM_openInTab(url, open_in_background)
    }
}

async function insertApp() {
    const links = document.querySelectorAll('.view-link-liste tbody tr td:nth-child(3) a')
    let linkListRaw = []
    links.forEach((element, i) => {
        linkListRaw[i] = {
            href: element.href,
            type: getType(element),
            visited: false,
            text: element.text
        }
    })
    const body = document.getElementsByTagName('body')[0];
    body.outerHTML = `
    <style>
    ul {
      width:760px;
      overflow:hidden;
    }
    li {
      line-height:1.5em;
      float:left;
      display:inline;
    }
    .double li  { width:50%;}
    .buttons li {
        float: left;
        padding: 5px 10px;
        background-color: #ffffff;
        border: 1px solid #dddddd;
        margin-left: -1px;
    }
    </style>
      <body>
      <div id='app'>
         <ul class="buttons">
          <li><a href="/list">1</a></li>
          <li v-for="page in [1,2,3,4]">
            <a v-bind:href="'/list?page='+page">{{page+1}}</a>
          </li>
        </ul>
        <ul class="buttons">
          <li style="vertical-align: top; padding: 5px 10px;">
            <input v-model="uuid" type="text" size="0">
          </li>
          <li><a v-on:click='markAll'>Mark all as seen!</a></li>
          <li><a v-on:click='openLinks("pic")'>Open all pics!</a></li>
          <li><a v-on:click='openLinks("gif")'>Open all gifs!</a></li>
          <li><a v-on:click='openLinks("video")'>Open all videos!</a></li>
          <li><a v-on:click='openLinks("")'>Open all new!</a></li>
        </ul>
        <h2>other</h2>
        <ul class="double">
          <li v-for="link in other">
            <a v-on:click.prevent="openLink(link)"
               v-bind:style="{color: link.visited ? 'red' : ''}"
               v-bind:href="link.href"
            > {{ link.text }} </a>
          </li>
        </ul>
        <h2>pics</h2>
        <ul class="double">
          <li v-for="link in pics">
            <a v-on:click.prevent="openLink(link)"
               v-bind:style="{color: link.visited ? 'red' : ''}"
               v-bind:href="link.href"
            > {{ link.text }} </a>
          </li>
        </ul>
        <h2>videos</h2>
        <ul class="double">
          <li v-for="link in videos">
            <a v-on:click.prevent="openLink(link)"
               v-bind:style="{color: link.visited ? 'red' : ''}"
               v-bind:href="link.href"
            > {{ link.text }} </a>
          </li>
        </ul>
        <h2>gifs</h2>
        <ul class="double">
          <li v-for="link in gifs">
            <a v-on:click.prevent="openLink(link)"
               v-bind:style="{color: link.visited ? 'red' : ''}"
               v-bind:href="link.href"
            > {{ link.text }} </a>
          </li>
        </ul>
      </div>
      </body>
    `

    const storage = new Storage()

    const appIns = new Vue({
      el: '#app',
      data: {
        uuid: '',
        linkList: linkListRaw,
      },
      watch: {
        linkList: {
            handler: (old, newVal) => {
                let visited = new Set(storage.get())
                let visitedThis = newVal.filter( x => x.visited).map(x => x.href)
                storage.set([...new Set([...visited, ...visitedThis])]); // array union
            },
            deep: true
        },
        uuid: function() {
            if (storage.storageUri != this.uuid) {
                storage.init([], this.uuid)
            }
        }
      },
      computed: {
          pics: function () { return this.linkList.filter(x => x.type == "pic")},
          gifs: function () { return this.linkList.filter(x => x.type == "gif")},
          videos: function () { return this.linkList.filter(x => x.type == "video")},
          other: function () { return this.linkList.filter(x => x.type === false)}
      },
      methods: {
        markAll: function () {
            this.linkList.forEach( x => x.visited = true)
        },
        linksOfType: function(type) {
            return this.linkList.filter( x => x.type == type)
        },
        openLinks: function (type) {
            let opened = 0
            for (let link of this.linkList.filter( x => !x.visited)) {
                if (opened == 5) {
                  break
                }
                if (link.type === type || type === "") {
                  link.visited = true
                  openInTab(link.href, true)
                  opened++
                }
            }
        },
        openLink: link => {openInTab(link.href, false); link.visited = true}
      }
    })

    await storage.init([])
    let visitedLinks = new Set(storage.get())
    for (let link of appIns.linkList) {
        if (visitedLinks.has(link.href)) {
            link.visited = true;
        }
    }

    appIns.uuid = storage.storageUri
}
// matches link list
if (window.location.href.indexOf('isnichwahr.de') > -1) {
    insertApp()
}

/* jshint ignore:start */
]]></>).toString();
var c = Babel.transform(inline_src, {presets: ['es2016', 'es2017']});
eval(c.code);
/* jshint ignore:end */
