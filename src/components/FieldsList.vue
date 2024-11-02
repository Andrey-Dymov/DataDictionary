<template>
    <q-card flat bordered class="q-mb-md">
        <q-card-section>
            <div class="row items-center q-mb-md">
                <div class="text-h6 q-mr-auto">Поля</div>
                <q-btn flat round dense color="primary" icon="add" @click="onAddField">
                    <q-tooltip>Добавить поле</q-tooltip>
                </q-btn>
            </div>
            <q-list dense separator>
                <template v-for="group in fieldGroups" :key="group.name">
                    <div v-if="group.fields.length > 0" class="field-group-header">{{ group.label }}</div>
                    <template v-for="item in group.fields" :key="item.name">
                        <q-item class="q-py-xs" clickable @click="item.isCalculated ? null : onEditField(item)">
                            
                            <q-item-section avatar>
                                <q-avatar class="relative-position">
                                    <q-icon 
                                        :name="item.isCalculated ? getRelationIcon(item.type) : getFieldIcon(item.type)" 
                                        :color="item.isCalculated ? 'purple' : 'primary'"
                                    >
                                        <q-tooltip>{{ item.isCalculated ? getRelationTypeText(item.type) : getFieldTypeLabel(item.type) }}</q-tooltip>
                                    </q-icon>
                                    <q-badge 
                                        v-if="!item.isCalculated && item.req" 
                                        color="negative" 
                                        floating 
                                        round 
                                        size="6px" 
                                        class="required-badge"
                                    >
                                        <q-tooltip>Обязательное поле</q-tooltip>
                                    </q-badge>
                                </q-avatar>
                            </q-item-section>

                            <q-item-section>
                                <q-item-label class="text-subtitle2">
                                    {{ item.name }}
                                    <span v-if="!item.isCalculated && item.prompt" class="text-grey-6">
                                        - {{ item.prompt }}
                                    </span>
                                    <!-- Бейдж для обычных полей с родителем -->
                                    <q-badge
                                        v-if="item.parent && !item.isCalculated"
                                        color="deep-purple"
                                        text-color="white"
                                        class="q-ml-sm"
                                    >
                                        {{ getEntityPrompt(item.parent) }}
                                    </q-badge>
                                    <!-- Бейдж для расчетных связей -->
                                    <template v-if="item.isCalculated">
                                        <q-badge
                                            :color="item.direction === 'parent' ? 'deep-purple' : 'indigo'"
                                            text-color="white"
                                            class="q-ml-sm"
                                        >
                                            {{ getEntityPrompt(item.target) }}
                                        </q-badge>
                                        <q-badge
                                            color="grey-7"
                                            text-color="white"
                                            class="q-ml-sm"
                                        >
                                            {{ item.foreignKey }}
                                        </q-badge>
                                    </template>
                                </q-item-label>
                                <q-item-label>
                                    <div class="row items-center field-badges">
                                        <!-- Для обычных полей -->
                                        <template v-if="!item.isCalculated">
                                            <q-badge :color="isValidDataType(item.type) ? 'primary' : 'negative'" class="q-mr-sm">
                                                <q-icon :name="getFieldIcon(item.type)" size="16px" class="q-mr-xs" />
                                                {{ item.type }}
                                            </q-badge>
                                            <q-badge v-if="item.list" :color="isValidListType(item.list) ? 'secondary' : 'negative'" class="q-mr-sm">
                                                <q-icon :name="getListTypeIcon(item.list?.split('-')[1])" size="16px" class="q-mr-xs" />
                                                {{ item.list }}
                                            </q-badge>
                                            <q-badge v-if="item.input" :color="isValidInputType(item.input) ? 'orange' : 'negative'" class="q-mr-sm">
                                                <q-icon :name="getInputIcon(item.input)" size="16px" class="q-mr-xs" />
                                                {{ item.input }}
                                            </q-badge>
                                        </template>
                                    </div>
                                </q-item-label>
                            </q-item-section>

                            <q-item-section side v-if="!item.isCalculated">
                                <div class="row items-center">
                                    <q-btn flat round dense color="grey-6" icon="delete" @click.stop="confirmDelete(item)">
                                        <q-tooltip>Удалить поле</q-tooltip>
                                    </q-btn>
                                </div>
                            </q-item-section>
                        </q-item>
                    </template>
                </template>
            </q-list>
        </q-card-section>
    </q-card>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { Dialog } from 'quasar'
import { getFieldIcon, getInputIcon, getFieldTypeLabel, getListTypeIcon, dataTypeOptions, listTypeOptions, inputTypeOptions } from '../dictionaries/fieldTypes'
import { useSchemaStore } from '../stores/schema'
import { manyToManySvg, oneToManySvg, manyToOneSvg } from '../assets/icons/relations'

