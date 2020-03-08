<template>
  <div class="md-layout section">
    <div class="md-layout-item">
      <md-list>
        <md-subheader>Ürün</md-subheader>
        <md-list-item v-for="prop in exportableProps" :key="prop.sampleValue">
          <md-checkbox v-model="prop.selected">{{
            prop.description
          }}</md-checkbox>
        </md-list-item>
        <md-subheader>Hesaplama</md-subheader>
        <div
          class="md-layout list-a"
          v-for="prop in exportableCalculations"
          :key="prop.type + prop.key"
        >
          <div class="md-layout-item">
            <md-checkbox v-model="prop.selected">{{
              prop.description
            }}</md-checkbox>
          </div>
          <div class="md-layout-item">
            <md-field v-if="prop.model" class="select-field" style="flex:1">
              <md-select v-model="prop.selectedName">
                <md-option
                  v-for="item in prop.options"
                  :key="item.short"
                  :value="item.short"
                >
                  {{ item.name }}
                </md-option>
              </md-select>
            </md-field>
            <md-checkbox v-if="prop.hasAggresive" v-model="prop.aggressiveValue"
              >Aggressive</md-checkbox
            >
          </div>
        </div>
      </md-list>
    </div>
    <div class="md-layout-item">
      <div class="xml-view">
        <span>...</span>
        <div v-for="prop in selectedProps" :key="prop.type + prop.key">
          <code class="code-xml">
            <span>{{ getXmlKey(prop) }}</span>
            <span class="val">{{ prop.sampleValue }}</span>
            <span>{{ getXmlKey(prop, true) }}</span>
          </code>
        </div>
        <span>...</span>
      </div>
    </div>
    <md-button class="md-primary md-raised" @click="exportXml"
      >Export</md-button
    >
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { downloadXmlBySelections, marketService, platformService } from '@/api';
import partition from 'lodash/partition';

const exportTypes = ['tedarikci', 'platform', 'pazaryeri'];
const exportableProps = [
  {
    type: 'prop',
    key: 'name',
    description: 'Ürün İsmi',
    xmlKey: 'Product',
    sampleValue: 'Örnek Ürün',
    selected: true
  },
  {
    type: 'prop',
    key: 'sku',
    description: 'SKU',
    xmlKey: 'SKU',
    sampleValue: '8243645247',
    selected: true
  },
  {
    type: 'prop',
    key: 'description',
    description: 'Açıklama',
    xmlKey: 'Aciklama',
    sampleValue: '"<p>Test</p>"',
    selected: false
  },
  {
    type: 'prop',
    key: 'category',
    description: 'Kategori',
    xmlKey: 'Category',
    sampleValue: 'Erkek Parfüm',
    selected: false
  },
  {
    type: 'prop',
    key: 'regularPrice',
    description: 'Normal Fiyat',
    xmlKey: 'RegularPrice',
    sampleValue: 1050,
    selected: false
  },
  {
    type: 'prop',
    key: 'brand',
    description: 'Marka',
    xmlKey: 'Marka',
    sampleValue: 'Örnek Marka',
    selected: false
  }
];

const exportableCalculations = [
  {
    type: 'tedarikci',
    key: 'minSupplier',
    description: 'Min. toplam maliyet veren tedarikci',
    xmlKey: 'MinTedarikci',
    sampleValue: 'Ornek Tedarikci 1',
    selected: false
  },
  {
    type: 'tedarikci',
    key: 'minPrice',
    description: 'Minimun toplam maliyet',
    xmlKey: 'MinToplamMaliyet',
    sampleValue: 1000,
    selected: true
  },
  {
    type: 'platform',
    key: 'sellPrice',
    description: 'Platform Satis fiyati',
    xmlKey(name: string) {
      return `${name}Satis`;
    },
    model: platformService,
    selectedName: '',
    options: [],
    sampleValue: 1200,
    selected: false
  },
  {
    type: 'pazaryeri',
    key: 'sellPrice',
    description: 'Pazaryeri Satis fiyati',
    xmlKey(name: string) {
      return `${name}Satis`;
    },
    model: marketService,
    selectedName: '',
    options: [],
    sampleValue: 1199,
    selected: false,
    hasAggresive: true,
    aggressiveValue: false
  }
];

@Component
export default class Export extends Vue {
  exportTypes = exportTypes;
  exportType = 'tedarikci';
  exportableProps = exportableProps;
  exportableCalculations = exportableCalculations;

  async created() {
    for (const calc of this.exportableCalculations) {
      if (!calc.model) continue;

      const items = (await calc.model.getAll()) as any;

      calc.options = items.map((item: any) => {
        return {
          short: item.name.replace(/\s/g, ''),
          name: item.name
        };
      }) as any;
    }
  }

  get selectedProps() {
    return [
      ...this.exportableProps.filter(p => p.selected),
      ...this.exportableCalculations.filter(
        c => c.selected && (c.model ? c.selectedName : true)
      )
    ];
  }

  exportXml() {
    const selected = this.selectedProps.map((a: any) => {
      const item: any = {
        type: a.type,
        key: a.key
      };

      if (a.model) {
        const aggressive = a.aggressiveValue;
        if (a.selectedName) {
          const name = aggressive
            ? a.selectedName + 'Aggressive'
            : a.selectedName;

          item['xmlKey'] = a.xmlKey(name);
          item['selectedName'] = name;
        }
      } else {
        item['xmlKey'] = a.xmlKey;
      }

      return item;
    });

    const [props, calculations] = partition(selected, i => i.type === 'prop');
    downloadXmlBySelections(props, calculations);
  }

  getXmlKey(prop: any, end = false) {
    let key = prop.xmlKey;

    if (typeof prop.xmlKey === 'function') {
      const name = prop.aggressiveValue
        ? prop.selectedName + 'Aggressive'
        : prop.selectedName;

      key = prop.xmlKey(name);
    }

    return `<${end ? '/' : ''}${key}>`;
  }
}
</script>

<style lang="scss" scoped>
.code-xml {
  color: #73a4f7;

  .val {
    color: white;
  }
}

.list-a {
  padding: 4px 16px;
}

.xml-view {
  margin-top: 5px;
  background-color: #333;
  padding: 16px;
  border-radius: 3px;
  color: rgba(white, 0.7);
}
</style>
