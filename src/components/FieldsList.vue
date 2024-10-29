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
                <q-item v-for="field in idFields" :key="field.name" class="q-py-xs" clickable @click="onEditField(field)">
                    <q-item-section>
                        <q-item-label class="text-subtitle2">
                            {{ field.name }}
                            <span v-if="field.name !== field.prompt" class="text-grey-6">
                                - {{ field.prompt }}
                            </span>
                            <q-badge
                                v-if="field.parent"
                                color="purple"
                                text-color="white"
                                class="q-ml-sm"
                            >
                                {{ getEntityPrompt(field.parent) }}
                            </q-badge>
                        </q-item-label>
                        <q-item-label>
                            <div class="row items-center field-badges">
                                <q-badge :color="isValidDataType(field.type) ? 'primary' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getFieldIcon(field.type)" size="16px" class="q-mr-xs" />
                                    {{ field.type }}
                                </q-badge>
                                <q-badge :color="isValidListType(field.list) ? 'secondary' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getListTypeIcon(field.list?.split('-')[1])" size="16px" class="q-mr-xs" />
                                    {{ field.list }}
                                </q-badge>
                                <q-badge :color="isValidInputType(field.input) ? 'orange' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getInputIcon(field.input)" size="16px" class="q-mr-xs" />
                                    {{ field.input }}
                                </q-badge>
                            </div>
                        </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <div class="row items-center">
                            <q-btn flat round dense color="grey-6" icon="delete" @click.stop="confirmDelete(field)">
                                <q-tooltip>Удалить поле</q-tooltip>
                            </q-btn>
                        </div>
                    </q-item-section>
                </q-item>
                <q-item v-for="field in referenceFields" :key="field.name" class="q-py-xs" clickable @click="onEditField(field)">
                    <q-item-section>
                        <q-item-label class="text-subtitle2">
                            {{ field.name }}
                            <span v-if="field.name !== field.prompt" class="text-grey-6">
                                - {{ field.prompt }}
                            </span>
                            <q-badge
                                v-if="field.parent"
                                color="purple"
                                text-color="white"
                                class="q-ml-sm"
                            >
                                {{ getEntityPrompt(field.parent) }}
                            </q-badge>
                        </q-item-label>
                        <q-item-label>
                            <div class="row items-center field-badges">
                                <q-badge :color="isValidDataType(field.type) ? 'primary' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getFieldIcon(field.type)" size="16px" class="q-mr-xs" />
                                    {{ field.type }}
                                </q-badge>
                                <q-badge :color="isValidListType(field.list) ? 'secondary' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getListTypeIcon(field.list?.split('-')[1])" size="16px" class="q-mr-xs" />
                                    {{ field.list }}
                                </q-badge>
                                <q-badge :color="isValidInputType(field.input) ? 'orange' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getInputIcon(field.input)" size="16px" class="q-mr-xs" />
                                    {{ field.input }}
                                </q-badge>
                            </div>
                        </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <div class="row items-center">
                            <q-btn flat round dense color="grey-6" icon="delete" @click.stop="confirmDelete(field)">
                                <q-tooltip>Удалить поле</q-tooltip>
                            </q-btn>
                        </div>
                    </q-item-section>
                </q-item>
                <q-item v-for="field in referencesFields" :key="field.name" class="q-py-xs" clickable @click="onEditField(field)">
                    <q-item-section>
                        <q-item-label class="text-subtitle2">
                            {{ field.name }}
                            <span v-if="field.name !== field.prompt" class="text-grey-6">
                                - {{ field.prompt }}
                            </span>
                            <q-badge
                                v-if="field.parent"
                                color="purple"
                                text-color="white"
                                class="q-ml-sm"
                            >
                                {{ getEntityPrompt(field.parent) }}
                            </q-badge>
                        </q-item-label>
                        <q-item-label>
                            <div class="row items-center field-badges">
                                <q-badge :color="isValidDataType(field.type) ? 'primary' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getFieldIcon(field.type)" size="16px" class="q-mr-xs" />
                                    {{ field.type }}
                                </q-badge>
                                <q-badge :color="isValidListType(field.list) ? 'secondary' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getListTypeIcon(field.list?.split('-')[1])" size="16px" class="q-mr-xs" />
                                    {{ field.list }}
                                </q-badge>
                                <q-badge :color="isValidInputType(field.input) ? 'orange' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getInputIcon(field.input)" size="16px" class="q-mr-xs" />
                                    {{ field.input }}
                                </q-badge>
                            </div>
                        </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <div class="row items-center">
                            <q-btn flat round dense color="grey-6" icon="delete" @click.stop="confirmDelete(field)">
                                <q-tooltip>Удалить поле</q-tooltip>
                            </q-btn>
                        </div>
                    </q-item-section>
                </q-item>
                <q-item v-for="field in otherFields" :key="field.name" class="q-py-xs" clickable @click="onEditField(field)">
                    <q-item-section>
                        <q-item-label class="text-subtitle2">
                            {{ field.name }}
                            <span v-if="field.name !== field.prompt" class="text-grey-6">
                                - {{ field.prompt }}
                            </span>
                            <q-badge
                                v-if="field.parent"
                                color="purple"
                                text-color="white"
                                class="q-ml-sm"
                            >
                                {{ getEntityPrompt(field.parent) }}
                            </q-badge>
                        </q-item-label>
                        <q-item-label>
                            <div class="row items-center field-badges">
                                <q-badge :color="isValidDataType(field.type) ? 'primary' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getFieldIcon(field.type)" size="16px" class="q-mr-xs" />
                                    {{ field.type }}
                                </q-badge>
                                <q-badge :color="isValidListType(field.list) ? 'secondary' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getListTypeIcon(field.list?.split('-')[1])" size="16px" class="q-mr-xs" />
                                    {{ field.list }}
                                </q-badge>
                                <q-badge :color="isValidInputType(field.input) ? 'orange' : 'negative'" class="q-mr-sm">
                                    <q-icon :name="getInputIcon(field.input)" size="16px" class="q-mr-xs" />
                                    {{ field.input }}
                                </q-badge>
                            </div>
                        </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <div class="row items-center">
                            <q-btn flat round dense color="grey-6" icon="delete" @click.stop="confirmDelete(field)">
                                <q-tooltip>Удалить поле</q-tooltip>
                            </q-btn>
                        </div>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card-section>
    </q-card>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { Dialog } from 'quasar'
import { getFieldIcon, getInputIcon, getFieldTypeLabel, getListTypeIcon, dataTypeOptions, listTypeOptions, inputTypeOptions } from '../dictionaries/fieldTypes'
import { useSchemaStore } from '../stores/schema'

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

        // Проверка существования типа ввода в справочнике
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
            return props.fields
                .filter(f => f.type === 'reference')
                .sort((a, b) => a.name.localeCompare(b.name))
        })

        const referencesFields = computed(() => {
            return props.fields
                .filter(f => f.type === 'references')
                .sort((a, b) => a.name.localeCompare(b.name))
        })

        const otherFields = computed(() => {
            return props.fields
                .filter(f => !['id', 'reference', 'references'].includes(f.type))
                .sort((a, b) => a.name.localeCompare(b.name))
        })

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
            otherFields
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
  top: -2px
  right: -2px
  transform: scale(0.7)

.text-h6
  font-size: 1.25rem
  font-weight: 500
  line-height: 2rem
  letter-spacing: 0.0125em

.q-badge
  font-size: 0.8em
  padding: 2px 6px
  border-radius: 4px
  font-weight: normal
</style>
