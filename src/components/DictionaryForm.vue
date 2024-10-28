<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} словарь</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-sm">
          <div class="col-12">
            <q-input 
              v-model="form.name" 
              label="Название словаря" 
              standout 
              dense
              class="q-mb-xs"
              :rules="[val => !!val || 'Обязательное поле']"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.filePath"
              label="Каталог"
              standout
              dense
              class="q-mb-xs"
              :rules="[val => !!val || 'Обязательное поле']"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="form.fileName"
              label="Файл словаря"
              standout
              dense
              readonly
              class="q-mb-xs"
              :rules="[val => !!val || 'Обязательное поле']"
              :disable="!form.filePath"
            >
              <template v-slot:append>
                <q-btn
                  flat
                  round
                  dense
                  icon="description"
                  @click="showFileSelector"
                  :disable="!form.filePath"
                >
                  <q-tooltip>{{ form.filePath ? 'Выбрать файл' : 'Сначала укажите каталог' }}</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <q-input 
              v-model="form.description" 
              label="Описание" 
              type="textarea" 
              standout 
              dense
              autogrow
              class="q-mb-xs"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat dense label="Отмена" v-close-popup />
        <q-btn flat dense label="OK" @click="onOKClick" :disable="!isFormValid" />
      </q-card-actions>

      <q-dialog v-model="fileDialogOpen">
        <q-card style="min-width: 350px" class="q-pb-lg">
          <q-card-section class="row items-center">
            <div>
              <div class="text-h6">Выберите файл</div>
              <div class="text-caption text-grey-7">{{ form.filePath }}</div>
            </div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section class="q-pa-none">
            <q-list separator>
              <q-item
                v-for="file in availableFiles"
                :key="file.name"
                clickable
                v-ripple
                dense
                @click="selectFileFromList(file)"
              >
                <q-item-section>
                  <q-item-label :class="{ 'text-weight-bold': isSpecialFile(file.name) }">
                    {{ file.name }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ file.size }} - Изменен: {{ file.modified }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import dictionaryService from '../services/dictionaryService'

export default {
  name: 'DictionaryForm',

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup() {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const $q = useQuasar()
    const fileDialogOpen = ref(false)
    const availableFiles = ref([])

    const form = ref({
      name: '',
      description: '',
      filePath: '',
      fileName: ''
    })

    const isEdit = ref(false)

    const isFormValid = computed(() => {
      return !!form.value.name && 
             !!form.value.filePath && 
             !!form.value.fileName
    })

    const showFileSelector = async () => {
      if (!form.value.filePath) {
        $q.notify({
          type: 'warning',
          message: 'Сначала укажите каталог'
        })
        return
      }

      try {
        // Используем query параметр path
        const files = await dictionaryService.getList('files', null, { path: form.value.filePath })
        availableFiles.value = files
        fileDialogOpen.value = true
      } catch (error) {
        console.error('Error loading files:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке списка файлов'
        })
      }
    }

    const selectFileFromList = (file) => {
      form.value.fileName = file.name
      
      if (!form.value.name) {
        form.value.name = file.name.replace('.json', '')
      }
      
      fileDialogOpen.value = false
    }

    const show = (dictionary = null) => {
      if (dictionary) {
        form.value = { ...dictionary }
        isEdit.value = true
      } else {
        form.value = {
          name: '',
          description: '',
          filePath: '',
          fileName: ''
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

    const isSpecialFile = (fileName) => {
      return fileName.toLowerCase().includes('dict') || 
             fileName.toLowerCase().includes('schema')
    }

    return {
      dialogRef,
      onDialogHide,
      onOKClick,
      form,
      isEdit,
      isFormValid,
      show,
      showFileSelector,
      selectFileFromList,
      fileDialogOpen,
      availableFiles,
      isSpecialFile
    }
  }
}
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw

.q-field
  &.q-mb-xs
    margin-bottom: 4px

.q-card__section + .q-card__section
  padding-top: 0
</style>
