<template>
    <q-dialog ref="dialogRef" @hide="onDialogHide">
      <q-card class="q-dialog-plugin" style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} связь</div>
        </q-card-section>
  
        <!-- Обновленная информационная панель -->
        <q-card-section class="q-pa-none">
          <div class="relation-info bg-yellow-2 q-ma-md q-pa-sm rounded-borders">
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">{{ sourceRole }}</div>
                <div class="text-subtitle2">{{ sourceName }} - {{ sourcePrompt }}</div>
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
                <div class="text-subtitle2">{{ form.target }} - {{ targetPrompt }}</div>
                <q-badge
                  v-if="form.foreignKey"
                  color="primary"
                  text-color="white"
                  class="q-mt-xs field-badge"
                >
                  {{ getTargetField }}
                </q-badge>
              </div>
            </div>
          </div>
        </q-card-section>
  
        <q-card-section class="q-pt-none">
          <div class="relation-type q-mb-sm">
            <div class="text-subtitle2 q-mb-xs">Тип связи</div>
            <q-btn-toggle
              v-model="form.type"
              spread
              no-caps
              unelevated
              dense
              toggle-color="primary"
              class="relation-buttons"
              :options="[
                { value: 'hasMany', slot: 'hasMany' },
                { value: 'belongsTo', slot: 'belongsTo' },
                { value: 'belongsToMany', slot: 'belongsToMany' }
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
            :options="entityOptions"
            label="Связанная сущность"
            outlined
            dense
            class="q-mb-sm"
            emit-value
            map-options
            @update:model-value="updateForeignKeyOptions"
          />
  
          <q-input 
            v-model="form.foreignKey"
            :label="foreignKeyLabel"
            outlined 
            dense
            class="q-mb-sm"
            :rules="[val => !!val || 'Обязательное поле']"
          />
  
          <div class="restriction-type q-mb-sm">
            <div class="text-subtitle2 q-mb-xs">Ограничения на удаление</div>
            <q-btn-toggle
              v-model="form.restriction"
              spread
              no-caps
              unelevated
              dense
              toggle-color="primary"
              class="restriction-buttons"
              :options="[
                { value: 'restrict', slot: 'restrict' },
                { value: 'cascade', slot: 'cascade' },
                { value: 'setnull', slot: 'setnull' }
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
                  <q-tooltip>Устанавливает null в связанных записях при далении основной записи</q-tooltip>
                </div>
              </template>
            </q-btn-toggle>
          </div>
  
          <div class="q-mb-sm row items-center">
            <q-input 
              v-model="form.name" 
              label="Название связи" 
              outlined 
              dense
              class="col"
              :rules="[val => !!val || 'Обязательное поле']"
            />
            <q-btn
              no-caps
              dense
              color="green"
              icon="arrow_left"
              :label="suggestedName"
              @click="form.name = suggestedName"
              class="q-ml-sm"
            />
          </div>
        </q-card-section>
  
        <q-card-actions align="right" class="text-primary">
          <q-btn flat dense label="Отмена" v-close-popup />
          <q-btn flat dense label="OK" @click="onOKClick" :disable="!isFormValid" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </template>
  
  <script>
  import { ref, computed, watch } from 'vue'
  import { useDialogPluginComponent, useQuasar } from 'quasar'
  import dictionaryService from '../services/dictionaryService'
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
      const $q = useQuasar()
      const schemaStore = useSchemaStore()
      const isEdit = ref(false)
      const editingRelationName = ref(null)
      const foreignKeyOptions = ref([])
      const sourceName = ref('') // Добавляем объявление sourceName
  
      const form = ref({
        name: '',
        type: 'hasMany',
        target: '',
        foreignKey: '',
        restriction: 'restrict'
      })
  
      // Теперь entityOptions использует schemaStore
      const entityOptions = computed(() => {
        const entities = schemaStore.entities || []
        return entities
          .filter(entity => entity.name !== props.sourceName)
          .map(entity => ({
            label: `${entity.name} - ${entity.prompt}`,
            value: entity.name
          }))
      })
  
      const foreignKeyLabel = computed(() => {
        if (!form.value.target) return 'Внешний ключ'
        const entities = schemaStore.entities || []
        const sourceEntity = entities.find(e => e.name === props.sourceName)
        const targetEntity = entities.find(e => e.name === form.value.target)
        if (form.value.type === 'belongsTo') {
          return `Внешний ключ (${sourceEntity?.name} - ${sourceEntity?.prompt})`
        } else {
          return `Внешний ключ (${targetEntity?.name} - ${targetEntity?.prompt})`
        }
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
          const entities = schemaStore.entities || []
          const sourceEntity = entities.find(e => e.name === props.sourceName)
          const targetEntity = entities.find(e => e.name === form.value.target)
          
          if (form.value.type === 'hasMany') {
            foreignKeyOptions.value = targetEntity.fields
              .filter(field => field.name.toLowerCase().endsWith('id'))
              .map(field => ({
                label: `${field.name}${field.prompt ? ` - ${field.prompt}` : ''}`,
                value: field.name
              }))
          } else if (form.value.type === 'belongsTo') {
            foreignKeyOptions.value = sourceEntity.fields
              .filter(field => field.name.toLowerCase().endsWith('id'))
              .map(field => ({
                label: `${field.name}${field.prompt ? ` - ${field.prompt}` : ''}`,
                value: field.name
              }))
          } else if (form.value.type === 'belongsToMany') {
            foreignKeyOptions.value = sourceEntity.fields
              .filter(field => field.name.toLowerCase().endsWith('ids'))
              .map(field => ({
                label: `${field.name}${field.prompt ? ` - ${field.prompt}` : ''}`,
                value: field.name
              }))
          }
          
          form.value.name = targetEntity.name
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
          let filteredOptions = foreignKeyOptions.value.filter(
            option => option.label.toLowerCase().includes(needle)
          )
          foreignKeyOptions.value = filteredOptions
        })
      }
  
      const isFormValid = computed(() => {
        return form.value.name && 
               form.value.type && 
               form.value.target && 
               form.value.foreignKey &&
               form.value.restriction
      })
  
      const saveRelation = async (relationData) => {
        try {
          if (editingRelationName.value) {
            // Обновляем существующую связь через единый интерфейс
            await dictionaryService.update('relation', editingRelationName.value, relationData, props.sourceName)
            $q.notify({
              type: 'positive',
              message: 'Связь успешно обновлена'
            })
          } else {
            // Создаем новую связь через единый интерфейс
            await dictionaryService.create('relation', relationData, props.sourceName)
            $q.notify({
              type: 'positive',
              message: 'Связь успешно добавлена'
            })
          }

          onDialogOK(relationData)
        } catch (error) {
          console.error('Error saving relation:', error)
          $q.notify({
            type: 'negative',
            message: `Ошибка при ${editingRelationName.value ? 'обновлении' : 'добавлении'} связи`
          })
        }
      }
  
      const onOKClick = () => {
        if (isFormValid.value) {
          saveRelation(form.value)
        }
      }
  
      // Обновляем метод show для поддержки редактирования
      const show = (relation = null) => {
        if (relation) {
          form.value = { 
            ...relation,
            restriction: relation.restriction || 'restrict'
          }
          editingRelationName.value = relation.name
          isEdit.value = true
        } else {
          form.value = {
            name: '',
            type: 'hasMany',
            target: '',
            foreignKey: '',
            restriction: 'restrict'
          }
          editingRelationName.value = null
          isEdit.value = false
        }
        sourceName.value = props.sourceName // Устанавливаем значение sourceName
        dialogRef.value.show()
      }
  
      const sourceRole = computed(() => {
        switch (form.value.type) {
          case 'hasMany':
            return 'Родитель'
          case 'belongsTo':
          case 'belongsToMany':
            return 'Ребенок'
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
        const targetEntity = schemaStore.entities.find(e => e.name === form.value.target)
        return targetEntity ? targetEntity.prompt : ''
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
        switch (form.value.type) {
          case 'hasMany':
            return 'id'
          case 'belongsTo':
          case 'belongsToMany':
            return form.value.foreignKey
          default:
            return ''
        }
      })
  
      const getTargetField = computed(() => {
        switch (form.value.type) {
          case 'hasMany':
            return form.value.foreignKey
          case 'belongsTo':
          case 'belongsToMany':
            return 'id'
          default:
            return ''
        }
      })
  
      const updateForeignKey = () => {
        if (form.value.target && form.value.type) {
          const sourceEntity = schemaStore.entities.find(e => e.name === props.sourceName)
          const targetEntity = schemaStore.entities.find(e => e.name === form.value.target)
          
          if (form.value.type === 'hasMany') {
            form.value.foreignKey = `${sourceEntity.name.toLowerCase()}Id`
          } else if (form.value.type === 'belongsTo') {
            form.value.foreignKey = `${targetEntity.name.toLowerCase()}Id`
          } else if (form.value.type === 'belongsToMany') {
            form.value.foreignKey = `${targetEntity.name.toLowerCase()}Ids`
          }
        } else {
          form.value.foreignKey = ''
        }
      }
  
      watch(() => form.value.type, updateForeignKey)
      watch(() => form.value.target, updateForeignKey)
  
      const suggestedName = computed(() => {
        const targetEntity = schemaStore.entities.find(e => e.name === form.value.target)
        if (!targetEntity) return ''
  
        let name = targetEntity.name
        if (form.value.type === 'belongsTo') {
          // Убираем окончание 's' или 'es' для 'Многие ко одному'
          if (name.endsWith('es')) {
            name = name.slice(0, -2)
          } else if (name.endsWith('s')) {
            name = name.slice(0, -1)
          }
        }
        return name
      })
  
      const loadEntityOptions = async () => {
        try {
          // Получаем список всех сущностей через единый интерфейс
          const entities = await dictionaryService.getList('entity')
          return entities
            .filter(entity => entity.name !== props.sourceName)
            .map(entity => ({
              label: `${entity.name} - ${entity.prompt}`,
              value: entity.name
            }))
        } catch (error) {
          console.error('Error loading entities:', error)
          return []
        }
      }
  
      return {
        dialogRef,
        onDialogHide,
        onOKClick,
        form,
        isEdit,
        entityOptions,
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
        getTargetField,
        updateForeignKey,
        suggestedName,
        saveRelation,
        loadEntityOptions
      }
    }
  }
  </script>
  
  <style lang="scss">
  .q-dialog-plugin {
    max-width: 95vw;
  }

  .relation-type,
  .restriction-type {
    .q-btn-toggle {
      width: 100%;
      .q-btn {
        padding: 8px;
        min-height: 72px;
      }
    }
  }

  .relation-btn-content,
  .restriction-btn-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 4px;
    width: 100%;
  }

  .relation-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: currentColor;
    
    svg {
      width: 100%;
      height: 100%;
    }
  }

  .relation-label,
  .restriction-label {
    font-size: 12px;
    line-height: 1.2;
    text-align: center;
    white-space: normal;
  }

  .q-btn-toggle {
    .q-btn {
      border: 1px solid rgba(0, 0, 0, 0.12);
      &.q-btn--active {
        border-color: var(--q-primary);
      }
      &:not(.q-btn--active) {
        .relation-icon,
        .q-icon {
          opacity: 0.5;
        }
      }
    }
  }

  .custom-input {
    border-radius: 8px;
    .q-field__control {
      height: 56px;
      border-radius: 8px;
    }
    .q-field__marginal {
      height: 56px;
    }
  }

  .relation-buttons,
  .restriction-buttons {
    .q-btn {
      flex: 1;
      min-width: 0;
    }
  }

  .relation-info {
    padding: 12px;
    border-radius: 8px;
    background-color: rgba(255, 255, 0, 0.1);
    
    .text-caption {
      font-size: 0.75rem;
      line-height: 1.2;
    }
    
    .text-grey-7 {
      opacity: 0.7;
    }
    
    .field-badge {
      border-radius: 4px;
      font-size: 0.7rem;
      padding: 2px 6px;
    }

    .relation-icon {
      width: 32px;
      height: 32px;
      margin: 0 auto;
      
      svg {
        width: 100%;
        height: 100%;
      }
    }
  }
  </style>







