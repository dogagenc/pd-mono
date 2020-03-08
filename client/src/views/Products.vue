<template>
  <div>
    <EditableItems :config="config" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import EditableItems, { EditableConfig } from '@/components/EditableItems.vue';
import {
  productService,
  platformService,
  marketService,
  productCategoryService,
  supplierService,
  cargoGroupService
} from '@/api';

@Component({
  components: { EditableItems }
})
export default class Products extends Vue {
  config: EditableConfig = {
    document: 'Ürünler',
    paginate: true,
    subDocs: true,
    subDocTarget: '/product/',
    subDocItem: 'sku',
    subDocInput: true,
    filters: [
      {
        name: 'Kategori',
        key: 'category',
        service: productCategoryService,
        selectBy: 'name'
      }
    ],
    props: {
      name: ['İsim'],
      brand: ['Marka'],
      sku: ['SKU'],
      skus: ["Diğer SKU'lar"],
      regularPrice: ['Normal Fiyat'],
      prices: ['Fiyatlar'],
      category: ['Kategori', 'select', productCategoryService, 'name'],
      cargoGroup: ['Kargo grubu', 'select', cargoGroupService, 'name'],
      description: ['Açıklama', 'textarea'],
      imageCount: ['Görsel Sayısı', 'number'],
      imageFormat: ['Görsel Formatı'],
      enabledPlatformIds: ['Satış Platformları'],
      enabledMarketIds: ['Satış Pazaryerleri'],
      marketUrls: ['Satış Linkleri'],
      supplierInfos: ['Tedarikçi Bilgileri']
    },
    groupedProps: {
      skus: {
        value: ['SKU']
      },
      prices: {
        source: ['Kaynak', 'select', marketService, 'name'],
        value: ['Fiyat(lar)']
      },
      enabledPlatformIds: {
        value: ['Platform', 'select', platformService]
      },
      enabledMarketIds: {
        value: ['Pazaryeri', 'select', marketService]
      },
      marketUrls: {
        name: ['İsim'],
        url: ['Url']
      },
      supplierInfos: {
        supplierPublicId: ['Tedarikçi', 'select', supplierService, 'publicID'],
        price: ['Fiyat', 'number'],
        cargoPrice: ['Kargo Fiyati', 'number'],
        vatPercentage: ['KDV Yüzdesi', 'number'],
        maturity: ['Vade', 'number'],
        deliveryTime: ['Teslimat Süresi', 'number']
      }
    },
    displayProps: ['sku', 'name', 'brand', 'category'],
    apiService: productService
  };
}
</script>
