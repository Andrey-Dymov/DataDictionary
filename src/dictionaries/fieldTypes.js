export const dataTypeOptions = [
  { label: 'id - Идентификатор', value: 'id' },
  { label: 'string - Строка', value: 'string' },
  { label: 'number - Число', value: 'number' },
  { label: 'float - Число с плавающей точкой', value: 'float' },
  { label: 'reference - Ссылка', value: 'reference' },
  { label: 'references - Ссылки', value: 'references' },
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
  { label: 'none - Нет', value: 'none', icon: 'not_interested' },
  { label: 'title - Заголовок', value: 'title', icon: 'title' },
  { label: 'subtitle - Подзаголовок', value: 'subtitle', icon: 'subtitles' },
  { label: 'label - Метка', value: 'label', icon: 'label' },
  { label: 'highlite - Подсветка', value: 'highlite', icon: 'highlight' },
  { label: 'badge - Бэдж', value: 'badge', icon: 'local_offer' },
  { label: 'toggle - Переключатель', value: 'toggle', icon: 'toggle_on' },
  { label: 'checkbox - Флажок', value: 'checkbox', icon: 'check_box' },
  { label: 'value - Значение', value: 'value', icon: 'tag' },
  { label: 'order - Порядок', value: 'order', icon: 'sort' },
  { label: 'count - Счетчик', value: 'count', icon: 'filter_9_plus' },
  { label: 'date - Дата', value: 'date', icon: 'event' },
  { label: 'content - Содержание', value: 'content', icon: 'article' },
  { label: 'code - Код', value: 'code', icon: 'code' },
  { label: 'inline - В строку', value: 'inline', icon: 'short_text' }
]

export const inputTypeOptions = [
  { label: 'none - Нет', value: 'none' },
  { label: 'string - Строка', value: 'string' },
  { label: 'select - Выбор', value: 'select' },
  { label: 'multiselect - Множественный выбор', value: 'multiselect' },
  { label: 'menu - Меню', value: 'menu' },
  { label: 'number - Число', value: 'number' },
  { label: 'date - Дата', value: 'date' },
  { label: 'time - Время', value: 'time' },
  { label: 'textarea - Текстовое поле', value: 'textarea' },
  { label: 'checkbox - Флажок', value: 'checkbox' },
  { label: 'email - Электронная почта', value: 'email' },
  { label: 'enum - Перечисление', value: 'enum' },
  { label: 'file - Файл', value: 'file' },
  { label: 'path - Путь', value: 'path' },
  { label: 'icon-select - Выбор иконки', value: 'icon-select' }
]

export const getFieldIcon = (type) => {
  switch (type) {
    case 'id': return 'fingerprint'
    case 'string': return 'text_fields'
    case 'number': return 'numbers'
    case 'float': return 'money'
    case 'date': return 'event'
    case 'time': return 'access_time'
    case 'checkbox': return 'check_box'
    case 'object': return 'code'
    case 'array': return 'view_list'
    case 'email': return 'email'
    case 'reference': return 'link'
    case 'references': return 'share'
    case 'numbers': return 'filter_9_plus'
    case 'textarea': return 'subject'
    case 'bool': return 'toggle_on'
    case '': return 'radio_button_unchecked'
    case null: return 'radio_button_unchecked'
    case undefined: return 'radio_button_unchecked'
    default: return 'help'
  }
}

export const getInputIcon = (type) => {
  switch (type) {
    case 'none': return 'not_interested'
    case 'text': return 'text_fields'
    case 'textarea': return 'subject'
    case 'select': return 'arrow_drop_down_circle'
    case 'multiselect': return 'checklist'
    case 'menu': return 'menu'
    case 'number': return 'numbers'
    case 'checkbox': return 'check_box'
    case 'file': return 'upload_file'
    case 'path': return 'folder_open'
    case 'icon-select': return 'emoji_symbols'
    case 'email': return 'email'
    case 'reference': return 'link'
    case 'numbers': return 'filter_9_plus'
    case 'enum': return 'list'
    case 'string': return 'text_fields'
    case 'date': return 'event'
    case 'time': return 'access_time'
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

export const getListTypeIcon = (type) => {
  switch (type) {
    case 'none': return 'not_interested'
    case 'title': return 'title'
    case 'subtitle': return 'subtitles'
    case 'label': return 'label'
    case 'highlite': return 'highlight'
    case 'badge': return 'local_offer'
    case 'toggle': return 'toggle_on'
    case 'checkbox': return 'check_box'
    case 'value': return 'tag'
    case 'order': return 'sort'
    case 'count': return 'filter_9_plus'
    case 'date': return 'event'
    case 'content': return 'article'
    case 'code': return 'code'
    case 'inline': return 'short_text'
    default: return 'help'
  }
}
