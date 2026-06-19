from app.services.upload_validation import (
    DictionarySnapshot,
    validate_call_rows,
    validate_nps_rows,
)


def snapshot() -> DictionarySnapshot:
    return DictionarySnapshot(
        segments={"B2C", "B2B"},
        products={"Интернет", "Телевидение", "FMS"},
        companies={"Казахтелеком", "Beeline", "Alma TV"},
        technologies={"ADSL", "GPON"},
        macroregions={"Центр", "Север", "Юг", "Запад", "Восток", "Алматы", "Астана"},
        settlement_types={"Город", "Село"},
    )


def test_validate_nps_rows_accepts_valid_rows_and_reports_existing_duplicate():
    rows = [
        {
            "ID анкеты": "A-1",
            "Дата интервью": "2026-06-01",
            "Период / волна": "I полугодие 2026",
            "Сегмент": "B2C",
            "База": "Казахтелеком",
            "Компания": "Казахтелеком",
            "Продукт": "Интернет",
            "Технология": "GPON",
            "Макрорегион": "Алматы",
            "Регион / область": "Алматы",
            "Населенный пункт": "Алматы",
            "Тип населенного пункта": "Город",
            "Оценка NPS": 10,
        },
        {
            "ID анкеты": "A-2",
            "Дата интервью": "2026-06-02",
            "Период / волна": "I полугодие 2026",
            "Сегмент": "B2C",
            "База": "Казахтелеком",
            "Компания": "Beeline",
            "Продукт": "Интернет",
            "Технология": "ADSL",
            "Макрорегион": "Центр",
            "Регион / область": "Караганда",
            "Населенный пункт": "Караганда",
            "Тип населенного пункта": "Город",
            "Оценка NPS": 6,
        },
    ]

    result = validate_nps_rows(rows, snapshot(), existing_ids={"A-2"})

    assert result.total_rows == 2
    assert result.new_rows == 1
    assert result.duplicate_ids == ["A-2"]
    assert result.errors == []


def test_validate_nps_rows_blocks_bad_score_and_dictionary_value():
    rows = [
        {
            "ID анкеты": "A-3",
            "Дата интервью": "2026-06-02",
            "Период / волна": "I полугодие 2026",
            "Сегмент": "B2X",
            "База": "Казахтелеком",
            "Компания": "Unknown",
            "Продукт": "Интернет",
            "Технология": "GPON",
            "Макрорегион": "Алматы",
            "Регион / область": "Алматы",
            "Населенный пункт": "Алматы",
            "Тип населенного пункт": "Город",
            "Оценка NPS": 12,
        }
    ]

    result = validate_nps_rows(rows, snapshot(), existing_ids=set())

    assert result.new_rows == 0
    assert any("Сегмент" in error.message for error in result.errors)
    assert any("Компания" in error.message for error in result.errors)
    assert any("Оценка NPS" in error.message for error in result.errors)


def test_validate_call_rows_checks_funnel_totals():
    rows = [
        {
            "ID звонка": "C-1",
            "Дата / неделя загрузки": "2026-W23",
            "Период / волна": "I полугодие 2026",
            "Сегмент": "B2C",
            "База": "Казахтелеком",
            "Компания": "Казахтелеком",
            "Продукт": "Интернет",
            "Технология": "GPON",
            "Всего звонков": 10,
            "Недозвоны": 3,
            "Дозвоны": 7,
            "Отказ / сброс": 2,
            "Скринер": 2,
            "Полная анкета": 3,
            "План анкет": 8,
            "Собрано анкет": 3,
        }
    ]

    result = validate_call_rows(rows, snapshot(), existing_ids=set())

    assert result.total_rows == 1
    assert result.new_rows == 1
    assert result.errors == []


def test_validate_call_rows_blocks_inconsistent_call_funnel():
    rows = [
        {
            "ID звонка": "C-2",
            "Дата / неделя загрузки": "2026-W23",
            "Период / волна": "I полугодие 2026",
            "Сегмент": "B2C",
            "База": "Казахтелеком",
            "Компания": "Казахтелеком",
            "Продукт": "Интернет",
            "Технология": "",
            "Всего звонков": 5,
            "Недозвоны": 3,
            "Дозвоны": 3,
            "Отказ / сброс": 0,
            "Скринер": 0,
            "Полная анкета": 1,
            "План анкет": 8,
            "Собрано анкет": 1,
        }
    ]

    result = validate_call_rows(rows, snapshot(), existing_ids=set())

    assert result.new_rows == 0
    assert any("ворон" in error.message.lower() for error in result.errors)
