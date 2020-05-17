<template>
  <div>
    <div class="page-bar">
      <div class="page-actions">
        <md-button @click="createItem" class="md-primary md-raised"
          >Ekle</md-button
        >
      </div>
      <div class="pagination" v-if="this.isPaginated">
        <paginate
          v-model="page"
          :page-count="pageCount.total"
          container-class="items-pagination"
          :prev-text="'Geri'"
          :next-text="'İleri'"
        >
        </paginate>
        <div v-if="config.subDocs && config.subDocInput" class="subdoc-input">
          <md-field>
            <md-icon @click.native="goToSubDoc" role="button">search</md-icon>
            <md-input
              v-model="subDocInput"
              @keydown.enter.native="goToSubDoc"
              placeholder="Ürüne git. (sku no.)"
            ></md-input>
          </md-field>
        </div>
        <div
          class="item-filters"
          v-if="config.filters && config.filters.length"
        >
          <md-field v-for="filter in config.filters" :key="filter.key">
            <label>{{ filter.name }}</label>
            <md-select v-model="itemFilter[filter.key]">
              <md-option value=""></md-option>
              <md-option
                v-for="option in filterOptions[filter.key]"
                :key="option.id"
                :value="option[filter.selectBy || 'id']"
              >
                {{ option[filter.selectBy || 'id'] }}
              </md-option>
            </md-select>
          </md-field>
        </div>
        <div class="pagination-details">
          <span class="md-body-2"
            >{{ pageCount.from }} - {{ pageCount.to }} of
            {{ pageCount.totalDocs }}
          </span>
        </div>
      </div>
    </div>
    <md-divider v-if="this.isPaginated"></md-divider>
    <md-table v-if="items.length && !isLoading" v-model="items">
      <md-table-row
        class="platform-row"
        slot="md-table-row"
        slot-scope="{ item }"
        @click="openItemEdit(item)"
      >
        <md-table-cell width="15">{{ getItemIndex(item) }}</md-table-cell>
        <md-table-cell
          v-for="prop in config.displayProps"
          :key="prop"
          :md-label="getPropLabel(prop)"
        >
          <a
            @click.prevent="openSubDoc(item[prop])"
            v-if="config.subDocs && config.subDocItem === prop"
          >
            {{ item[prop] }}
          </a>
          <span v-else>
            {{ getItemProp(item, prop) }}
          </span>
        </md-table-cell>
      </md-table-row>
    </md-table>
    <md-empty-state
      v-else-if="!isLoading"
      md-icon="search"
      md-label="Bu liste henüz boş"
      md-description=" "
    >
      <md-button class="md-primary md-raised" @click="createItem"
        >Oluştur</md-button
      >
    </md-empty-state>

    <md-button
      @click="createItem"
      class="md-fab md-fab-bottom-right md-primary"
    >
      <md-icon>add</md-icon>
    </md-button>

    <md-dialog
      class="edit-dialog"
      :md-active.sync="showDialog"
      @md-closed="onDialogClose"
    >
      <md-dialog-title>{{ config.document }}</md-dialog-title>

      <md-dialog-content>
        <div v-for="(_, prop) in itemOnEdit" :key="prop">
          <md-field v-if="!isGroupedProp(prop)">
            <label v-if="getPropType(prop) !== 'boolean'" :for="prop">{{
              getPropLabel(prop)
            }}</label>
            <md-select
              v-if="getPropType(prop) === 'select'"
              v-model="itemOnEdit[prop]"
              :name="prop"
              :id="prop"
            >
              <md-option value=""></md-option>
              <md-option
                v-for="option in getSelectableItems(prop)"
                :key="option.id"
                :value="getValueMap(option, prop)"
              >
                {{ option.name }}
              </md-option>
            </md-select>
            <md-textarea
              v-else-if="getPropType(prop) === 'textarea'"
              v-model="itemOnEdit[prop]"
              :name="prop"
              :id="prop"
            ></md-textarea>
            <div
              class="switch-wrapper"
              v-else-if="getPropType(prop) === 'boolean'"
            >
              <span class="switch-label">{{ getPropLabel(prop) }}</span>
              <md-switch v-model="itemOnEdit[prop]"></md-switch>
            </div>
            <md-input
              v-else
              :type="getPropType(prop)"
              :name="prop"
              :id="prop"
              v-model="itemOnEdit[prop]"
            />
          </md-field>
          <div v-else class="grouped-item">
            <div class="md-layout">
              <div class="md-layout-item">
                <h3>{{ getPropLabel(prop) }}</h3>
              </div>
              <div class="md-layout-item layout-auto">
                <md-button
                  class="md-icon-button md-primary"
                  @click="addChild(prop)"
                >
                  <md-icon>add</md-icon>
                </md-button>
              </div>
            </div>
            <div
              class="md-layout child-item"
              v-for="(childItem, childIdx) in itemOnEdit[prop]"
              :key="childIdx + prop"
            >
              <div class="md-layout-item child-actions layout-auto">
                <h3>{{ childIdx + 1 }}</h3>
                <md-button
                  @click="removeChild(prop, childIdx)"
                  class="md-icon-button md-accent"
                >
                  <md-icon>delete</md-icon>
                </md-button>
              </div>
              <div class="md-layout-item child-form">
                <md-field
                  v-for="(_, childProp) in childItem"
                  :key="childIdx + childProp"
                >
                  <label
                    v-if="getPropType(childProp, prop) !== 'boolean'"
                    :for="prop + childIdx + childProp"
                    >{{ getPropLabel(childProp, prop) }}</label
                  >
                  <md-select
                    v-if="getPropType(childProp, prop) === 'select'"
                    v-model="itemOnEdit[prop][childIdx][childProp]"
                    :name="prop + childIdx + childProp"
                    :id="prop + childIdx + childProp"
                  >
                    <md-option value=""></md-option>
                    <md-option
                      v-for="option in getSelectableItems(childProp, prop)"
                      :key="option.id"
                      :value="getValueMap(option, childProp, prop)"
                    >
                      {{ option.name }}
                    </md-option>
                  </md-select>
                  <md-textarea
                    v-else-if="getPropType(childProp, prop) === 'textarea'"
                    v-model="itemOnEdit[prop][childIdx][childProp]"
                    :name="prop + childIdx + childProp"
                    :id="prop + childIdx + childProp"
                  ></md-textarea>
                  <div
                    class="switch-wrapper"
                    v-else-if="getPropType(childProp, prop) === 'boolean'"
                  >
                    <span class="switch-label">{{
                      getPropLabel(childProp, prop)
                    }}</span>
                    <md-switch
                      v-model="itemOnEdit[prop][childIdx][childProp]"
                    ></md-switch>
                  </div>
                  <md-input
                    v-else
                    :type="getPropType(childProp, prop)"
                    :name="prop + childIdx + childProp"
                    :id="prop + childIdx + childProp"
                    v-model="itemOnEdit[prop][childIdx][childProp]"
                  />
                </md-field>
              </div>
            </div>
          </div>
        </div>
      </md-dialog-content>

      <md-dialog-actions>
        <md-button v-if="isEdit" @click="deleteItem" class="md-accent"
          >SİL</md-button
        >
        <md-button @click="showDialog = false">İptal</md-button>
        <md-button @click="saveItem" class="md-primary">Kaydet</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script lang="ts">
