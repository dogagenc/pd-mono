<template>
  <div>
    <EditableItems :config="config" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import EditableItems, { EditableConfig } from '@/components/EditableItems.vue';
import { productCategoryService, marketService } from '@/api';

@Component({
  components: { EditableItems }
})
export default class ProductCategories extends Vue {
  config: EditableConfig = {
    document: 'Ürün Kategorisi',
    props: {
      name: ['Kategori'],
      marketMappings: ['Pazaryeri karşılıkları']
    },
    displayProps: ['name'],
    groupedProps: {
      marketMappings: {
        marketId: ['Pazaryeri', 'select', marketService],
        category: ['Kategori'],
        feeRate: ['Komisyon Oranı %', 'number']
      }
    },
    apiService: productCategoryService
  };
}
</script>
