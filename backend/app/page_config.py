from dataclasses import dataclass


@dataclass(frozen=True)
class DashboardScope:
    key: str
    label: str
    segment: str | None = None
    product: str | None = None
    company: str | None = None
    technology: str | None = None


@dataclass(frozen=True)
class DashboardPage:
    key: str
    title: str
    breadcrumbs: list[str]
    primary: DashboardScope
    comparisons: list[DashboardScope]


SCOPES = {
    "total": DashboardScope("total", "Total NPS Казахтелеком"),
    "b2c": DashboardScope("b2c", "NPS B2C", segment="B2C"),
    "b2b": DashboardScope("b2b", "NPS B2B", segment="B2B"),
    "b2c-internet": DashboardScope("b2c-internet", "Интернет B2C", segment="B2C", product="Интернет"),
    "b2c-tv": DashboardScope("b2c-tv", "Телевидение B2C", segment="B2C", product="Телевидение"),
    "b2c-fms": DashboardScope("b2c-fms", "FMS B2C", segment="B2C", product="FMS"),
    "b2b-internet": DashboardScope("b2b-internet", "Корпоративный интернет", segment="B2B", product="Корпоративный интернет"),
    "b2b-ict": DashboardScope("b2b-ict", "ИКТ / Хостинг", segment="B2B", product="ИКТ / Хостинг"),
    "b2b-video": DashboardScope("b2b-video", "Облачное видеонаблюдение", segment="B2B", product="Облачное видеонаблюдение"),
    "adsl-b2c": DashboardScope("adsl-b2c", "ADSL", segment="B2C", product="Интернет", technology="ADSL"),
    "gpon-b2c": DashboardScope("gpon-b2c", "GPON", segment="B2C", product="Интернет", technology="GPON"),
    "beeline-internet": DashboardScope("beeline-internet", "Beeline", segment="B2C", product="Интернет", company="Beeline"),
    "kt-tv": DashboardScope("kt-tv", "Казахтелеком TV", segment="B2C", product="Телевидение", company="Казахтелеком"),
    "alma-tv": DashboardScope("alma-tv", "Alma TV", segment="B2C", product="Телевидение", company="Alma TV"),
    "beeline-tv": DashboardScope("beeline-tv", "Beeline TV", segment="B2C", product="Телевидение", company="Beeline"),
    "kt-fms": DashboardScope("kt-fms", "Казахтелеком FMS", segment="B2C", product="FMS", company="Казахтелеком"),
    "beeline-fms": DashboardScope("beeline-fms", "Beeline FMS", segment="B2C", product="FMS", company="Beeline"),
    "adsl-b2b": DashboardScope("adsl-b2b", "ADSL", segment="B2B", product="Корпоративный интернет", technology="ADSL"),
    "gpon-b2b": DashboardScope("gpon-b2b", "GPON", segment="B2B", product="Корпоративный интернет", technology="GPON"),
    "transtelecom-b2b-internet": DashboardScope(
        "transtelecom-b2b-internet",
        "Транстелеком",
        segment="B2B",
        product="Корпоративный интернет",
        company="Транстелеком",
    ),
    "jusan-b2b-internet": DashboardScope(
        "jusan-b2b-internet",
        "Jusan",
        segment="B2B",
        product="Корпоративный интернет",
        company="Jusan",
    ),
    "kt-ict": DashboardScope("kt-ict", "Казахтелеком ИКТ / Хостинг", segment="B2B", product="ИКТ / Хостинг", company="Казахтелеком"),
    "transtelecom-ict": DashboardScope("transtelecom-ict", "Транстелеком ИКТ / Хостинг", segment="B2B", product="ИКТ / Хостинг", company="Транстелеком"),
    "jusan-ict": DashboardScope("jusan-ict", "Jusan ИКТ / Хостинг", segment="B2B", product="ИКТ / Хостинг", company="Jusan"),
    "beeline-ict": DashboardScope("beeline-ict", "Beeline ИКТ / Хостинг", segment="B2B", product="ИКТ / Хостинг", company="Beeline"),
    "kt-b2b-video": DashboardScope(
        "kt-b2b-video",
        "Казахтелеком видеонаблюдение",
        segment="B2B",
        product="Облачное видеонаблюдение",
        company="Казахтелеком",
    ),
    "beeline-b2b-video": DashboardScope(
        "beeline-b2b-video",
        "Beeline видеонаблюдение",
        segment="B2B",
        product="Облачное видеонаблюдение",
        company="Beeline",
    ),
}


