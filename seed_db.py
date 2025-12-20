from app.db.session import SessionLocal
from app.db.base import Branch

def seed_branches():
    db = SessionLocal()
    branches = ["Tel-Aviv", "Haifa", "Rishon-Lezion", "Natanya", "Beer-Sheva", "Gan-Shmuel", "Eilat", "Petah-Tikva", "Kfar-Saba", "Ashdod"]
    try:
        for branch_name in branches:
            existing = db.query(Branch).filter(Branch.name == branch_name).first()
            if not existing:
                new_branch = Branch(name=branch_name)
                db.add(new_branch)
                print(f"Added branch: {branch_name}")
        db.commit()
        print("Seeding completed successfully")
    except Exception as e:
        db.rollback()
        print(f"Error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_branches()





