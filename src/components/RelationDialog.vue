<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} связь</div>
      </q-card-section>

      <!-- Перемещаем информационное поле сюда -->
      <q-card-section class="q-pa-none">
        <div class="relation-info bg-yellow-2 q-ma-md q-pa-sm rounded-borders">
          <div class="row items-center justify-between q-col-gutter-md">
            <div class="col-4 text-center">
              <div class="text-caption text-grey-7">{{ sourceRole }}</div>
              <div class="text-subtitle2">{{ sourceName }}</div>
              <div class="text-caption">{{ sourcePrompt }}</div>
              <q-badge
                color="primary"
                text-color="white"
                class="q-mt-xs field-badge"
              >
                {{ sourceField }}
              </q-badge>
            </div>
            <div class="col-4 text-center">
              <div class="relation-icon" v-html="getRelationIcon"></div>
              <div class="text-caption q-mt-xs">{{ getRelationTypeText }}</div>
            </div>
            <div class="col-4 text-center">
              <div class="text-caption text-grey-7">{{ targetRole }}</div>
              <div class="text-subtitle2">{{ form.target }}</div>
              <div class="text-caption">{{ targetPrompt }}</div>
              <q-badge
                v-if="form.foreignKey"
                color="primary"
                text-color="white"
                class="q-mt-xs field-badge"
              >
                {{ form.type === 'belongsTo' ? form.foreignKey : getTargetField }}
              </q-badge>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
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

        <q-input 
          v-model="form.name" 
          label="Название связи" 
          standout 
          class="q-mb-md"
          :rules="[val => !!val || 'Обязательное поле']"
        />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Отмена" v-close-popup />
        <q-btn flat label="OK" @click="onOKClick" :disable="!isFormValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useSchemaStore } from '../stores/schema'
import { manyToManySvg, oneToManySvg, manyToOneSvg } from '../assets/icons/relations'

export default {
  name: 'RelationDialog',

  props: {
    sourceName: {
      type: String,
      required: true
    },
    sourcePrompt: {
      type: String,
      default: ''
    },
    sourceField: {
      type: String,
      default: ''
    }
  },

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup (props) {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const schemaStore = useSchemaStore()
    const isEdit = ref(false)
    const foreignKeyOptions = ref([])

    // Создаем еактивную переменную для sourceName
    const sourceName = ref(props.sourceName)

    // Следим за изменениями пропса sourceName
    watch(() => props.sourceName, (newSourceName) => {
      sourceName.value = newSourceName
    })

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
        label: `${collection.name} - ${collection.prompt}`,
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
          
          // Автоматически заполняем название связи
          let relationName = targetCollection.name
          if (form.value.type === 'belongsTo') {
            relationName = relationName.replace(/es$/, '').replace(/s$/, '')
          }
          form.value.name = relationName
        }
      } else {
        foreignKeyOptions.value = []
        form.value.name = ''
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
      // Обновляем sourceName при каждом открытии диалога
      sourceName.value = props.sourceName
      dialogRef.value.show()
    }

    const onOKClick = () => {
      if (isFormValid.value) {
        onDialogOK(form.value)
      }
    }

    const sourceRole = computed(() => {
      switch (form.value.type) {
        case 'hasMany':
          return 'Родитель'
        case 'belongsTo':
        case 'belongsToMany':
          return 'Ребеок'
        default:
          return ''
      }
    })

    const targetRole = computed(() => {
      switch (form.value.type) {
        case 'hasMany':
          return 'Ребенок'
        case 'belongsTo':
        case 'belongsToMany':
          return 'Родитель'
        default:
          return ''
      }
    })

    const getRelationIcon = computed(() => {
      switch (form.value.type) {
        case 'hasMany':
          return oneToManySvg
        case 'belongsTo':
          return manyToOneSvg
        case 'belongsToMany':
          return manyToManySvg
        default:
          return ''
      }
    })

    const targetPrompt = computed(() => {
      const targetCollection = schemaStore.collections.find(c => c.name === form.value.target)
      return targetCollection ? targetCollection.prompt : ''
    })

    const getRelationTypeText = computed(() => {
      switch (form.value.type) {
        case 'hasMany':
          return 'Один ко многим'
        case 'belongsTo':
          return 'Многие к одному'
        case 'belongsToMany':
          return 'Многие ко многим'
        default:
          return ''
      }
    })

    const sourceField = computed(() => {
      if (form.value.type === 'belongsTo') {
        return form.value.foreignKey
      } else {
        const sourceCollection = schemaStore.collections.find(c => c.name === props.sourceName)
        return sourceCollection ? sourceCollection.fields.find(f => f.isPrimaryKey)?.name || 'id' : 'id'
      }
    })

    const getTargetField = computed(() => {
      if (form.value.type === 'belongsTo') {
        const targetCollection = schemaStore.collections.find(c => c.name === form.value.target)
        return targetCollection ? targetCollection.fields.find(f => f.isPrimaryKey)?.name || 'id' : 'id'
      } else {
        return form.value.foreignKey
      }
    })

    watch(() => form.value.type, (newType) => {
      // Обновляем foreignKey при изменении типа связи
      if (newType === 'belongsTo') {
        const targetCollection = schemaStore.collections.find(c => c.name === form.value.target)
        form.value.foreignKey = targetCollection ? `${targetCollection.name.toLowerCase()}Id` : ''
      } else {
        const sourceCollection = schemaStore.collections.find(c => c.name === props.sourceName)
        form.value.foreignKey = sourceCollection ? `${sourceCollection.name.toLowerCase()}Id` : ''
      }
    })

    watch(() => form.value.target, (newTarget) => {
      // Обновляем foreignKey при изменении целевой сущности
      if (form.value.type === 'belongsTo') {
        form.value.foreignKey = newTarget ? `${newTarget.toLowerCase()}Id` : ''
      } else {
        const sourceCollection = schemaStore.collections.find(c => c.name === props.sourceName)
        form.value.foreignKey = sourceCollection ? `${sourceCollection.name.toLowerCase()}Id` : ''
      }
    })

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
      manyToOneSvg,
      sourceRole,
      targetRole,
      getRelationIcon,
      sourceName,
      sourcePrompt: props.sourcePrompt,
      targetPrompt,
      getRelationTypeText,
      sourceField,
      getTargetField
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

.relation-info
  padding: 12px
  border-radius: 8px
  background-color: rgba(255, 255, 0, 0.1) // Бледно-желтый цвет

.relation-icon
  width: 32px
  height: 32px
  margin: 0 auto

  svg
    width: 100%
    height: 100%

.relation-info
  .text-caption
    font-size: 0.75rem
    line-height: 1.2

  .text-grey-7
    opacity: 0.7

  .field-badge
    border-radius: 4px
    font-size: 0.7rem
    padding: 2px 6px
</style>

