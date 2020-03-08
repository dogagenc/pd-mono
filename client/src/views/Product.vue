<template>
  <div class="product">
    <div v-if="product">
      <div class="md-layout md-gutter">
        <div class="md-layout-item md-size-25 image-side">
          <img :src="imageSource" :alt="product.name" />
        </div>
        <div class="md-layout-item">
          <h3 class="md-headline">{{ product.name }}</h3>
          <h4 class="md-subheading">
            {{ product.category }} > {{ product.brand }}
          </h4>
          <p class="md-body-1">{{ product.description }}</p>
          <md-divider></md-divider>
          <div class="md-layout pd-section">
            <div class="md-layout-item md-size-15">
              <h5 class="md-subheading">Fiyatlar</h5>
            </div>
            <div
              class="md-layout-item"
              v-for="price in prices"
              :key="price.source"
            >
              <md-card>
                <md-card-header>
                  {{ price.source }}
                </md-card-header>
                <md-card-content>
                  <md-chip v-for="value in price.values" :key="value"
                    >{{ value }} TL</md-chip
                  >
                </md-card-content>
              </md-card>
            </div>
          </div>
          <div class="md-layout pd-section">
            <div class="md-layout-item md-size-15">
              <h5 class="md-subheading">Platformlar</h5>
            </div>
            <div class="md-layout-item">
              <md-chip
                v-for="platform in enabledPlatforms"
                :key="platform.value"
                >{{ platform.value }}</md-chip
              >
            </div>
          </div>
          <div class="md-layout pd-section">
            <div class="md-layout-item md-size-15">
              <h5 class="md-subheading">Pazaryerleri</h5>
            </div>
            <div class="md-layout-item">
              <md-chip
                v-for="platform in enabledMarkets"
                :key="platform.value"
                >{{ platform.value }}</md-chip
              >
            </div>
          </div>
          <div class="md-layout pd-section">
            <div class="md-layout-item md-size-15">
              <h5 class="md-subheading">Kargo Grubu</h5>
            </div>
            <div class="md-layout-item">
              {{ product.cargoGroup }}
            </div>
          </div>
        </div>
      </div>
      <md-divider class="section-divider"></md-divider>
      <div class="pd-calculations">
        <div class="md-layout">
          <div
            class="md-layout-item"
            v-for="calculation in calculations"
            :key="calculation.name"
          >
            <md-card>
              <md-list class="md-double-line">
                <md-subheader class="capitalize"
                  >{{ calculation.name }} Hesaplama</md-subheader
                >
                <md-list-item
                  v-for="(value, key) in calculation.values"
                  :key="value"
                >
                  <div class="md-list-item-text">
                    <span>{{ key }}</span>
                    <span>{{ value }}</span>
                  </div>
                </md-list-item>
                <template v-if="calculation.errors">
                  <md-subheader class="item-warn">Hatalar</md-subheader>
                  <md-list-item
                    v-for="error in calculation.errors"
                    :key="error.reason"
                  >
                    <div class="md-list-item-text">
                      <span class="item-warn">{{ error.from }}</span>
                      <span class="item-warn--light">{{ error.reason }}</span>
                    </div>
                  </md-list-item>
                </template>
              </md-list>
            </md-card>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="notFound">
      <md-empty-state
        md-rounded
        md-icon="search"
        md-label="Ürün bulunamadı!"
        md-description="Bu SKU ile eşleşen bir ürün bulunamadı!"
      >
      </md-empty-state>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Product, Platform, Market } from '@/types/app';
import { productService, platformService, marketService } from '@/api';

@Component
export default class ProductView extends Vue {
  product: Product | null = null;
  platforms: Platform[] = [];
  markets: Market[] = [];
  notFound = false;

  async created() {
    this.product = await productService.get(this.$route.params.id);

    if (!this.product) {
      this.notFound = true;
      return;
    }

    this.platforms = await platformService.getAll();
    this.markets = await marketService.getAll();
  }

  get enabledPlatforms() {
    if (!this.platforms.length || !this.product) return [];

    return this.product.enabledPlatformIds.map(id => {
      return {
        value: this.platforms.find(platform => platform.id === id.value)?.name
      };
    });
  }

  get enabledMarkets() {
    if (!this.markets.length || !this.product) return [];

    return this.product.enabledMarketIds.map(id => {
      return {
        value: this.markets.find(market => market.id === id.value)?.name
      };
    });
  }

  get imageSource() {
    const base = 'http://demowebsitesi.com/000/';

    return base + (this.product?.sku || '') + '.jpg';
  }

  get prices() {
    if (!this.product) return [];

    const prices = this.product.prices.map(price => ({
      source: price.source,
      values: String(price.value)
        .split(',')
        .map(Number)
        .sort((a, b) => a - b)
    }));

    prices.push({
      source: 'Normal Fiyat',
      values: [this.product.regularPrice]
    });

    return prices;
  }

  get calculations() {
    if (!this.product) return [];

    const calculations = this.product.calculations.map(calculation => {
      const values: { [key: string]: any } = {};
      let name;
      const errors = calculation.result.errors;

      if (calculation.result.type === 'keys') {
        name = 'Tedarikci';
        values['Minimum Toplam Maliyet'] = `${calculation.result.minPrice} TL`;
        values['Tedarikçi'] = calculation.result.minSupplier;
      } else {
        name = calculation.type;
        const items =
          (calculation.type === 'pazaryeri'
            ? calculation.result.markets
            : calculation.result.platforms) || [];

        items.forEach(item => {
          const sellPrice = item.base
            ? `${item.sellPrice} TL (${item.base})`
            : `${item.sellPrice} TL`;
          values[`${item.name} Satış`] = sellPrice;
        });
      }

      return { name, values, errors };
    });

    return calculations;
  }
}
</script>

<style lang="scss">
@import '~vue-material/dist/theme/engine';

.image-side {
  img {
    max-width: 100%;
  }
}

.pd-section {
  margin-top: 15px;
}

.section-divider {
  margin: 30px 0;
}

.md-card-content {
  .md-chip {
    margin-bottom: 8px;
  }
}

.item-warn {
  color: md-get-palette-color(red, A200) !important;
}

.item-warn--light {
  color: md-get-palette-color(red, 300) !important;
}
</style>
