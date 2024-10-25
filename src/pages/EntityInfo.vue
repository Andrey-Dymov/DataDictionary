<!-- Переименовываем из CollectionDetails.vue -->
<template>
    <q-page class="q-pa-md">
        <template v-if="entity"> <!-- было collection -->
            <!-- Информация о сущности -->
            <div class="entity-header q-mb-lg">
                <div class="row items-center q-mb-md">
                    <q-icon 
                        :name="entity.icon" 
                        size="36px" 
                        color="primary"
                        class="q-mr-md"
                    />
                    <div class="text-h4">{{ entity.prompt }}</div>
                </div>

                <!-- Основная информация о сущности -->
                <q-card flat bordered>
                    <q-card-section>
                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-md-6">
                                <q-field
                                    label="Название"
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline text-primary">{{ entity.name }}</div>
                                    </template>
                                </q-field>

                                <q-field
                                    label="Описание"
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline">{{ entity.description || 'Нет описания' }}</div>
                                    </template>
                                </q-field>
                            </div>

                            <div class="col-12 col-md-6">
                                <q-field
                                    label="Метка"
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline">{{ entity.prompt }}</div>
                                    </template>
                                </q-field>

                                <q-field
                                    label="Метка единственного числа"
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline">{{ entity.promptSingle }}</div>
                                    </template>
                                </q-field>

                                <q-field
                                    label="Иконка"
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline">
                                            <q-icon :name="entity.icon" size="1.2em" class="q-mr-sm" />
                                            {{ entity.icon }}
                                        </div>
                                    </template>
                                </q-field>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
            
            <!-- Поля и связи -->
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                    <FieldsList 
                        :fields="entity.fields" 
                        @deleteField="handleDeleteField"
                        @addField="showAddFieldDialog"
                        @editField="showEditFieldDialog"
                    />
                </div>
                <div class="col-12 col-md-6">
                    <RelationsList 
                        :relations="entity.relations" 
                        :source-name="entity.name"
                        :source-prompt="entity.prompt"
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

        <FieldForm 
            ref="fieldForm" 
            @ok="handleFieldSave"
        />
        <RelationForm 
            ref="relationForm" 
            :source-name="entity?.name"
            :source-prompt="entity?.prompt"
            :source-field="entity?.fields[0]?.name"
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
import FieldForm from '../components/FieldForm.vue'
import RelationForm from '../components/RelationForm.vue'

