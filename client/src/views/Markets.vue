<template>
  <div>
    <EditableItems :config="config" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import EditableItems, { EditableConfig } from '@/components/EditableItems.vue';
import { marketService } from '@/api';

@Component({
  components: { EditableItems }
})
export default class Markets extends Vue {
  config: EditableConfig = {
    document: 'Pazaryeri',
    props: {
      name: ['İsim'],
      marginOfSafety: ['Güvenlik marjı %', 'number'],
      minProfit: ['Minimum Kar %', 'number'],
      baseMarket: ['Fiyatlandırma Baz', 'select', marketService, 'name'],
      competePrice: ['Rekabet Değeri (TL)', 'number'],
      aggresiveProfit: ['Agresif Kar Oranı %', 'number']
    },
    displayProps: [
      'name',
      'marginOfSafety',
      'minProfit',
      'competePrice',
      'baseMarket'
    ],
    apiService: marketService
  };
}
</script>
