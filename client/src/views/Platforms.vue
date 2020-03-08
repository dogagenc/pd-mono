<template>
  <div>
    <EditableItems :config="config" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import EditableItems, { EditableConfig } from '@/components/EditableItems.vue';
import { platformService, marketService } from '@/api';

@Component({
  components: { EditableItems }
})
export default class Platforms extends Vue {
  config: EditableConfig = {
    document: 'Platform',
    props: {
      name: ['İsim'],
      marginOfSafety: ['Güvenlik marjı %', 'number'],
      specialProductRate: ['Ürün kontrol %', 'number'],
      minProfit: ['Minimum Kar %', 'number'],
      competeRate: ['Rekabet Oranı %', 'number'],
      baseMarket: ['Fiyatlandırma Baz', 'select', marketService, 'name']
    },
    displayProps: [
      'name',
      'marginOfSafety',
      'minProfit',
      'specialProductRate',
      'baseMarket'
    ],
    apiService: platformService
  };
}
</script>
