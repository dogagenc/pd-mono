<template>
  <div class="home">
    <md-tabs>
      <md-tab id="import" md-label="Import">
        <div class="md-layout section">
          <div class="md-layout-item">
            <FileUpload
              accept="application/xml"
              :drop="true"
              @input-file="onFileInput"
            >
              <div class="import-inner">XML Import</div>
            </FileUpload>
          </div>
          <div v-if="status" class="md-layout-item">
            <md-card>
              <md-card-header>
                <div class="md-title">
                  {{ status.progress.finished }} / {{ status.progress.total }}
                </div>
              </md-card-header>

              <md-card-content
                >{{ status.type }}
                {{
                  status.active ? 'işlem görüyor...' : 'bitti.'
                }}</md-card-content
              >
            </md-card>
          </div>
        </div>
      </md-tab>
      <md-tab id="export" md-label="Export">
        <Export />
      </md-tab>
      <md-tab id="recalculate" md-label="Hesaplama">
        <Recalculate />
      </md-tab>
    </md-tabs>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { uploadFile, getUploadStatus } from '@/api';
import FileUpload from 'vue-upload-component';
import { ParserStatus } from '@/types/app';
import Export from '@/components/Export.vue';
import Recalculate from '@/components/Recalculate.vue';

interface FileUploadEvent {
  file: File;
}

@Component({
  components: {
    Export,
    FileUpload,
    Recalculate
  }
})
export default class Home extends Vue {
  status: ParserStatus | null = null;
  isLoading = false;

  async onFileInput(res: FileUploadEvent) {
    try {
      this.status = await uploadFile(res.file);
      this.refreshStatus();
    } catch (error) {
      console.log(error); // eslint-disable-line
    }
  }

  async refreshStatus() {
    this.isLoading = true;

    try {
      this.status = await getUploadStatus();
      if (this.status.active) {
        setTimeout(this.refreshStatus.bind(this, 2000));
      }
    } catch (error) {
      alert(error);
    }

    this.isLoading = false;
  }
}
</script>

<style lang="scss">
.import-inner {
  width: 100%;
  height: 200px;
  border-radius: 6px;
  border: dashed 2px gray;
}

.home {
  .file-uploads {
    width: 100%;
  }

  .section {
    margin-bottom: 50px;
  }

  .import-inner {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
}
</style>