import { cloneDeep, omit, pick, omitBy } from 'lodash';
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { ApiService, PaginatedReturnValue } from '@/api';
import { Models } from '@/types/app';

type ConfigValue = [string, string?, ApiService<Models>?, string?];

interface ConfigFilter {
  name: string;
  key: string;
  service: ApiService<Models>;
  options?: any[];
  selectBy?: string;
}

export interface EditableConfig {
  document: string;
  paginate?: boolean;
  subDocs?: boolean;
  subDocTarget?: string;
  subDocItem?: string;
  subDocInput?: boolean;
  filters?: ConfigFilter[];
  displayProps: string[];
  apiService: ApiService<Models>;
  props: {
    [key: string]: ConfigValue;
  };
  groupedProps?: {
    [key: string]: {
      [key: string]: ConfigValue;
    };
  };
}

@Component
export default class EditableItems extends Vue {
  @Prop({ type: Object, required: true }) readonly config!: EditableConfig;
  items: Models[] = [];
  itemOnEdit = this.createEmptyItem();
  itemIdOnEdit = '';
  isEdit = false;
  isLoading = true;
  isPaginated = !!this.config.paginate;
  pagination: Omit<PaginatedReturnValue<Models>, 'docs'>;
  showDialog = false;
  service = this.config.apiService;
  selectableItems: { [key: string]: any } = {};
  subDocInput = '';
  itemFilter = {};
  filterOptions: { [key: string]: Models[] } = {};

