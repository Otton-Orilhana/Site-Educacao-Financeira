# seed.py
from database import engine, SessionLocal, Base
import models
import json

Base.metadata.create_all(bind=engine)

def run_seed():
    db = SessionLocal()
    try:
        contents = [
            {"slug": "orcamento", "title": "Orçamento pessoal", "description": "Aprenda a controlar seus gastos."},
            {"slug": "investimentos", "title": "Investimentos básicos", "description": "Introdução à renda fixa e variável."},
            {"slug": "aposentadoria", "title": "Planejamento de aposentadoria", "description": "Como se preparar para o futuro."},
            {"slug": "dividas", "title": "Controle de dívidas", "description": "Estratégias para sair do vermelho."}
        ]

        created_contents = []
        for c in contents:
            existing = db.query(models.Content).filter(models.Content.slug == c["slug"]).first()
            if not existing:
                content = models.Content(slug=c["slug"], title=c["title"], description=c["description"])
                db.add(content)
                db.flush()
                created_contents.append(content)
            else:
                created_contents.append(existing)
        db.commit()

        quizzes = [
            {
                "content_slug": "orcamento",
                "question": "Qual é a primeira etapa para organizar suas finanças?",
                "options": {"a": "Fazer um orçamento", "b": "Investir em ações", "c": "Contratar um empréstimo"},
                "correct": "a",
                "points": 10
            },
            {
                "content_slug": "investimentos",
                "question": "O que é renda fixa?",
                "options": {"a": "Investimentos com retorno previsível", "b": "Ações de empresas", "c": "Criptomoedas"},
                "correct": "a",
                "points": 10
            }
        ]

        for q in quizzes:
            content = db.query(models.Content).filter(models.Content.slug == q["content_slug"]).first()
            if not content:
                continue
            exists = db.query(models.Quiz).filter(models.Quiz.content_id == content.id, models.Quiz.question == q["question"]).first()
            if exists:
                continue
            quiz = models.Quiz(
                content_id=content.id,
                question=q["question"],
                options_json=json.dumps(q["options"], ensure_ascii=False),
                correct_option=q["correct"],
                points=q["points"]
            )
            db.add(quiz)
        db.commit()
        print("Seed concluído: conteúdos e quizzes inseridos/atualizados.")
    except Exception as e:
        db.rollback()
        print("Erro durante seed:", e)
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
