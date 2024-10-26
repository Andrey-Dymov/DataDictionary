<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} словарь</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-input 
              v-model="form.name" 
              label="Название словаря" 
              standout 
              dense
              :rules="[val => !!val || 'Обязательное поле']"
            />
          </div>

          <div class="col-12">
            <q-input 
              v-model="form.description" 
              label="Описание" 
              type="textarea" 
              standout 
              dense
            />
          </div>

          <div class="col-12">
            <q-input 
              v-model="form.filePath" 
              label="Путь к файлу" 
              standout 
              dense
              :rules="[val => !!val || 'Обязательное поле']"
              readonly
            >
              <template v-slot:append>
                <q-btn 
                  flat 
                  round 
                  dense 
                  icon="folder" 
                  @click="selectDirectory"
                >
                  <q-tooltip>Выбрать каталог</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <q-input 
              v-model="form.fileName" 
              label="Имя файла" 
              standout 
              dense
              :rules="[val => !!val || 'Обязательное поле']"
              readonly
            >
              <template v-slot:append>
                <q-btn 
                  flat 
                  round 
                  dense 
                  icon="description" 
                  @click="selectFile"
                  :disable="!form.filePath"
                >
                  <q-tooltip>{{ form.filePath ? 'Выбрать файл' : 'Сначала выберите каталог' }}</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Отмена" v-close-popup />
        <q-btn flat label="OK" @click="onOKClick" :disable="!isFormValid" />
      </q-card-actions>
    </q-card>

    <!-- Диалоги выбора -->
    <DirectorySelectDialog ref="directoryDialog" @ok="onDirectorySelected" />
    <FileSelectDialog 
      ref="fileDialog" 
      :path="form.filePath"
      @ok="onFileSelected" 
    />
  </q-dialog>
</template>

<script>
import { ref, computed } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import DirectorySelectDialog from './DirectorySelectDialog.vue'
import FileSelectDialog from './FileSelectDialog.vue'

export default {
  name: 'DictionaryForm',

  components: {
    DirectorySelectDialog,
    FileSelectDialog
  },

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup() {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const $q = useQuasar()
    const directoryDialog = ref(null)
    const fileDialog = ref(null)

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

    const selectDirectory = async () => {
      try {
        directoryDialog.value.show()
      } catch (error) {
        console.error('Error showing directory dialog:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при открытии диалога выбора каталога'
        })
      }
    }

    const selectFile = async () => {
      if (!form.value.filePath) {
        $q.notify({
          type: 'warning',
          message: 'Сначала выберите каталог'
        })
        return
      }

      try {
        fileDialog.value.show()
      } catch (error) {
        console.error('Error showing file dialog:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при открытии диалога выбора файла'
        })
      }
    }

    const onDirectorySelected = (directory) => {
      form.value.filePath = directory.value
      form.value.fileName = '' // Сбрасываем имя файла при смене каталога
    }

    const onFileSelected = (file) => {
      form.value.fileName = file.name
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

    return {
      dialogRef,
      onDialogHide,
      onOKClick,
      form,
      isEdit,
      isFormValid,
      show,
      selectDirectory,
      selectFile,
      onDirectorySelected,
      onFileSelected,
      directoryDialog,
      fileDialog
    }
  }
}
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw
</style>