  constructor() {
    super();
    this.pagination = {
      pagingCounter: 1,
      totalDocs: 0,
      totalPages: 0
    };
  }

  get page() {
    return this.$route.params?.page ? Number(this.$route.params.page) : 1;
  }

  set page(page: number) {
    this.$router.push({ params: { page: page.toString() } });
  }

  get pageCount() {
    const {
      pagingCounter = 1,
      totalDocs = 0,
      totalPages = 0
    } = this.pagination;

    return {
      from: pagingCounter,
      to: pagingCounter + (this.items.length - 1),
      total: totalPages,
      totalDocs
    };
  }

  getItemProp(item: any, prop: string) {
    if (this.isGroupedProp(prop)) {
      const propArray = item[prop];

      return propArray.map((a: any) => Object.values(a).join(':')).join(', ');
    }

    return item[prop];
  }

  getItemIndex(item: Models) {
    const idx = this.items.indexOf(item);

    return idx + this.pageCount.from;
  }

  @Watch('page')
  onPageChange() {
    this.getItems();
  }

  @Watch('itemFilter', { deep: true })
  onFilterChange() {
    this.getItems();
  }

  mounted() {
    this.getItems();
    this.getSelectableModels();
  }

  goToSubDoc() {
    this.openSubDoc(this.subDocInput);
  }

  openSubDoc(itemId: string) {
    this.$router.push(`${this.config.subDocTarget}${itemId}`);
  }

  createEmptyItem() {
    const item: { [key: string]: any } = {};

    Object.keys(this.config.props).forEach(prop => {
      if (this.isGroupedProp(prop)) {
        item[prop] = [];
        return;
      }

      const type = this.getPropType(prop);

      let value;
      if (type === 'number') {
        value = 0;
      } else if (type === 'boolean') {
        value = false;
      } else {
        value = '';
      }

      item[prop] = value;
    });

    return item;
  }

  isGroupedProp(prop: string) {
    return !!(this.config.groupedProps as any)?.[prop];
  }

  getPropType(prop: string, parent?: string) {
    const props = parent
      ? (this.config.groupedProps as any)[parent]
      : this.config.props;
    const val = props[prop];

    if (val.length < 2) {
      return 'text';
    }

    return val[1];
  }

  async getItems() {
    this.isLoading = true;

    try {
      let items;
      if (!this.isPaginated) {
        items = await this.service.getAll();
      } else {
        const itemFilter = omitBy(this.itemFilter, (val: string) => !val);
        const res = await this.service.paginate(this.page, itemFilter);
        items = res.docs;
        this.pagination = omit(res, 'docs');
      }

      items = items.map(i =>
        pick(i, ['id', ...Object.keys(this.config.props)])
      ) as Models[];

      this.items = items;
    } catch (error) {
      alert(error);
    }

    this.isLoading = false;
  }

  addChild(prop: string) {
    const child: { [key: string]: any } = {};
    const childProps = (this.config.groupedProps as any)[prop];

    Object.keys(childProps).forEach(childProp => {
      const type = this.getPropType(childProp, prop);
      let value;

      if (type === 'number') {
        value = 0;
      } else if (type === 'boolean') {
        value = false;
      } else {
        value = '';
      }

      child[childProp] = value;
    });

    this.itemOnEdit[prop].push(child);
  }

  removeChild(prop: string, childIdx: number) {
    this.itemOnEdit[prop].splice(childIdx, 1);
  }

  getPropLabel(prop: string, parent?: string) {
    const propOptions = parent
      ? (this.config.groupedProps as any)[parent][prop]
      : this.config.props[prop];

    return propOptions?.[0];
  }

  getSelectableItems(prop: string, parent?: string) {
    const items = parent
      ? this.selectableItems[parent][prop]
      : this.selectableItems[prop];

    return items;
  }

  getValueMap(item: Models, prop: string, parent?: string): string {
    const propOptions = parent
      ? (this.config.groupedProps as any)[parent][prop]
      : this.config.props[prop];

    const key: keyof Models = propOptions.length === 4 ? propOptions[3] : 'id';

    return item[key];
  }

