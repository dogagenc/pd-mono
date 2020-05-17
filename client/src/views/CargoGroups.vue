<template>
  <div>
    <EditableItems :config="config" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import EditableItems, { EditableConfig } from '@/components/EditableItems.vue';
import { cargoGroupService, supplierService } from '@/api';

@Component({
  components: { EditableItems }
})
export default class CargoGroups extends Vue {
  config: EditableConfig = {
    document: 'Kargo Grubu',
    props: {
      name: ['Grup İsmi'],
      cargoCompanies: ['Kargo Firmaları'],
      suppliers: ['Tedarikçiler']
    },
    displayProps: ['name', 'cargoCompanies'],
    groupedProps: {
      cargoCompanies: {
        name: ['Firma İsmi'],
        price: ['Fiyat', 'number']
      },
      suppliers: {
        supplierId: ['Tedarikçi', 'select', supplierService],
        price: ['Fiyat', 'number']
      }
    },
    apiService: cargoGroupService
  };
}
</script>
