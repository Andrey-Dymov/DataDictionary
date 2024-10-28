export const dataTypeOptions = [
  { label: 'number - Число', value: 'number' },
  { label: 'string - Строка', value: 'string' },
  { label: 'reference - Ссылка', value: 'reference' },
  { label: 'textarea - Текстовое поле', value: 'textarea' },
  { label: 'date - Дата', value: 'date' },
  { label: 'time - Время', value: 'time' },
  { label: 'email - Электронная почта', value: 'email' },
  { label: 'numbers - Массив чисел', value: 'numbers' },
  { label: 'bool - Логическое', value: 'bool' },
  { label: 'object - Объект', value: 'object' }
]

export const sectionOptions = [
  { label: 'Avatar', value: 'avatar' },
  { label: 'Main', value: 'main' },
  { label: 'Data', value: 'data' }
]

export const listTypeOptions = [
  { label: 'title - Заголовок', value: 'title' },
  { label: 'subtitle - Подзаголовок', value: 'subtitle' },
  { label: 'label - Метка', value: 'label' },
  { label: 'highlite - Подсветка', value: 'highlite' },
  { label: 'badge - Бэдж', value: 'badge' },
  { label: 'toggle - Переключатель', value: 'toggle' },
  { label: 'checkbox - Флажок', value: 'checkbox' },
  { label: 'value - Значение', value: 'value' },
  { label: 'order - Порядок', value: 'order' },
  { label: 'count - Счетчик', value: 'count' },
  { label: 'date - Дата', value: 'date' },
  { label: 'content - Содержание', value: 'content' },
  { label: 'code - Код', value: 'code' },
  { label: 'inline - В строку', value: 'inline' }
]

export const inputTypeOptions = [
  { label: 'select - Выбор', value: 'select' },
  { label: 'multiselect - Множественный выбор', value: 'multiselect' },
  { label: 'string - Строка', value: 'string' },
  { label: 'textarea - Текстовое поле', value: 'textarea' },
  { label: 'date - Дата', value: 'date' },
  { label: 'time - Время', value: 'time' },
  { label: 'checkbox - Флажок', value: 'checkbox' },
  { label: 'email - Электронная почта', value: 'email' },
  { label: 'file - Файл', value: 'file' },
  { label: 'path - Путь', value: 'path' },
  { label: 'icon-select - Выбор иконки', value: 'icon-select' }
]

export const getFieldIcon = (type) => {
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

export const getInputIcon = (type) => {
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

export const getFieldTypeLabel = (type) => {
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
