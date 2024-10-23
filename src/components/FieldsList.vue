<template>
    <q-card flat bordered class="q-mb-md">
        <q-card-section>
            <div class="row items-center q-mb-sm">
                <div class="text-subtitle2">Поля</div>
                <q-space />
                <q-btn flat round dense color="primary" icon="add" @click="$emit('addField')">
                    <q-tooltip>Добавить поле</q-tooltip>
                </q-btn>
            </div>
            <q-list dense separator>
                <q-item v-for="field in fields" :key="field.name" class="q-py-xs" clickable
                    @click="$emit('editField', field)">
                    <q-item-section avatar>
                        <q-avatar class="relative-position">
                            <q-icon :name="getFieldIcon(field.type)" color="primary">
                                <q-tooltip>{{ getFieldTypeLabel(field.type) }}</q-tooltip>
                            </q-icon>
                            <q-badge v-if="field.req" color="negative" floating round size="6px" class="required-badge">
                                <q-tooltip>Обязательное поле</q-tooltip>
                            </q-badge>
                        </q-avatar>
                    </q-item-section>

                    <q-item-section>
                        <q-item-label class="text-subtitle2">
                            {{ field.name }}
                            <span v-if="field.name !== field.prompt" class="text-grey-6">
                                - {{ field.prompt }}
                            </span>
                        </q-item-label>
                        <q-item-label>
                            <div class="row items-center field-badges">
                                <q-badge v-if="field.input || field.inputType" color="primary" class="q-mr-sm">
                                    <q-icon :name="getInputIcon(field.input || field.inputType)" size="16px" class="q-mr-xs" />
                                    {{ field.input || field.inputType }}
                                </q-badge>
                                <q-badge v-if="field.list" color="secondary" class="q-mr-sm">
                                    <q-icon name="list" size="16px" class="q-mr-xs" />
                                    {{ field.list }}
                                </q-badge>
                                <template v-if="field.mask">
                                    <q-badge color="accent" class="q-mr-sm">
                                        <q-icon name="format_shapes" size="16px" class="q-mr-xs" />
                                        {{ field.mask }}
                                    </q-badge>
                                </template>
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
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'

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
        const $q = useQuasar()

        const getFieldIcon = (type) => {
            switch (type) {
                case 'string': return 'text_fields'
                case 'number': return 'numbers'
                case 'date': return 'calendar_today'
                case 'time': return 'schedule'
                case 'checkbox': return 'check_box'
                case 'object': return 'code'
                case 'array': return 'view_list'
                case 'email': return 'email'
                case 'reference': return 'link'
                case 'numbers': return 'filter_9_plus'
                case 'textarea': return 'subject'
                default: return 'help'
            }
        }

        const getInputIcon = (type) => {
            switch (type) {
                case 'text': return 'text_fields'
                case 'textarea': return 'subject'
                case 'select': return 'arrow_drop_down_circle'
                case 'number': return 'numbers'
                case 'checkbox': return 'check_box'
                case 'file': return 'upload_file'
                case 'path': return 'folder_open'
                case 'icon-select': return 'format_list_bulleted'
                case 'email': return 'email'
                case 'reference': return 'link'
                case 'numbers': return 'filter_9_plus'
                default: return 'text_fields'
            }
        }

        const getFieldTypeLabel = (type) => {
            switch (type) {
                case 'string': return 'Строка'
                case 'number': return 'Число'
                case 'date': return 'Дата'
                case 'time': return 'Время'
                case 'checkbox': return 'Флажок'
                case 'object': return 'Объект'
                case 'array': return 'Массив'
                case 'email': return 'Email'
                case 'reference': return 'Ссылка'
                case 'numbers': return 'Массив чисел'
                case 'textarea': return 'Многострочный текст'
                default: return 'Неизвестный тип'
            }
        }

        const confirmDelete = (field) => {
            $q.dialog({
                title: 'Подтверждение',
                message: `Вы уверены, что хотите удалить поле "${field.prompt || field.name}"?`,
                cancel: true,
                persistent: true
            }).onOk(() => {
                emit('deleteField', field.name)
            })
        }

        return {
            getFieldIcon,
            getInputIcon,
            getFieldTypeLabel,
            confirmDelete
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
</style>