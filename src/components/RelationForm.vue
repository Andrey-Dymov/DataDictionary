<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} связь</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-6">
            <q-input 
              v-model="form.name" 
              label="Название" 
              standout 
              dense
              :rules="[val => !!val || 'Обязательное поле']"
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="form.type"
              :options="relationTypeOptions"
              label="Тип связи"
              standout
              dense
              emit-value
              map-options
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-6">
            <q-select
              v-model="form.target"
              :options="targetCollections"
              label="Целевая сущность"
              standout
              dense
              emit-value
              map-options
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="form.foreignKey"
              :options="targetFields"
              label="Внешний ключ"
              standout
              dense
              emit-value
              map-options
            />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-input 
              v-model="form.restriction" 
              label="Ограничение" 
              standout 
              dense
            />
          </div>
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

export default {
  name: 'RelationForm',

  props: {
    sourceName: {
      type: String,
      required: true
    },
    sourcePrompt: {
      type: String,
      required: true
    },
    sourceField: {
      type: String,
      default: ''
    }
  },

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup(props) {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const schemaStore = useSchemaStore()
    
    const form = ref({
      name: '',
      type: '',
      target: '',
      foreignKey: '',
      restriction: ''
    })

    const isEdit = ref(false)

    const relationTypeOptions = [
      { label: 'Один ко многим', value: 'hasMany' },
      { label: 'Многие к одному', value: 'belongsTo' },
      { label: 'Многие ко многим', value: 'belongsToMany' }
    ]

    const targetCollections = computed(() => {
      return schemaStore.collections
        .filter(c => c.name !== props.sourceName)
        .map(c => ({
          label: `${c.name} - ${c.prompt}`,
          value: c.name
        }))
    })

    const targetFields = computed(() => {
      if (!form.value.target) return []
      const targetCollection = schemaStore.getCollectionByName(form.value.target)
      return targetCollection?.fields.map(f => ({
        label: f.name,
        value: f.name
      })) || []
    })

    const isFormValid = computed(() => {
      return form.value.name && 
             form.value.type && 
             form.value.target && 
             form.value.foreignKey
    })

    const show = (relation = null) => {
      if (relation) {
        form.value = {
          name: relation.name,
          type: relation.type,
          target: relation.target,
          foreignKey: relation.foreignKey,
          restriction: relation.restriction || ''
        }
        isEdit.value = true
      } else {
        form.value = {
          name: '',
          type: '',
          target: '',
          foreignKey: '',
          restriction: ''
        }
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
      relationTypeOptions,
      targetCollections,
      targetFields,
      isFormValid,
      show
    }
  }
}
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw
</style>
