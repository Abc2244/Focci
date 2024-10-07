import spacy

# Palabras clave para detectar urgencia
URGENT_KEYWORDS = ['urgente', 'importante', 'inmediato', 'crítico', 'prioridad']

class TaskPrioritizer:
    def __init__(self):
        self.nlp = spacy.load('es_core_news_sm')

    def adjust_priority(self, task_description: str, subject_priority: int) -> int:
        doc = self.nlp(task_description.lower())
        if any(token.text in URGENT_KEYWORDS for token in doc):
            print("Tarea marcada como urgente.")
            return min(subject_priority + 2, 5)  # Aumenta más si es urgente, la prioridad máxima es 5
        return subject_priority
