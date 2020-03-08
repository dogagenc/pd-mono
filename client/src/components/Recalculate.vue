<template>
  <div class="md-layout md-gutter">
    <div class="md-layout-item">
      <md-button
        class="md-raised md-primary"
        @click="recalculate"
        :disabled="status && status.active"
        >Tum urunleri yeniden hesapla</md-button
      >
    </div>
    <div class="md-layout-item">
      <md-card v-if="status">
        <md-card-header>
          <div class="md-title">{{ status.finished }} / {{ status.total }}</div>
        </md-card-header>

        <md-card-content>
          {{ status.active ? 'Işlem görüyor...' : 'Bitti!' }}</md-card-content
        >
      </md-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { recalculateProducts, getRecalculateStatus } from '@/api';

interface CalculationStatus {
  active: boolean;
  total: number;
  finished: number;
}

@Component
export default class Recalculate extends Vue {
  status: CalculationStatus | null = null;

  async recalculate() {
    if (this.status && this.status.active) {
      return alert('Su anda baska bir islem devam ediyor!');
    }

    await recalculateProducts();
    this.getStatus();
  }

  async getStatus() {
    this.status = await getRecalculateStatus();

    if (this.status?.active) {
      setTimeout(this.getStatus.bind(this), 1000);
    }
  }
}
</script>
