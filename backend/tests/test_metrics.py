from app.services.metrics import calculate_nps, structure_shares


def test_calculate_nps_counts_promoters_minus_detractors_as_integer():
    scores = [10, 9, 8, 7, 6, 0]

    result = calculate_nps(scores)

    assert result.n == 6
    assert result.promoters == 2
    assert result.neutrals == 2
    assert result.detractors == 2
    assert result.nps == 0


def test_structure_shares_returns_percentages_that_sum_to_100():
    shares = structure_shares(promoters=3, neutrals=1, detractors=1)

    assert shares == {"promoters": 60.0, "neutrals": 20.0, "detractors": 20.0}


def test_calculate_nps_empty_scores_returns_zeroed_result():
    result = calculate_nps([])

    assert result.n == 0
    assert result.nps == 0
    assert result.promoter_share == 0
    assert result.neutral_share == 0
    assert result.detractor_share == 0
