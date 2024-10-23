<template>
  <q-page class="q-pa-md">
    <template v-if="collection">
      <div class="text-h4 q-mb-md">{{ collection.prompt }}</div>
      <p class="text-grey-8 q-mb-lg">{{ collection.description }}</p>
      
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <FieldsList 
            :fields="collection.fields" 
            @deleteField="handleDeleteField"
            @addField="showAddFieldDialog"
            @editField="showEditFieldDialog"
          />
        </div>
        <div class="col-12 col-md-6">
          <RelationsList 
            :relations="collection.relations" 
            @deleteRelation="handleDeleteRelation"
            @addRelation="showAddRelationDialog"
            @editRelation="showEditRelationDialog"
          />
        </div>
      </div>
    </template>
    <div v-else-if="!schemaStore.isLoading" class="text-center q-mt-xl">
      <h5 class="text-grey-7">Выберите сущность из списка слева</h5>
    </div>

    <FieldDialog 
      ref="fieldDialog" 
      @ok="handleFieldSave"
    />
    <RelationDialog 
      ref="relationDialog" 
      @ok="handleRelationSave"
    />
  </q-page>
</template>

<script>
import { defineComponent, computed, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useSchemaStore } from '../stores/schema'
import FieldsList from '../components/FieldsList.vue'
import RelationsList from '../components/RelationsList.vue'
import FieldDialog from '../components/FieldDialog.vue'
import RelationDialog from '../components/RelationDialog.vue'

export default defineComponent({
  name: 'CollectionDetails',

  components: {
    FieldsList,
    RelationsList,
    FieldDialog,
    RelationDialog
  },

  setup() {
    console.log('[CollectionDetails] Setup started')
    const route = useRoute()
    const $q = useQuasar()
    const schemaStore = useSchemaStore()
    const fieldDialog = ref(null)
    const relationDialog = ref(null)
    const editingFieldName = ref(null)
    const editingRelationName = ref(null)

    const collection = computed(() => {
      const name = route.params.name
      console.log('[CollectionDetails] Getting collection:', name)
      return name ? schemaStore.getCollectionByName(name) : null
    })

    watch(() => route.params.name, (newName) => {
      console.log('[CollectionDetails] Route name changed:', newName)
      if (newName) {
        schemaStore.setSelectedCollection(newName)
      }
    }, { immediate: true })

    const handleDeleteField = async (fieldName) => {
      try {
        const updatedFields = collection.value.fields.filter(f => f.name !== fieldName)
        await schemaStore.updateCollection(collection.value.name, {
          ...collection.value,
          fields: updatedFields
        })
        $q.notify({
          type: 'positive',
          message: 'Поле успешно удалено'
        })
      } catch (error) {
        console.error('[CollectionDetails] Error deleting field:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при удалении поля'
        })
      }
    }

    const handleDeleteRelation = async (relationName) => {
      try {
        const updatedRelations = { ...collection.value.relations }
        delete updatedRelations[relationName]
        await schemaStore.updateCollection(collection.value.name, {
          ...collection.value,
          relations: updatedRelations
        })
        $q.notify({
          type: 'positive',
          message: 'Связь успешно удалена'
        })
      } catch (error) {
        console.error('[CollectionDetails] Error deleting relation:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при удалении связи'
        })
      }
    }

    const showAddFieldDialog = () => {
      console.log('[CollectionDetails] Showing add field dialog')
      editingFieldName.value = null
      fieldDialog.value.show()
    }

    const showEditFieldDialog = (field) => {
      console.log('[CollectionDetails] Showing edit field dialog:', field.name)
      editingFieldName.value = field.name
      fieldDialog.value.show(field)
    }

    const showAddRelationDialog = () => {
      console.log('[CollectionDetails] Showing add relation dialog')
      editingRelationName.value = null
      relationDialog.value.show()
    }

    const showEditRelationDialog = (relation) => {
      console.log('[CollectionDetails] Showing edit relation dialog:', relation.name)
      editingRelationName.value = relation.name
      relationDialog.value.show(relation)
    }

    const handleFieldSave = async (fieldData) => {
      try {
        const updatedFields = [...collection.value.fields]
        if (editingFieldName.value) {
          const index = updatedFields.findIndex(f => f.name === editingFieldName.value)
          if (index !== -1) {
            updatedFields[index] = fieldData
          }
        } else {
          updatedFields.push(fieldData)
        }
        
        await schemaStore.updateCollection(collection.value.name, {
          ...collection.value,
          fields: updatedFields
        })
        
        $q.notify({
          type: 'positive',
          message: `Поле успешно ${editingFieldName.value ? 'обновлено' : 'добавлено'}`
        })
      } catch (error) {
        console.error('[CollectionDetails] Error saving field:', error)
        $q.notify({
          type: 'negative',
          message: `Ошибка при ${editingFieldName.value ? 'обновлении' : 'добавлении'} поля`
        })
      }
    }

    const handleRelationSave = async (relationData) => {
      try {
        const updatedRelations = { ...collection.value.relations }
        if (editingRelationName.value) {
          delete updatedRelations[editingRelationName.value]
        }
        updatedRelations[relationData.name] = {
          type: relationData.type,
          target: relationData.target,
          foreignKey: relationData.foreignKey,
          restriction: relationData.restriction
        }
        
        await schemaStore.updateCollection(collection.value.name, {
          ...collection.value,
          relations: updatedRelations
        })
        
        $q.notify({
          type: 'positive',
          message: `Связь успешно ${editingRelationName.value ? 'обновлена' : 'добавлена'}`
        })
      } catch (error) {
        console.error('[CollectionDetails] Error saving relation:', error)
        $q.notify({
          type: 'negative',
          message: `Ошибка при ${editingRelationName.value ? 'обновлении' : 'добавлении'} связи`
        })
      }
    }

    console.log('[CollectionDetails] Setup completed')
    return {
      schemaStore,
      collection,
      handleDeleteField,
      handleDeleteRelation,
      showAddFieldDialog,
      showEditFieldDialog,
      showAddRelationDialog,
      showEditRelationDialog,
      handleFieldSave,
      handleRelationSave,
      fieldDialog,
      relationDialog
    }
  }
})
</script>

<style lang="sass">
.collection-details
  &__header
    margin-bottom: 2rem
  
  &__description
    color: $grey-7
    margin-bottom: 2rem
    
  &__content
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
    gap: 1rem
</style>