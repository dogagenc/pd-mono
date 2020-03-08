<template>
  <div class="sidebar">
    <md-list>
      <md-list-item to="/">
        <md-icon>home</md-icon>
        <span class="md-list-item-text">Import / Export</span>
      </md-list-item>
      <md-list-item to="/products">
        <md-icon>view_headline</md-icon>
        <span class="md-list-item-text">Ürünler</span>
      </md-list-item>
      <md-list-item to="/platforms">
        <md-icon>web</md-icon>
        <span class="md-list-item-text">Platformlar</span>
      </md-list-item>
      <md-list-item to="/suppliers">
        <md-icon>swap_horiz</md-icon>
        <span class="md-list-item-text">Tedarikçiler</span>
      </md-list-item>
      <md-list-item to="/markets">
        <md-icon>storefront</md-icon>
        <span class="md-list-item-text">Pazar Yerleri</span>
      </md-list-item>
      <md-list-item to="/product-categories">
        <md-icon>category</md-icon>
        <span class="md-list-item-text">Ürün Kategorileri</span>
      </md-list-item>
      <md-list-item to="/cargo-groups">
        <md-icon>local_shipping</md-icon>
        <span class="md-list-item-text">Kargo Grupları</span>
      </md-list-item>
    </md-list>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Sidebar extends Vue {}
</script>

<style lang="scss">
.sidebar {
  padding-top: 6px;
}
</style>
