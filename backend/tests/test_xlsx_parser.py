from io import BytesIO

from openpyxl import Workbook

from app.services.xlsx import parse_xlsx


def workbook_bytes(headers: list[str], row: list[object]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(headers)
    sheet.append(row)
    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def test_parse_xlsx_normalizes_sample_upload_layout():
    content = workbook_bytes(
        [
            "ВОЛНА",
            "Сегмент",
            "Услуга",
            "Продукт",
            "Компания",
            "ID Анкеты",
            "Оценка",
            "NPS",
            "Регион B2B",
            "Астана",
            "Алматы",
            "Карагандинская область (Караганда)",
        ],
        [
            "H1 2026",
            "B2C",
            "Интернет",
            "GPON",
            "Kazahtelecom",
            "S-1",
            "9 - девять",
            "Промоутер",
            "-",
            "",
            "",
            "Город",
        ],
    )

    rows = parse_xlsx(content)

    assert rows == [
        {
            "ID анкеты": "S-1",
            "Дата интервью": "2026-01-01",
            "Период / волна": "I полугодие 2026",
            "Сегмент": "B2C",
            "База": "Казахтелеком",
            "Компания": "Казахтелеком",
            "Продукт": "Интернет",
            "Технология": "GPON",
            "Макрорегион": "Центр",
            "Регион / область": "Карагандинская область",
            "Населенный пункт": "Караганда",
            "Тип населенного пункта": "Город",
            "Оценка NPS": 9,
        }
    ]
