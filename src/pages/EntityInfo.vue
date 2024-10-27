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
                        <div class="row wrap q-col-gutter-xs">
                            <!-- Название - всегда первое и шире остальных -->
                            <div class="entity-field-item" style="min-width: 250px">
                                <q-field
                                    label="Название"
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline text-primary">
                                            {{ entity.name }}
                                        </div>
                                    </template>
                                </q-field>
                            </div>

                            <!-- Метка -->
                            <div class="entity-field-item" style="min-width: 200px">
                                <q-field
                                    label="Метка"
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline">
                                            {{ entity.prompt || '-' }}
                                        </div>
                                    </template>
                                </q-field>
                            </div>

                            <!-- Метка ед.ч. -->
                            <div class="entity-field-item" style="min-width: 200px">
                                <q-field
                                    label="Метка ед.ч."
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline">
                                            {{ entity.promptSingle || '-' }}
                                        </div>
                                    </template>
                                </q-field>
                            </div>

                            <!-- Иконка -->
                            <div class="entity-field-item" style="min-width: 150px">
                                <q-field
                                    label="Иконка"
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline">
                                            <q-icon :name="entity.icon" size="1.2em" class="q-mr-sm" />
                                            {{ entity.icon || '-' }}
                                        </div>
                                    </template>
                                </q-field>
                            </div>

                            <!-- Описание - если есть -->
                            <div v-if="entity.description" class="entity-field-item" style="min-width: 300px">
                                <q-field
                                    label="Описание"
                                    stack-label
                                    dense
                                    borderless
                                >
                                    <template v-slot:control>
                                        <div class="self-center full-width no-outline">
                                            {{ entity.description }}
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

        <!-- Исправляем передачу пропсов в формы -->
        <FieldForm 
            ref="fieldForm"
            :entity-name="entityName"
        />
        <RelationForm 
            ref="relationForm" 
            :source-name="entityName"
            :source-prompt="entityPrompt"
            :source-field="entityFields[0]?.name"
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

        // Добавляем вычисляемые свойства для безопасного доступа
        const entityName = computed(() => entity.value?.name || '')
        const entityPrompt = computed(() => entity.value?.prompt || '')
        const entityFields = computed(() => entity.value?.fields || [])
        const entityRelations = computed(() => entity.value?.relations || {})
        const entityIcon = computed(() => entity.value?.icon || '')

        // Вычисляем поля для отображения
        const entityFieldsForDisplay = computed(() => {
            if (!entity.value) return []
            
            return [
                { label: 'Название', value: entity.value.name, isPrimary: true },
                { label: 'Метка', value: entity.value.prompt || '-' },
                { label: 'Метка ед.ч.', value: entity.value.promptSingle || '-' },
                { label: 'Иконка', value: entity.value.icon || '-' },
                { label: 'Описание', value: entity.value.description || '-' }
            ].filter(field => field.value !== '-') // Убираем пустые поля
        })

        // Определяем класс для колонок
        const getColumnClass = (fields) => {
            const count = fields.length
            if (count <= 2) return 'col-12 col-sm-6'
            if (count <= 3) return 'col-12 col-sm-4'
            if (count <= 4) return 'col-12 col-sm-3'
            return 'col-12 col-sm-2'
        }

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
            fieldForm.value.show()
        }

        const showEditFieldDialog = (field) => {
            fieldForm.value.show(field)
        }

        // Методы для форм связей
        const showAddRelationDialog = () => {
            relationForm.value.show()
        }

        const showEditRelationDialog = (relation) => {
            relationForm.value.show(relation)
        }

        // Возвращаем все необходимые методы и свойства
        return {
            schemaStore,
            entity,  // Переименовываем из collection
            entityName,      // Добавляем в return
            entityPrompt,    // Добавляем в return
            entityFields,    // Добавляем в return
            entityRelations, // Добавляем в return
            entityIcon,      // Добавляем в return
            handleDeleteField,
            handleDeleteRelation,
            showAddFieldDialog,
            showEditFieldDialog,
            showAddRelationDialog,
            showEditRelationDialog,
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
