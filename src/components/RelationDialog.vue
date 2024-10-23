<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} связь</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input 
          v-model="form.name" 
          label="Название" 
          standout 
          class="q-mb-md"
          :rules="[val => !!val || 'Обязательное поле']"
        />

        <div class="relation-type q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Тип связи</div>
          <q-btn-toggle
            v-model="form.type"
            spread
            no-caps
            unelevated
            toggle-color="primary"
            class="relation-buttons"
            :options="[
              {
                value: 'hasMany',
                slot: 'hasMany'
              },
              {
                value: 'belongsTo',
                slot: 'belongsTo'
              },
              {
                value: 'belongsToMany',
                slot: 'belongsToMany'
              }
            ]"
          >
            <template #hasMany>
              <div class="relation-btn-content">
                <div class="relation-icon" v-html="oneToManySvg"></div>
                <div class="relation-label">Один ко многим</div>
              </div>
            </template>

            <template #belongsTo>
              <div class="relation-btn-content">
                <div class="relation-icon" v-html="manyToOneSvg"></div>
                <div class="relation-label">Многие к одному</div>
              </div>
            </template>

            <template #belongsToMany>
              <div class="relation-btn-content">
                <div class="relation-icon" v-html="manyToManySvg"></div>
                <div class="relation-label">Многие ко многим</div>
              </div>
            </template>
          </q-btn-toggle>
        </div>

        <q-select
          v-model="form.target"
          :options="collectionOptions"
          label="Связанная сущность"
          standout
          class="q-mb-md"
          emit-value
          map-options
          @update:model-value="updateForeignKeyOptions"
        />

        <q-select
          v-model="form.foreignKey"
          :options="foreignKeyOptions"
          :label="foreignKeyLabel"
          standout
          class="q-mb-md"
          emit-value
          map-options
          use-input
          input-debounce="0"
          @filter="filterForeignKeys"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                Нет подходящих полей
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <div class="restriction-type q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Ограничения на удаление</div>
          <q-btn-toggle
            v-model="form.restriction"
            spread
            no-caps
            unelevated
            toggle-color="primary"
            class="restriction-buttons"
            :options="[
              {
                value: 'restrict',
                slot: 'restrict'
              },
              {
                value: 'cascade',
                slot: 'cascade'
              },
              {
                value: 'setnull',
                slot: 'setnull'
              }
            ]"
          >
            <template #restrict>
              <div class="restriction-btn-content">
                <q-icon name="block" color="negative" size="24px" />
                <div class="restriction-label">Запрет</div>
                <q-tooltip>Запрещает удаление записи, если есть связанные записи</q-tooltip>
              </div>
            </template>

            <template #cascade>
              <div class="restriction-btn-content">
                <q-icon name="delete_sweep" color="warning" size="24px" />
                <div class="restriction-label">Каскад</div>
                <q-tooltip>Удаляет все связанные записи при удалении основной записи</q-tooltip>
              </div>
            </template>

            <template #setnull>
              <div class="restriction-btn-content">
                <q-icon name="remove_circle_outline" color="info" size="24px" />
                <div class="restriction-label">Обнуление</div>
                <q-tooltip>Устанавливает null в связанных записях при удалении основной записи</q-tooltip>
              </div>
            </template>
          </q-btn-toggle>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Отмена" v-close-popup />
        <q-btn flat label="OK" @click="onOKClick" :disable="!isFormValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useSchemaStore } from '../stores/schema'
import { manyToManySvg, oneToManySvg, manyToOneSvg } from '../assets/icons/relations'

