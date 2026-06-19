from dataclasses import dataclass


@dataclass(frozen=True)
class NpsResult:
    n: int
    promoters: int
    neutrals: int
    detractors: int
    nps: int
    promoter_share: float
    neutral_share: float
    detractor_share: float


def structure_shares(promoters: int, neutrals: int, detractors: int) -> dict[str, float]:
    total = promoters + neutrals + detractors
    if total == 0:
        return {"promoters": 0, "neutrals": 0, "detractors": 0}
    return {
        "promoters": round(promoters / total * 100, 2),
        "neutrals": round(neutrals / total * 100, 2),
        "detractors": round(detractors / total * 100, 2),
    }


def calculate_nps(scores: list[int]) -> NpsResult:
    normalized = [int(score) for score in scores if score is not None]
    promoters = sum(1 for score in normalized if score >= 9)
    neutrals = sum(1 for score in normalized if 7 <= score <= 8)
    detractors = sum(1 for score in normalized if score <= 6)
    shares = structure_shares(promoters, neutrals, detractors)
    nps = round(shares["promoters"] - shares["detractors"]) if normalized else 0
    return NpsResult(
        n=len(normalized),
        promoters=promoters,
        neutrals=neutrals,
        detractors=detractors,
        nps=nps,
        promoter_share=shares["promoters"],
        neutral_share=shares["neutrals"],
        detractor_share=shares["detractors"],
    )