export default defineComponent({
    name: 'FieldsList',
    props: {
        fields: {
            type: Array,
            required: true
        }
    },
    emits: ['deleteField', 'addField', 'editField'],
    setup(props, { emit }) {
        const schemaStore = useSchemaStore()

        // Проверка существования типа данных в справочнике
        const isValidDataType = (type) => {
            return dataTypeOptions.some(opt => opt.value === type)
        }

        // Проверка существования типа списка в справочнике
        const isValidListType = (listType) => {
            if (!listType) return true
            const [section, type] = listType.split('-')
            return listTypeOptions.some(opt => opt.value === type)
        }

        // Проверка сществования типа ввода в справочнике
        const isValidInputType = (inputType) => {
            return inputTypeOptions.some(opt => opt.value === inputType)
        }

        const onAddField = () => {
            emit('addField')
        }

        const onEditField = (field) => {
            emit('editField', field)
        }

        const confirmDelete = (field) => {
            Dialog.create({
                title: 'Подтверждение',
                message: `Вы уверены, что хотите удалить поле "${field.prompt || field.name}"?`,
                cancel: {
                    label: 'Отмена',
                    flat: true
                },
                ok: {
                    label: 'Удалить',
                    color: 'negative',
                    flat: true
                },
                persistent: true
            }).onOk(() => {
                emit('deleteField', field.name)
            })
        }

        const getEntityPrompt = (entityName) => {
            const entity = schemaStore.getEntityByName(entityName)
            return entity ? entity.prompt || entity.name : entityName
        }

        // Добавляем computed для разных типов полей
        const idFields = computed(() => {
            return props.fields
                .filter(f => f.type === 'id')
                .sort((a, b) => a.name.localeCompare(b.name))
        })

        const referenceFields = computed(() => {
            console.log('[FieldsList] All fields:', props.fields)
            const refs = props.fields
                .filter(f => f.type === 'reference' || f.dataType === 'reference')
                .map(f => {
                    if (f.dataType) {
                        return {
                            name: f.name,
                            type: f.dataType,
                            list: f.listType ? `${f.section}-${f.listType}` : undefined,
                            input: f.inputType === 'none' ? undefined : f.inputType,
                            prompt: f.prompt,
                            req: f.required,
                            parent: f.parent
                        }
                    }
                    return f
                })
            console.log('[FieldsList] Reference fields:', refs)
            return refs.sort((a, b) => {
                const sectionA = a.list?.split('-')[0] || ''
                const sectionB = b.list?.split('-')[0] || ''
                if (sectionA === 'avatar' && sectionB !== 'avatar') return -1
                if (sectionA !== 'avatar' && sectionB === 'avatar') return 1
                return a.name.localeCompare(b.name)
            })
        })

        const referencesFields = computed(() => {
            return props.fields
                .filter(f => f.type === 'references' || f.dataType === 'references')
                .map(f => {
                    if (f.dataType) {
                        return {
                            name: f.name,
                            type: f.dataType,
                            list: f.listType ? `${f.section}-${f.listType}` : undefined,
                            input: f.inputType === 'none' ? undefined : f.inputType,
                            prompt: f.prompt,
                            req: f.required,
                            parent: f.parent
                        }
                    }
                    return f
                })
                .sort((a, b) => {
                    const sectionA = a.list?.split('-')[0] || ''
                    const sectionB = b.list?.split('-')[0] || ''
                    if (sectionA === 'avatar' && sectionB !== 'avatar') return -1
                    if (sectionA !== 'avatar' && sectionB === 'avatar') return 1
                    return a.name.localeCompare(b.name)
                })
        })

        const otherFields = computed(() => {
            return props.fields
                .filter(f => !['id', 'reference', 'references'].includes(f.type))
                .sort((a, b) => {
                    // Сначала сортируем по секции (avatar в начале)
                    const sectionA = a.list?.split('-')[0] || ''
                    const sectionB = b.list?.split('-')[0] || ''
                    if (sectionA === 'avatar' && sectionB !== 'avatar') return -1
                    if (sectionA !== 'avatar' && sectionB === 'avatar') return 1
                    // Затем по имени
                    return a.name.localeCompare(b.name)
                })
        })

        // Добавляем новые computed свойства после существующих групп полей
        const calculatedParentRelations = computed(() => {
            if (!props.fields) return []

            const relations = []
            const relationNames = new Set()
            
            // Сначала обрабатываем reference поля
            props.fields
                .filter(field => field.parent && field.type === 'reference')
                .forEach(field => {
                    // Убираем Id из имени поля
                    const baseName = field.name.endsWith('Id')
                        ? field.name.slice(0, -2)
                        : field.name

                    // Преобразуем в camelCase
                    const relationName = baseName.charAt(0).toLowerCase() + baseName.slice(1)

                    relations.push({
                        name: relationName,
                        type: 'belongsTo',
                        target: field.parent,
                        foreignKey: field.name,
                        isCalculated: true,
                        direction: 'parent'
                    })
                })

            // Затем обрабатываем references поля
            props.fields
                .filter(field => field.parent && field.type === 'references')
                .forEach(field => {
                    // Убираем Ids из имени поля
                    const baseName = field.name.endsWith('Ids')
                        ? field.name.slice(0, -3)
                        : field.name

                    // Преобразуем в camelCase и добавляем 's' в конце
                    const relationName = baseName.charAt(0).toLowerCase() + baseName.slice(1) + 's'

                    relations.push({
                        name: relationName,
                        type: 'belongsToMany',
                        target: field.parent,
                        foreignKey: field.name,
                        isCalculated: true,
                        direction: 'parent'
                    })
                })

            // Сортируем: сначала reference, потом references
            return relations.sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name)
                }
                return a.type === 'belongsTo' ? -1 : 1
            })
        })

        const calculatedChildRelations = computed(() => {
            if (!props.fields) return []
            
            const relations = []
            const relationNames = new Set()
            const currentEntityName = schemaStore.selectedEntityName

            // Добавляем только связи от поей с типом reference
            schemaStore.entities.forEach(childEntity => {
                if (childEntity.name === currentEntityName) return

                childEntity.fields
                    .filter(field => field.parent === currentEntityName && field.type === 'reference')
                    .forEach(field => {
                        // Формируем базовое имя связи
                        let relationName = childEntity.name
                        
                        // Если такое имя уже есть, добавляем имя поля
                        if (relationNames.has(relationName)) {
                            const fieldBaseName = field.name.endsWith('Id')
                                ? field.name.slice(0, -2)
                                : field.name
                            relationName = `${childEntity.name}${fieldBaseName.charAt(0).toUpperCase()}${fieldBaseName.slice(1)}`
                        }
                        relationNames.add(relationName)

                        relations.push({
                            name: relationName,
                            type: 'hasMany',
                            target: childEntity.name,
                            foreignKey: field.name,
                            isCalculated: true,
                            direction: 'child'
                        })
                    })
            })

            return relations.sort((a, b) => a.name.localeCompare(b.name))
        })

        // Добавляем новые группы в fieldGroups
        const fieldGroups = computed(() => [
            {
                name: 'id',
                label: 'Идентификаторы',
                fields: idFields.value
            },
            {
                name: 'reference',
                label: 'Ссылки на родителей',
                fields: referenceFields.value
            },
            {
                name: 'references',
                label: 'Множественные ссылки',
                fields: referencesFields.value
            },
            {
                name: 'other',
                label: 'Поля данных',
                fields: otherFields.value
            },
            {
                name: 'parent_relations',
                label: 'Родители',
                fields: calculatedParentRelations.value
            },
            {
                name: 'child_relations',
                label: 'Дети',
                fields: calculatedChildRelations.value
            }
        ])

        const getRelationIcon = (type) => {
            switch (type) {
                case 'hasMany': 
                    // Для hasMany используем иконку reference, так как это связь от reference поля
                    return getFieldIcon('reference')
                case 'belongsTo': 
                    // Для belongsTo используем иконку reference
                    return getFieldIcon('reference')
                case 'belongsToMany': 
                    // Для belongsToMany используем иконку references
                    return getFieldIcon('references')
                default: 
                    return 'help'
            }
        }

        const getRelationTypeText = (type) => {
            switch (type) {
                case 'hasMany': return 'Один ко многим'
                case 'belongsTo': return 'Многие к одному'
                case 'belongsToMany': return 'Многие ко многим'
                default: return 'Неизвестный тип'
            }
        }

        return {
            getFieldIcon,
            getInputIcon,
            getFieldTypeLabel,
            getListTypeIcon,
            isValidDataType,
            isValidListType,
            isValidInputType,
            onAddField,
            onEditField,
            confirmDelete,
            getEntityPrompt,
            idFields,
            referenceFields,
            referencesFields,
            otherFields,
            fieldGroups,
            getRelationIcon,
            getRelationTypeText,
            calculatedParentRelations,
            calculatedChildRelations
        }
    }
})
</script>

<style lang="sass">
.q-item
  &:hover
    background: rgba(0,0,0,0.03)

.relative-position
  position: relative

.q-badge
  position: relative
  display: inline-flex
  align-items: center

.field-badges
  display: flex
  flex-wrap: wrap
  gap: 4px
  align-items: center

  .q-badge
    margin-bottom: 4px

.required-badge
  position: absolute
  top: -2px
  right: -2px
  transform: translateX(50%) translateY(-50%)

.field-group-header
  padding: 8px 16px
  font-size: 0.9rem
  font-weight: 500
  text-transform: uppercase
  letter-spacing: 0.5px
</style>
