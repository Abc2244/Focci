import spacy

# Palabras clave con pesos para detectar urgencia
URGENT_KEYWORDS = {
    'urgente': 2,
    'importante': 1,
    'inmediato': 2,
    'crítico': 3,
    'prioridad': 1
}

class TaskPrioritizer:
    def __init__(self):
        self.nlp = spacy.load('es_core_news_sm')


    def adjust_priority(self, task_description: str, subject_priority: int = 1) -> int:
        """
        Ajusta la prioridad en función de palabras clave urgentes en la descripción de la tarea.
        """
        doc = self.nlp(task_description.lower())
        additional_priority = sum(URGENT_KEYWORDS.get(token.text, 0) for token in doc)
        
        if additional_priority > 0:
            print(f"Tarea marcada con {additional_priority} puntos adicionales de prioridad.")
        
        return min(subject_priority + additional_priority, 5)  # La prioridad máxima es 5
