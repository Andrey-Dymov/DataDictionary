<!-- Переименовываем из CollectionDetails.vue -->
<template>
    <q-page class="q-pa-md">
        <template v-if="entity">
            <!-- Новый компактный заголовок -->
            <div class="entity-header q-mb-lg">
                <div class="row items-center q-mb-xs">
                    <q-icon 
                        :name="entity.icon" 
                        size="36px" 
                        color="primary"
                        class="q-mr-md"
                    />
                    <div>
                        <div class="text-h4">
                            {{ entity.prompt }}
                            <span class="text-grey-7"> - {{ entity.name }}</span>
                        </div>
                        <div 
                            v-if="entity.description && entity.description !== entity.prompt" 
                            class="text-grey-8 text-subtitle1"
                        >
                            {{ entity.description }}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Только список полей -->
            <div class="row q-col-gutter-md">
                <div class="col-12">
                    <FieldsList 
                        :fields="entity.fields" 
                        @deleteField="handleDeleteField"
                        @addField="showAddFieldDialog"
                        @editField="showEditFieldDialog"
                    />
                </div>
            </div>
        </template>
        <div v-else-if="!schemaStore.isLoading" class="text-center q-mt-xl">
            <h5 class="text-grey-7">Выберите сущность из списка слева</h5>
        </div>

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
            return name ? schemaStore.getEntityByName(name) : null
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
                // Вызываем метод deleteField из schemaStore
                await schemaStore.deleteField(entityName.value, fieldName)
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

        // Добавляем computed для расчетных связей
        const calculatedRelations = computed(() => {
            if (!entity.value?.fields) return {}

            const relations = {}
            
            // 1. Добавляем связи на основе полей с родителями
            entity.value.fields.forEach(field => {
                if (field.parent) {
                    const relationType = field.type === 'references' 
                        ? 'belongsToMany' 
                        : 'belongsTo'

                    // Получаем имя связи из имени поля, убирая окончание Id/Ids
                    let relationName = field.name
                    if (relationName.endsWith('Ids')) {
                        relationName = relationName.slice(0, -3)
                    } else if (relationName.endsWith('Id')) {
                        relationName = relationName.slice(0, -2)
                    }
                    
                    relations[relationName] = {
                        type: relationType,
                        target: field.parent,
                        foreignKey: field.name,
                        restriction: 'restrict'
                    }
                }
            })

            // 2. Добавляем обратные связи от детей
            schemaStore.entities.forEach(childEntity => {
                if (childEntity.name === entity.value.name) return // Пропускаем текущую сущность

                // Ищем поля в дочерней сущности, которые ссылаются на текущую
                childEntity.fields.forEach(field => {
                    if (field.parent === entity.value.name && field.type === 'reference') {
                        // Для reference создаем hasMany
                        const relationName = childEntity.name // Имя связи = имя дочерней сущности
                        relations[relationName] = {
                            type: 'hasMany',
                            target: childEntity.name,
                            foreignKey: field.name,
                            restriction: 'restrict'
                        }
                    }
                    // Для references связь не создаем, так как это many-to-many и она уже создана с другой стороны
                })
            })

            return relations
        })

        // Форматируем JSON для отображения
        const calculatedRelationsJson = computed(() => {
            return JSON.stringify(calculatedRelations.value, null, 2)
        })

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
            relationForm,
            calculatedRelationsJson
        }
    }
})
</script>

<style lang="sass">
.entity-header
    .text-h4
        font-size: 2rem
        font-weight: 500
        line-height: 2.5rem
        letter-spacing: 0.0125em

        .text-grey-7
            font-size: inherit
            font-weight: inherit

    .text-subtitle1
        font-size: 1rem
        line-height: 1.5
        margin-top: 4px

.calculated-relations
    background: rgba(0,0,0,0.03)
    padding: 1rem
    border-radius: 4px
    font-family: monospace
    white-space: pre-wrap
    word-break: break-word
    margin: 0
    font-size: 0.9rem
    line-height: 1.4
</style>
