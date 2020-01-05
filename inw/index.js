// ==UserScript==
// @name         isnichwahrExtension
// @namespace    http://jandob.com
// @version      3.0
// @description  extends isnichwahr functionality
// @author       jandob
// @match        https://www.isnichwahr.de
// @grant        GM_openInTab
// @grant        GM_info
// @run-at       document-end
// @downloadURL  https://github.com/jandob/userscripts/raw/master/isnichwahr.de.user.js
// ==/UserScript==
import Vue from 'vue'
import App from './App.vue'

import infiniteScroll from 'vue-infinite-scroll'
Vue.use(infiniteScroll)

import vueScrollTo from 'vue-scrollto' 
Vue.use(vueScrollTo)

import VueWaypoint from 'vue-waypoint'
Vue.use(VueWaypoint)

function inIframe () {
    try {
        return window.self !== window.top
    } catch (e) {
        return true;
    }
}

if (!inIframe() && window.location.href == 'https://www.isnichwahr.de/') {
    document.body.outerHTML = '<body><div id="app"></div></body>'
    const app = new Vue({
      render: h => h(App)
    }).$mount('#app')
}
