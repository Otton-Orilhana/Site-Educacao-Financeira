# crud.py
from sqlalchemy.orm import Session
import models, json

def create_user(db: Session, email: str, password_hash: str, name: str | None = None):
    user = models.User(email=email, password_hash=password_hash, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_contents(db: Session):
    return db.query(models.Content).all()

def get_content(db: Session, content_id: int):
    return db.query(models.Content).filter(models.Content.id == content_id).first()

def add_progress(db: Session, user_id: int, content_id: int, status: str):
    progress = models.Progress(user_id=user_id, content_id=content_id, status=status)
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress

def get_progress_by_user(db: Session, user_id: int):
    return db.query(models.Progress).filter(models.Progress.user_id == user_id).order_by(models.Progress.timestamp.desc()).all()

def get_quiz(db: Session, quiz_id: int):
    return db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()

def submit_quiz_answers(db: Session, user_id: int, answers: list[dict]):
    total_points = 0
    results = []
    for ans in answers:
        quiz = get_quiz(db, ans["quiz_id"])
        if not quiz:
            continue
        correct = (ans["selected_option"] == quiz.correct_option)
        points_awarded = quiz.points if correct else 0
        attempt = models.QuizAttempt(
            user_id=user_id,
            quiz_id=quiz.id,
            selected_option=ans["selected_option"],
            correct=correct,
            points_awarded=points_awarded
        )
        db.add(attempt)
        total_points += points_awarded
        results.append({"quiz_id": quiz.id, "correct": correct, "points_awarded": points_awarded})
    db.commit()
    return {"total_points": total_points, "results": results}
