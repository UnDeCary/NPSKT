from dataclasses import dataclass, field
from typing import Any, Iterable


NPS_REQUIRED_COLUMNS = [
    "ID анкеты",
    "Дата интервью",
    "Период / волна",
    "Сегмент",
    "База",
    "Компания",
    "Продукт",
    "Макрорегион",
    "Оценка NPS",
]

CALL_REQUIRED_COLUMNS = [
    "ID звонка",
    "Дата / неделя загрузки",
    "Период / волна",
    "Сегмент",
    "База",
    "Продукт",
    "Всего звонков",
    "Недозвоны",
    "Дозвоны",
    "Отказ / сброс",
    "Скринер",
    "Полная анкета",
    "План анкет",
    "Собрано анкет",
]

CALL_NUMERIC_COLUMNS = [
    "Всего звонков",
    "Недозвоны",
    "Дозвоны",
    "Отказ / сброс",
    "Скринер",
    "Полная анкета",
    "План анкет",
    "Собрано анкет",
]


@dataclass(frozen=True)
class DictionarySnapshot:
    segments: set[str]
    products: set[str]
    companies: set[str]
    technologies: set[str]
    macroregions: set[str]
    settlement_types: set[str]


@dataclass(frozen=True)
class ValidationErrorItem:
    row: int
    field: str
    message: str


@dataclass
class ValidationResult:
    total_rows: int
    new_rows: int = 0
    duplicate_ids: list[str] = field(default_factory=list)
    errors: list[ValidationErrorItem] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0


def _is_blank(value: Any) -> bool:
    return value is None or str(value).strip() == ""


def _as_int(value: Any) -> int | None:
    if isinstance(value, bool) or _is_blank(value):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _validate_required(row: dict[str, Any], row_number: int, required: Iterable[str], result: ValidationResult) -> None:
    for column in required:
        if _is_blank(row.get(column)):
            result.errors.append(
                ValidationErrorItem(row=row_number, field=column, message=f"Поле '{column}' обязательно")
            )


def _validate_dictionary(
    row: dict[str, Any],
    row_number: int,
    field_name: str,
    allowed: set[str],
    result: ValidationResult,
    allow_blank: bool = False,
) -> None:
    value = row.get(field_name)
    if allow_blank and _is_blank(value):
        return
    if not _is_blank(value) and str(value).strip() not in allowed:
        result.errors.append(
            ValidationErrorItem(
                row=row_number,
                field=field_name,
                message=f"Значение '{value}' в поле '{field_name}' отсутствует в справочнике",
            )
        )


def validate_nps_rows(
    rows: list[dict[str, Any]],
    dictionaries: DictionarySnapshot,
    existing_ids: set[str],
) -> ValidationResult:
    result = ValidationResult(total_rows=len(rows))
    seen_ids: set[str] = set()
    for index, row in enumerate(rows, start=2):
        before_errors = len(result.errors)
        _validate_required(row, index, NPS_REQUIRED_COLUMNS, result)
        survey_id = str(row.get("ID анкеты", "")).strip()
        if survey_id:
            if survey_id in existing_ids or survey_id in seen_ids:
                result.duplicate_ids.append(survey_id)
            seen_ids.add(survey_id)
        score = _as_int(row.get("Оценка NPS"))
        if score is None or score < 0 or score > 10:
            result.errors.append(
                ValidationErrorItem(row=index, field="Оценка NPS", message="Оценка NPS должна быть числом от 0 до 10")
            )
        _validate_dictionary(row, index, "Сегмент", dictionaries.segments, result)
        _validate_dictionary(row, index, "Продукт", dictionaries.products, result)
        _validate_dictionary(row, index, "Компания", dictionaries.companies, result)
        _validate_dictionary(row, index, "Технология", dictionaries.technologies, result, allow_blank=True)
        _validate_dictionary(row, index, "Макрорегион", dictionaries.macroregions, result)
        _validate_dictionary(row, index, "Тип населенного пункта", dictionaries.settlement_types, result, allow_blank=True)
        if len(result.errors) == before_errors and survey_id not in result.duplicate_ids:
            result.new_rows += 1
    return result


def validate_call_rows(
    rows: list[dict[str, Any]],
    dictionaries: DictionarySnapshot,
    existing_ids: set[str],
) -> ValidationResult:
    result = ValidationResult(total_rows=len(rows))
    seen_ids: set[str] = set()
    for index, row in enumerate(rows, start=2):
        before_errors = len(result.errors)
        _validate_required(row, index, CALL_REQUIRED_COLUMNS, result)
        call_id = str(row.get("ID звонка", "")).strip()
        if call_id:
            if call_id in existing_ids or call_id in seen_ids:
                result.duplicate_ids.append(call_id)
            seen_ids.add(call_id)
        for column in CALL_NUMERIC_COLUMNS:
            if _as_int(row.get(column)) is None or _as_int(row.get(column)) < 0:
                result.errors.append(
                    ValidationErrorItem(row=index, field=column, message=f"Поле '{column}' должно быть неотрицательным числом")
                )
        total = _as_int(row.get("Всего звонков"))
        no_answer = _as_int(row.get("Недозвоны"))
        answered = _as_int(row.get("Дозвоны"))
        refusal = _as_int(row.get("Отказ / сброс"))
        screener = _as_int(row.get("Скринер"))
        completed = _as_int(row.get("Полная анкета"))
        if None not in (total, no_answer, answered) and no_answer + answered != total:
            result.errors.append(
                ValidationErrorItem(row=index, field="Всего звонков", message="Логика воронки нарушена: недозвоны + дозвоны должны равняться всем звонкам")
            )
        if None not in (answered, refusal, screener, completed) and refusal + screener + completed > answered:
            result.errors.append(
                ValidationErrorItem(row=index, field="Дозвоны", message="Логика воронки нарушена: исходы дозвона превышают дозвоны")
            )
        _validate_dictionary(row, index, "Сегмент", dictionaries.segments, result)
        _validate_dictionary(row, index, "Продукт", dictionaries.products, result)
        _validate_dictionary(row, index, "Компания", dictionaries.companies, result, allow_blank=True)
        _validate_dictionary(row, index, "Технология", dictionaries.technologies, result, allow_blank=True)
        if len(result.errors) == before_errors and call_id not in result.duplicate_ids:
            result.new_rows += 1
    return result