  getSelectableModels() {
    Object.keys(this.config.props).forEach(prop => {
      const groupedProp = this.config.groupedProps as any;
      const type = this.getPropType(prop);

      if (groupedProp?.[prop]) {
        Object.keys(groupedProp[prop]).forEach(childProp => {
          const childType = this.getPropType(childProp, prop);

          if (childType === 'select') {
            this.selectableItems[prop] = this.selectableItems[prop] || {};
            this.selectableItems[prop][childProp] = [];

            this.getSelectableItemsService(childProp, prop).then(items => {
              this.selectableItems[prop][childProp] = items;
            });
          }
        });
      } else if (type === 'select') {
        this.selectableItems[prop] = this.selectableItems[prop] || [];
        this.getSelectableItemsService(prop).then(items => {
          this.selectableItems[prop] = items;
        });
      }
    });

    if (!this.config.filters) return;

    this.config.filters.forEach(filter => {
      filter.service.getAll().then(options => {
        this.filterOptions = {
          ...this.filterOptions,
          [filter.key]: options
        };
      });
    });
  }

  getSelectableItemsService(prop: string, parent?: string): Promise<Models> {
    const idx = 2;
    const grouped = parent && (this.config.groupedProps as any);
    const service = parent
      ? grouped[parent][prop][idx]
      : this.config.props[prop][idx];

    return service.getAll();
  }

  openItemEdit(item: Models) {
    this.itemOnEdit = {
      ...this.createEmptyItem(),
      ...omit(cloneDeep(item), 'id')
    };
    this.itemIdOnEdit = item.id;
    this.isEdit = true;
    this.showDialog = true;
  }

  onDialogClose() {
    this.isEdit = false;
  }

  async createItem() {
    this.itemOnEdit = this.createEmptyItem();
    this.showDialog = true;
  }

  async deleteItem() {
    try {
      await this.service.delete(this.itemIdOnEdit);
      this.getItems();
    } catch (error) {
      alert(error);
    }

    this.showDialog = false;
  }

  async saveItem() {
    const item = {
      ...this.itemOnEdit,
      id: this.itemIdOnEdit
    };

    if (!this.isEdit) {
      delete item.id;
    }

    try {
      await this.service.post(item);
      this.getItems();
      this.showDialog = false;
    } catch (error) {
      alert(error);
    }
  }

  setEdited(item: Models) {
    const elIdx = this.items.findIndex(_p => _p.id === item.id);
    this.items.splice(elIdx, 1, item);
  }
}
</script>

<style lang="scss">
.platform-row {
  cursor: pointer;
}

.page-bar {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.page-actions {
  padding-right: 16px;
}

.pagination {
  flex: 1;
  display: flex;
  padding: 10px;
  padding-top: 5px;
  justify-content: space-between;
}

.items-pagination {
  display: flex;
  list-style: none;
  padding-top: 7px;

  li {
    margin-right: 20px;

    &:not(.active) a {
      color: var(
        --md-theme-default-text-primary-on-background,
        rgba(0, 0, 0, 0.87)
      );
    }

    &.active a {
      font-weight: bold;
    }

    &.disabled a {
      opacity: 0.2;
    }
  }
}

.pagination-details {
  padding-top: 7px;
}

.subdoc-input {
  flex: 1;
  padding: 0 20px;

  .md-field {
    min-height: auto;
    margin: 0;
    padding-top: 0;

    .md-icon {
      cursor: pointer;
    }
  }
}

.item-filters {
  margin-top: -20px;
  padding-right: 20px;
}

.edit-dialog {
  min-width: 600px;

  @media (max-width: 600px) {
    min-width: auto;
  }
}

.grouped-item {
  margin-bottom: 12px;

  h3 {
    margin-top: 12px;
  }
}

.layout-auto {
  flex: 0 0 auto;
}

.child-item {
  padding-right: 20px;
  padding-top: 12px;
  border: solid 2px #f0f0f0;

  &:nth-child(even) {
    background-color: #f0f0f0;
  }
}

.switch-wrapper {
  display: flex;
}

.switch-label {
  display: inline-flex;
  font-weight: bold;
  margin-right: 12px;

  & + .md-switch {
    margin: 0;
  }
}

.child-actions {
  min-width: auto;
  max-width: auto;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-right: 15px;
}
</style>