PAGES = {
    "home": DashboardPage(
        key="home",
        title="Главная",
        breadcrumbs=["Главная"],
        primary=SCOPES["total"],
        comparisons=[SCOPES["b2c"], SCOPES["b2b"]],
    ),
    "b2c": DashboardPage(
        key="b2c",
        title="B2C / Розничный бизнес",
        breadcrumbs=["B2C / Розничный бизнес", "Общий обзор"],
        primary=SCOPES["b2c"],
        comparisons=[SCOPES["b2c-internet"], SCOPES["b2c-tv"], SCOPES["b2c-fms"]],
    ),
    "b2b": DashboardPage(
        key="b2b",
        title="B2B / Корпоративный бизнес",
        breadcrumbs=["B2B / Корпоративный бизнес", "Общий обзор"],
        primary=SCOPES["b2b"],
        comparisons=[SCOPES["b2b-internet"], SCOPES["b2b-ict"], SCOPES["b2b-video"]],
    ),
    "b2c-internet": DashboardPage(
        key="b2c-internet",
        title="B2C Интернет",
        breadcrumbs=["B2C / Розничный бизнес", "Интернет"],
        primary=SCOPES["b2c-internet"],
        comparisons=[SCOPES["adsl-b2c"], SCOPES["gpon-b2c"], SCOPES["beeline-internet"]],
    ),
    "b2c-tv": DashboardPage(
        key="b2c-tv",
        title="B2C Телевидение",
        breadcrumbs=["B2C / Розничный бизнес", "Телевидение"],
        primary=SCOPES["b2c-tv"],
        comparisons=[SCOPES["kt-tv"], SCOPES["alma-tv"], SCOPES["beeline-tv"]],
    ),
    "b2c-fms": DashboardPage(
        key="b2c-fms",
        title="B2C FMS",
        breadcrumbs=["B2C / Розничный бизнес", "FMS"],
        primary=SCOPES["b2c-fms"],
        comparisons=[SCOPES["kt-fms"], SCOPES["beeline-fms"]],
    ),
    "b2b-internet": DashboardPage(
        key="b2b-internet",
        title="B2B Корпоративный интернет",
        breadcrumbs=["B2B / Корпоративный бизнес", "Корпоративный интернет"],
        primary=SCOPES["b2b-internet"],
        comparisons=[SCOPES["adsl-b2b"], SCOPES["gpon-b2b"], SCOPES["transtelecom-b2b-internet"], SCOPES["jusan-b2b-internet"]],
    ),
    "b2b-ict": DashboardPage(
        key="b2b-ict",
        title="B2B ИКТ / Хостинг",
        breadcrumbs=["B2B / Корпоративный бизнес", "ИКТ / Хостинг"],
        primary=SCOPES["b2b-ict"],
        comparisons=[SCOPES["kt-ict"], SCOPES["transtelecom-ict"], SCOPES["jusan-ict"], SCOPES["beeline-ict"]],
    ),
    "b2b-video": DashboardPage(
        key="b2b-video",
        title="B2B Облачное видеонаблюдение",
        breadcrumbs=["B2B / Корпоративный бизнес", "Облачное видеонаблюдение"],
        primary=SCOPES["b2b-video"],
        comparisons=[SCOPES["kt-b2b-video"], SCOPES["beeline-b2b-video"]],
    ),
}


def scope_filter(scope: DashboardScope) -> dict[str, str]:
    values = {
        "segment": scope.segment,
        "product": scope.product,
        "company": scope.company,
        "technology": scope.technology,
    }
    return {key: value for key, value in values.items() if value}
