from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Bet, MarketDefinition, Match, MatchMarket, MatchStats, Role, Team, User, WalletLedger
from app.security import create_password_hash


def seed_database(db: Session) -> None:
    if db.scalar(select(Role).limit(1)):
        ensure_market_catalog(db)
        for match in db.scalars(select(Match).where(Match.status.in_(["SCHEDULED", "NS", "TBD"]))).all():
            _add_default_markets(db, match)
        db.commit()
        return

    admin_role = Role(name="admin")
    player_role = Role(name="player")
    db.add_all([admin_role, player_role])
    db.flush()

    admin = User(
        username="admin",
        display_name="Admin",
        email="admin@example.local",
        password_hash=create_password_hash("admin123"),
        role_id=admin_role.id,
        wallet_balance=Decimal("0.00"),
    )
    demo = User(
        username="demo",
        display_name="Bạn",
        email="demo@example.local",
        password_hash=create_password_hash("demo123"),
        role_id=player_role.id,
        wallet_balance=Decimal("2450.00"),
    )
    players = [
        User(username="minh", display_name="Minh Triết", password_hash=create_password_hash("demo123"), role_id=player_role.id, wallet_balance=Decimal("15420")),
        User(username="thanh", display_name="Thanh Hằng", password_hash=create_password_hash("demo123"), role_id=player_role.id, wallet_balance=Decimal("12110")),
        User(username="quoc", display_name="Quốc Bảo", password_hash=create_password_hash("demo123"), role_id=player_role.id, wallet_balance=Decimal("11850")),
    ]
    db.add_all([admin, demo, *players])
    db.flush()

    db.add(WalletLedger(user_id=demo.id, actor_id=admin.id, amount=Decimal("2450"), kind="admin_topup", reason="Seed balance", balance_after=demo.wallet_balance))

    teams = {
        code: Team(provider_id=str(index), code=code, name=name, country=name)
        for index, (code, name) in enumerate(
            [
                ("BRA", "Brazil"),
                ("FRA", "Pháp"),
                ("ARG", "Argentina"),
                ("NED", "Hà Lan"),
                ("MEX", "Mexico"),
                ("GER", "Đức"),
                ("ESP", "Tây Ban Nha"),
                ("POR", "Bồ Đào Nha"),
                ("URU", "Uruguay"),
                ("SRB", "Serbia"),
                ("RSA", "South Africa"),
                ("KOR", "South Korea"),
                ("CZE", "Czechia"),
                ("CAN", "Canada"),
                ("BIH", "Bosnia and Herzegovina"),
                ("QAT", "Qatar"),
                ("SUI", "Switzerland"),
                ("MAR", "Morocco"),
                ("HAI", "Haiti"),
                ("SCO", "Scotland"),
                ("USA", "United States"),
                ("PAR", "Paraguay"),
                ("AUS", "Australia"),
                ("TUR", "Türkiye"),
                ("CUW", "Curaçao"),
                ("CIV", "Côte d'Ivoire"),
                ("ECU", "Ecuador"),
                ("JPN", "Japan"),
                ("SWE", "Sweden"),
                ("TUN", "Tunisia"),
                ("BEL", "Belgium"),
                ("EGY", "Egypt"),
                ("IRN", "Iran"),
                ("NZL", "New Zealand"),
                ("CPV", "Cabo Verde"),
                ("KSA", "Saudi Arabia"),
                ("SEN", "Senegal"),
                ("IRQ", "Iraq"),
                ("NOR", "Norway"),
                ("ALG", "Algeria"),
                ("AUT", "Austria"),
                ("JOR", "Jordan"),
                ("COD", "Congo DR"),
                ("UZB", "Uzbekistan"),
                ("COL", "Colombia"),
                ("ENG", "England"),
                ("CRO", "Croatia"),
                ("GHA", "Ghana"),
                ("PAN", "Panama"),
            ],
            start=1,
        )
    }
    db.add_all(teams.values())
    db.flush()

    market_defs = [
        ("correct_score", "Dự đoán tỷ số", "score", "correct_score", False, Decimal("2.45"), 1),
        ("match_result", "Kết quả 1X2", "single", "match_result", False, Decimal("1.80"), 2),
        ("draw_no_bet", "Draw no bet", "single", "draw_no_bet", False, Decimal("1.65"), 3),
        ("handicap", "Handicap", "line", "handicap", False, Decimal("1.90"), 4),
        ("total_goals", "Tổng bàn thắng", "line", "total_goals", False, Decimal("1.90"), 5),
        ("btts", "Hai đội cùng ghi bàn", "single", "btts", False, Decimal("1.95"), 6),
        ("corners_total", "Tổng phạt góc", "line", "corners_total", True, Decimal("1.90"), 7),
        ("cards_total", "Tổng thẻ", "line", "cards_total", True, Decimal("1.90"), 8),
        ("tournament_winner", "Vô địch giải", "outright", "tournament_winner", False, Decimal("50.00"), 9),
        ("golden_boot", "Dự đoán Vua phá lưới", "outright", "golden_boot", False, Decimal("120.00"), 10),
    ]
    db.add_all(
        [
            MarketDefinition(
                key=key,
                name=name,
                market_type=market_type,
                settlement_rule=rule,
                internal_only=internal_only,
                default_multiplier=multiplier,
                display_order=display_order,
            )
            for key, name, market_type, rule, internal_only, multiplier, display_order in market_defs
        ]
    )
    db.flush()

    matches = [
        Match(provider_id="seed-1", stage="Group Stage - 1", group_name="Bảng G", home_team_id=teams["BRA"].id, away_team_id=teams["FRA"].id, starts_at=_dt("2026-06-11T19:00:00+00:00"), status="SCHEDULED", venue="Estadio Azteca", city="Mexico City"),
        Match(provider_id="seed-2", stage="Group Stage - 1", group_name="Bảng C", home_team_id=teams["ARG"].id, away_team_id=teams["MEX"].id, starts_at=_dt("2026-06-14T02:00:00+00:00"), status="SCHEDULED", venue="MetLife Stadium", city="New York"),
        Match(provider_id="seed-3", stage="Group Stage - 1", group_name="Bảng E", home_team_id=teams["GER"].id, away_team_id=teams["ESP"].id, starts_at=_dt("2026-06-15T23:45:00+00:00"), status="SCHEDULED", venue="SoFi Stadium", city="Los Angeles"),
        Match(provider_id="seed-4", stage="Quarter-finals", group_name=None, home_team_id=teams["ARG"].id, away_team_id=teams["NED"].id, starts_at=_dt("2026-06-20T21:00:00+00:00"), status="SCHEDULED", venue="AT&T Stadium", city="Dallas"),
        Match(provider_id="seed-5", stage="Archive", group_name="Bảng G", home_team_id=teams["BRA"].id, away_team_id=teams["SRB"].id, starts_at=_dt("2026-06-01T21:00:00+00:00"), status="FT", home_score=2, away_score=1, venue="BC Place", city="Vancouver"),
    ]
    db.add_all(matches)
    db.flush()
    db.add(MatchStats(match_id=matches[-1].id, corners_home=7, corners_away=3, yellow_cards_home=1, yellow_cards_away=3))

    for match in matches[:-1]:
        _add_default_markets(db, match)

    won_bet = Bet(
        user_id=demo.id,
        match_id=matches[-1].id,
        market_key="match_result",
        selection_key="home",
        selection_label="Brazil thắng",
        stake=Decimal("100.00"),
        locked_multiplier=Decimal("1.80"),
        potential_payout=Decimal("180.00"),
        status="won",
        points_delta=Decimal("80.00"),
        selection_json={},
        settled_at=_dt("2026-06-01T23:00:00+00:00"),
    )
    lost_bet = Bet(
        user_id=demo.id,
        match_id=matches[-1].id,
        market_key="correct_score",
        selection_key="3-0",
        selection_label="3 - 0",
        stake=Decimal("80.00"),
        locked_multiplier=Decimal("2.45"),
        potential_payout=Decimal("196.00"),
        status="lost",
        points_delta=Decimal("-80.00"),
        selection_json={"home_score": 3, "away_score": 0},
        settled_at=_dt("2026-06-01T23:00:00+00:00"),
    )
    db.add_all([won_bet, lost_bet])
    db.commit()


