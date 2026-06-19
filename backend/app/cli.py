from app.database import Base, SessionLocal, engine
from app.services.seed import seed_defaults


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_defaults(db)
    finally:
        db.close()
    print("Seed complete. Admin login: admin / admin123")


if __name__ == "__main__":
    main()
