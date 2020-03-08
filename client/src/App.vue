<template>
  <div id="app">
    <md-app md-mode="reveal">
      <md-app-toolbar class="md-primary">
        <md-button
          class="md-icon-button mobile-only"
          @click="menuVisible = !menuVisible"
        >
          <md-icon>menu</md-icon>
        </md-button>
        <span class="md-title" style="flex: 1;">
          {{ $route.params.slug || $route.name || '' }}
        </span>
      </md-app-toolbar>

      <md-app-drawer md-permanent="full" :md-active.sync="menuVisible">
        <Sidebar />
      </md-app-drawer>

      <md-app-content>
        <router-view />
      </md-app-content>
    </md-app>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Sidebar from '@/partials/Sidebar.vue';

@Component({
  components: { Sidebar }
})
export default class App extends Vue {
  menuVisible = false;
}
</script>

<style lang="scss">
@import '~@/styles/common';
</style>
