<template>
  <div class="container" 
    v-infinite-scroll="loadMore" 
    infinite-scroll-disabled="busy" 
    infinite-scroll-distance="10"
  >
    <template v-for="link in links">
      <div v-if="link.loading">Loading...</div>
      <div v-else v-html="link.template"></div>
    </template>
  </div>
</template>

<script>
import $ from 'jquery';
// returns array of promises, each failed request (fetch or parsing) returns an empty array
async function fetchLinks(pageNo) {
    let links = await fetch(`https://www.isnichwahr.de/?page={pageNo}`)
        .then(x => x.text())
        .then(
            x => $(x).find('.view-link-liste tbody tr td:nth-child(3) a')
                .toArray().map(el => el.href)
        )

    let promises = links.map((l) => fetch(l)
        .then(x => x.text())
        .then(x => {
            return {link: l, content: x}
        }))
        .map(p => p.then((r) => {
            let result = $(r.content).find('.panel-panel.left')
                .find('.node-link-image, .node-live-image, .node-link-video')
            if (result.length == 0) {
                console.log("warn no element found", r)
                unsafeWindow.l = r
            } 
            return result.toArray()
        }))
        .map(p => p.catch(e => [])) // failed fetch
    return promises
}
// yields individual link elements 
// TODO call fetchLinks if we are close to running out of values
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
  name: 'PresetSelection',
  props: {
  },
  data: () => ({
    links: [],
    gen: null,
    busy: false
  }),
  methods: {
    loadMore() {
      console.log("loadMore")
      this.busy = true;
      let link = {loading: true, template: null}
      this.links.push(link)
      this.gen.next().then((l) => {
        link.loading = false
        link.template = l.value.outerHTML
        this.busy = false
      })
    }
  },
  mounted() {
    this.gen = linksGen()
  },
}
</script>

<style lang="scss">

</style>