export default defineComponent({
    name: 'EntityInfo',  // Меняем имя компонента

    components: {
        FieldsList,
        RelationsList,
        FieldForm,
        RelationForm
    },

    setup() {
        console.log('[EntityInfo] Setup started')  // Обновляем логи
        const route = useRoute()
        const $q = useQuasar()
        const schemaStore = useSchemaStore()
        const fieldForm = ref(null)
        const relationForm = ref(null)
        const editingFieldName = ref(null)
        const editingRelationName = ref(null)

        const entity = computed(() => {  // Переименовываем из collection
            const name = route.params.name
            console.log('[EntityInfo] Getting entity:', name)  // Обновляем логи
            return name ? schemaStore.getCollectionByName(name) : null
        })

        // Добавляем методы обработки полей
        const handleDeleteField = async (fieldName) => {
            try {
                const updatedFields = entity.value.fields.filter(f => f.name !== fieldName)
                await schemaStore.updateCollection(entity.value.name, {
                    ...entity.value,
                    fields: updatedFields
                })
                $q.notify({
                    type: 'positive',
                    message: 'Поле успешно удалено'
                })
            } catch (error) {
                console.error('[EntityInfo] Error deleting field:', error)
                $q.notify({
                    type: 'negative',
                    message: 'Ошибка при удалении поля'
                })
            }
        }

        // Добавляем методы обработки связей
        const handleDeleteRelation = async (relationName) => {
            try {
                const updatedRelations = { ...entity.value.relations }
                delete updatedRelations[relationName]
                await schemaStore.updateCollection(entity.value.name, {
                    ...entity.value,
                    relations: updatedRelations
                })
                $q.notify({
                    type: 'positive',
                    message: 'Связь успешно удалена'
                })
            } catch (error) {
                console.error('[EntityInfo] Error deleting relation:', error)
                $q.notify({
                    type: 'negative',
                    message: 'Ошибка при удалении связи'
                })
            }
        }

        // Методы для форм
        const showAddFieldDialog = () => {
            console.log('[EntityInfo] Showing add field dialog')
            editingFieldName.value = null
            fieldForm.value.show()
        }

        const showEditFieldDialog = (field) => {
            console.log('[EntityInfo] Showing edit field dialog:', field.name)
            editingFieldName.value = field.name
            fieldForm.value.show(field)
        }

        const showAddRelationDialog = () => {
            console.log('[EntityInfo] Showing add relation dialog')
            editingRelationName.value = null
            relationForm.value.show()
        }

        const showEditRelationDialog = (relation) => {
            console.log('[EntityInfo] Showing edit relation dialog:', relation.name)
            editingRelationName.value = relation.name
            relationForm.value.show({
                ...relation,
                sourceField: entity.value.fields.find(f => f.name === relation.foreignKey)?.name
            })
        }

        // Методы сохранения
        const handleFieldSave = async (fieldData) => {
            try {
                const updatedFields = [...entity.value.fields]
                if (editingFieldName.value) {
                    const index = updatedFields.findIndex(f => f.name === editingFieldName.value)
                    if (index !== -1) {
                        updatedFields[index] = fieldData
                    }
                } else {
                    updatedFields.push(fieldData)
                }
                
                await schemaStore.updateCollection(entity.value.name, {
                    ...entity.value,
                    fields: updatedFields
                })
                
                $q.notify({
                    type: 'positive',
                    message: `Поле успешно ${editingFieldName.value ? 'обновлено' : 'добавлено'}`
                })
            } catch (error) {
                console.error('[EntityInfo] Error saving field:', error)
                $q.notify({
                    type: 'negative',
                    message: `Ошибка при ${editingFieldName.value ? 'обновлении' : 'добавлении'} поля`
                })
            }
        }

        const handleRelationSave = async (relationData) => {
            try {
                const updatedRelations = { ...entity.value.relations }
                if (editingRelationName.value) {
                    delete updatedRelations[editingRelationName.value]
                }
                updatedRelations[relationData.name] = {
                    type: relationData.type,
                    target: relationData.target,
                    foreignKey: relationData.foreignKey,
                    restriction: relationData.restriction
                }
                
                await schemaStore.updateCollection(entity.value.name, {
                    ...entity.value,
                    relations: updatedRelations
                })
                
                $q.notify({
                    type: 'positive',
                    message: `Связь успешно ${editingRelationName.value ? 'обновлена' : 'добавлена'}`
                })
            } catch (error) {
                console.error('[EntityInfo] Error saving relation:', error)
                $q.notify({
                    type: 'negative',
                    message: `Ошибка при ${editingRelationName.value ? 'обновлении' : 'добавлении'} связи`
                })
            }
        }

        // Возвращаем все необходимые методы и свойства
        return {
            schemaStore,
            entity,  // Переименовываем из collection
            handleDeleteField,
            handleDeleteRelation,
            showAddFieldDialog,
            showEditFieldDialog,
            showAddRelationDialog,
            showEditRelationDialog,
            handleFieldSave,
            handleRelationSave,
            fieldForm,
            relationForm
        }
    }
})
</script>

<style lang="sass">
.entity-header
    .q-card
        background: rgba(0,0,0,0.02)
        
    .text-subtitle2
        margin-bottom: 4px
    
.entity-info  // Переименовываем из collection-details
  &__header
    margin-bottom: 2rem
  
  &__description
    color: $grey-7
    margin-bottom: 2rem
    
  &__content
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
    gap: 1rem

.text-h4
  font-size: 2rem
  font-weight: 500
  line-height: 2.5rem
  letter-spacing: 0.0125em

.text-subtitle1
  font-size: 1rem
  font-weight: 400
  line-height: 1.75rem
  letter-spacing: 0.00937em

.q-field
  margin-bottom: 8px
  
  &__label
    color: rgba(0,0,0,0.6)
    font-weight: 500

  &__native, &__prefix, &__suffix
    color: rgba(0,0,0,0.87)
</style>
