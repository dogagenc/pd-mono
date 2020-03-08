<template>
  <div>
    <EditableItems :config="config" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import EditableItems, { EditableConfig } from '@/components/EditableItems.vue';
import { supplierService } from '@/api';

@Component({
  components: { EditableItems }
})
export default class Suppliers extends Vue {
  config: EditableConfig = {
    document: 'Tedarikçi',
    props: {
      name: ['İsim'],
      publicID: ['ID'],
      bussinessName: ['Ticari Unvanı'],
      address: ['Fatura Adresi'],
      taxOffice: ['Vergi Dairesi'],
      taxNumber: ['Vergi Numarası'],
      contacts: ['İrtibat Kişisi'],
      banks: ['Bankalar']
    },
    groupedProps: {
      contacts: {
        name: ['İsim'],
        phone: ['Telefon']
      },
      banks: {
        name: ['İsim'],
        no: ['Hesap No'],
        branch: ['Şube'],
        iban: ['IBAN']
      }
    },
    displayProps: ['publicID', 'name', 'bussinessName', 'taxOffice'],
    apiService: supplierService
  };
}
</script>
