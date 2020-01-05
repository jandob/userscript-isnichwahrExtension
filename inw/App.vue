<template>
  <div class="container" 
    v-infinite-scroll="loadMore" 
    infinite-scroll-disabled="busy" 
    infinite-scroll-distance="100"
  >
    <template v-for="(link, index) in links">
      <div v-if="link.loading">Loading...</div>
      <div v-else v-html="link.template"
        v-waypoint="{active: true, callback: (args) => onWaypoint(index, args)}"
        ref="links">
      </div>
    </template>
  </div>
</template>

<script>
import $ from 'jquery';
// returns array of promises, each failed request (fetch or parsing) returns an empty array
async function fetchLinks(pageNo) {
    const resp = await fetch(`https://www.isnichwahr.de/?page=${pageNo}`)
    const body = await resp.text()
    const links = $(body).find('.view-link-liste tbody tr td:nth-child(3) a')
        .toArray().map(el => el.href)

    const requests = links.map(async l => {
      try {
        const resp = await fetch(l)
        const body = await resp.text()
        const result = $(body).find('.panel-panel.left')
            .find('.node-link-image, .node-live-image, .node-link-video')
        if (result.length == 0) {
            console.log("WARN: no element found at link", l)
        } 
        return result.toArray()
      } catch {
        return []
      }
    })
    return requests
}

// yields individual link elements 
async function* linksGen() {
    let index = 0
    while(true) {
      let proms = await fetchLinks(index)
      index++
      for await (let elArr of proms) {
          for (let el of elArr) {
              yield el
          }
      }
    }
}

export default {
  name: 'App',
  props: {
  },
  data: () => ({
    links: [],
    gen: null,
    busy: false,
    currentIndex: 0
  }),
  created() {
    this.keyHandler = (e) => {
      if (e.key == "j") {
        this.scrollTo(this.currentIndex + 1) 
      } else if (e.key == "k" && this.currentIndex > 0) {
        this.scrollTo(this.currentIndex - 1) 
      }
    }
    window.addEventListener('keyup', this.keyHandler);
  },
  beforeDestroy() {
    window.removeEventListener('keyup', this.keyHandler);
  },
  methods: {
    async loadMore() {
      this.busy = true;
      let link = {loading: true, template: null}
      this.links.push(link)
      const l = await this.gen.next()
      link.loading = false
      link.template = l.value.outerHTML
      this.busy = false
    },
    scrollTo(index) {
      if (!this.$refs.links) {
        // First render, the element is not there yet
      } else {
        if (index >= this.$refs.links.length) {
          this.loadMore().then(() => this.scrollTo(index))
          return
        }
        const el = this.$refs.links[index]
        const options = {
          //container: '#container',
          easing: 'ease-in',
          //offset: -60,
          force: true,
          cancelable: true,
          //onStart: (element) => {},
          onDone: (el) => {
            this.currentIndex = index
          },
          //onCancel: () => {},
          x: false,
          y: true
        }
        const cancelScroll = this.$scrollTo(el, 200, options)
        this.currentIndex = index
      }
    },
    onWaypoint(index, {el, going, direction}) {
      if (going === this.$waypointMap.GOING_OUT && direction === this.$waypointMap.DIRECTION_TOP) {
        this.currentIndex = index + 1
      }
      if (going === this.$waypointMap.GOING_IN && direction === this.$waypointMap.DIRECTION_BOTTOM) {
        this.currentIndex = index + 1
      }
    },
  },
  mounted() {
    this.gen = linksGen()
  },
}
</script>

<style lang="scss">

</style>
