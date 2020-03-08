import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '@/views/Home.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/products/:page?',
    name: 'Ürünler',
    component: () =>
      import(/* webpackChunkName: "products" */ '@/views/Products.vue')
  },
  {
    path: '/product/:id',
    name: 'Ürün',
    component: () =>
      import(/* webpackChunkName: "product" */ '@/views/Product.vue')
  },
  {
    path: '/platforms',
    name: 'Platformlar',
    component: () =>
      import(/* webpackChunkName: "platforms" */ '@/views/Platforms.vue')
  },
  {
    path: '/suppliers',
    name: 'Tedarikçiler',
    component: () =>
      import(/* webpackChunkName: "suppliers" */ '@/views/Suppliers.vue')
  },
  {
    path: '/markets',
    name: 'Pazar Yerleri',
    component: () =>
      import(/* webpackChunkName: "markets" */ '@/views/Markets.vue')
  },
  {
    path: '/product-categories',
    name: 'Ürün Kategorileri',
    component: () =>
      import(
        /* webpackChunkName: "product-categories" */ '@/views/ProductCategories.vue'
      )
  },
  {
    path: '/cargo-groups',
    name: 'Kargo Grupları',
    component: () =>
      import(/* webpackChunkName: "cargo-groups" */ '@/views/CargoGroups.vue')
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