def ensure_market_catalog(db: Session) -> None:
    market_defs = [
        ("draw_no_bet", "Draw no bet", "single", "draw_no_bet", False, Decimal("1.65"), 3),
        ("handicap", "Handicap", "line", "handicap", False, Decimal("1.90"), 4),
    ]
    for key, name, market_type, rule, internal_only, multiplier, display_order in market_defs:
        if db.scalar(select(MarketDefinition).where(MarketDefinition.key == key)):
            continue
        db.add(
            MarketDefinition(
                key=key,
                name=name,
                market_type=market_type,
                settlement_rule=rule,
                internal_only=internal_only,
                default_multiplier=multiplier,
                display_order=display_order,
            )
        )


def _add_default_markets(db: Session, match: Match) -> None:
    closes_at = match.starts_at
    markets = [
        ("correct_score", "Dự đoán tỷ số", "exact", "Tỷ số chính xác", None, Decimal("2.45"), "internal"),
        ("match_result", "Kết quả 1X2", "home", "Đội nhà thắng", None, Decimal("1.85"), "odds-api"),
        ("match_result", "Kết quả 1X2", "draw", "Hòa", None, Decimal("3.10"), "odds-api"),
        ("match_result", "Kết quả 1X2", "away", "Đội khách thắng", None, Decimal("2.05"), "odds-api"),
        ("draw_no_bet", "Draw no bet", "home", "Đội nhà DNB", None, Decimal("1.58"), "internal"),
        ("draw_no_bet", "Draw no bet", "away", "Đội khách DNB", None, Decimal("1.78"), "internal"),
        ("handicap", "Handicap 0.5", "home", "Đội nhà -0.5", Decimal("-0.5"), Decimal("1.91"), "odds-api"),
        ("handicap", "Handicap 0.5", "away", "Đội khách +0.5", Decimal("0.5"), Decimal("1.91"), "odds-api"),
        ("total_goals", "Tổng bàn thắng 2.5", "over", "Tài 2.5", Decimal("2.5"), Decimal("1.92"), "odds-api"),
        ("total_goals", "Tổng bàn thắng 2.5", "under", "Xỉu 2.5", Decimal("2.5"), Decimal("1.88"), "odds-api"),
        ("btts", "Hai đội cùng ghi bàn", "yes", "Có", None, Decimal("1.95"), "odds-api"),
        ("btts", "Hai đội cùng ghi bàn", "no", "Không", None, Decimal("1.82"), "odds-api"),
        ("corners_total", "Tổng phạt góc 8.5", "over", "Tài góc 8.5", Decimal("8.5"), Decimal("1.90"), "internal"),
        ("corners_total", "Tổng phạt góc 8.5", "under", "Xỉu góc 8.5", Decimal("8.5"), Decimal("1.90"), "internal"),
        ("cards_total", "Tổng thẻ 3.5", "over", "Tài thẻ 3.5", Decimal("3.5"), Decimal("1.90"), "internal"),
        ("cards_total", "Tổng thẻ 3.5", "under", "Xỉu thẻ 3.5", Decimal("3.5"), Decimal("1.90"), "internal"),
    ]
    for market_key, label, selection_key, selection_label, line, multiplier, source in markets:
        existing_statement = select(MatchMarket).where(
            MatchMarket.match_id == match.id,
            MatchMarket.market_key == market_key,
            MatchMarket.selection_key == selection_key,
        )
        existing_statement = existing_statement.where(MatchMarket.line.is_(None) if line is None else MatchMarket.line == line)
        if db.scalar(existing_statement):
            continue
        db.add(
            MatchMarket(
                match_id=match.id,
                market_key=market_key,
                label=label,
                selection_key=selection_key,
                selection_label=selection_label,
                line=line,
                odds_multiplier=multiplier,
                source=source,
                closes_at=closes_at,
            )
        )


def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value).astimezone(timezone.utc)