export default {
  name: 'RelationDialog',

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup () {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const schemaStore = useSchemaStore()
    const isEdit = ref(false)
    const foreignKeyOptions = ref([])

    const form = ref({
      name: '',
      type: 'hasMany',
      target: '',
      foreignKey: '',
      restriction: 'restrict'
    })

    const collectionOptions = computed(() => {
      const collections = schemaStore.collections || []
      return collections.map(collection => ({
        label: `${collection.prompt} - ${collection.description}`,
        value: collection.name
      }))
    })

    const foreignKeyLabel = computed(() => {
      if (!form.value.target) return 'Внешний ключ'
      const collections = schemaStore.collections || []
      const targetCollection = collections.find(c => c.name === form.value.target)
      return `Внешний ключ (${targetCollection?.prompt || form.value.target})`
    })

    const isValidForeignKey = (fieldName) => {
      const lowercaseName = fieldName.toLowerCase()
      return lowercaseName.endsWith('id') || 
             lowercaseName.endsWith('ids') || 
             lowercaseName.endsWith('_id') || 
             lowercaseName.endsWith('_ids')
    }

    const updateForeignKeyOptions = () => {
      if (form.value.target) {
        const collections = schemaStore.collections || []
        const targetCollection = collections.find(c => c.name === form.value.target)
        if (targetCollection) {
          foreignKeyOptions.value = targetCollection.fields
            .filter(field => isValidForeignKey(field.name))
            .map(field => ({
              label: `${field.name}${field.prompt ? ` - ${field.prompt}` : ''}`,
              value: field.name
            }))
        }
      } else {
        foreignKeyOptions.value = []
      }
    }

    const filterForeignKeys = (val, update) => {
      if (!form.value.target) {
        update(() => { foreignKeyOptions.value = [] })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        const collections = schemaStore.collections || []
        const targetCollection = collections.find(c => c.name === form.value.target)
        if (targetCollection) {
          foreignKeyOptions.value = targetCollection.fields
            .filter(field => isValidForeignKey(field.name))
            .filter(field => field.name.toLowerCase().includes(needle) || 
                           (field.prompt && field.prompt.toLowerCase().includes(needle)))
            .map(field => ({
              label: `${field.name}${field.prompt ? ` - ${field.prompt}` : ''}`,
              value: field.name
            }))
        }
      })
    }

    const isFormValid = computed(() => {
      return form.value.name && 
             form.value.type && 
             form.value.target && 
             form.value.foreignKey &&
             form.value.restriction
    })

    const show = (relation = null) => {
      if (relation) {
        form.value = { 
          ...relation,
          restriction: relation.restriction || 'restrict'
        }
        updateForeignKeyOptions()
        isEdit.value = true
      } else {
        form.value = {
          name: '',
          type: 'hasMany',
          target: '',
          foreignKey: '',
          restriction: 'restrict'
        }
        foreignKeyOptions.value = []
        isEdit.value = false
      }
      dialogRef.value.show()
    }

    const onOKClick = () => {
      if (isFormValid.value) {
        onDialogOK(form.value)
      }
    }

    return {
      dialogRef,
      onDialogHide,
      onOKClick,
      form,
      isEdit,
      collectionOptions,
      foreignKeyOptions,
      foreignKeyLabel,
      isFormValid,
      show,
      filterForeignKeys,
      updateForeignKeyOptions,
      manyToManySvg,
      oneToManySvg,
      manyToOneSvg
    }
  }
}
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw

.relation-type,
.restriction-type
  .q-btn-toggle
    width: 100%
    .q-btn
      padding: 8px
      min-height: 72px

.relation-btn-content,
.restriction-btn-content
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 8px
  padding: 4px
  width: 100%

.relation-icon
  width: 24px
  height: 24px
  display: flex
  align-items: center
  justify-content: center
  color: currentColor

  svg
    width: 100%
    height: 100%

.relation-label,
.restriction-label
  font-size: 12px
  line-height: 1.2
  text-align: center
  white-space: normal

.q-btn-toggle
  .q-btn
    border: 1px solid rgba(0, 0, 0, 0.12)
    &.q-btn--active
      border-color: var(--q-primary)
      
    &:not(.q-btn--active)
      .relation-icon,
      .q-icon
        opacity: 0.5

.custom-input
  border-radius: 8px
  .q-field__control
    height: 56px
    border-radius: 8px
  .q-field__marginal
    height: 56px

.relation-buttons,
.restriction-buttons
  .q-btn
    flex: 1
    min-width: 0
</style>