import spacy

# Palabras clave con pesos para detectar urgencia
URGENT_KEYWORDS = {
    'urgente': 3,
    'importante': 2,
    'inmediato': 3,
    'crítico': 3,
    'prioridad': 2,
    'crucial': 3,
    'vital': 2,
    'esencial': 2,
    'apremiante': 2,
    'indispensable': 2
}

# Palabras clave por tipo de tarea con sus prioridades mínimas
TASK_TYPE_KEYWORDS = {
    'examen': {'keywords': ['examen', 'prueba', 'evaluación', 'test', 'quiz'], 'min_priority': 3},
    'proyecto': {'keywords': ['proyecto', 'trabajo', 'desarrollo', 'implementación'], 'min_priority': 4},
    'lectura': {'keywords': ['lectura', 'leer', 'libro', 'capítulo', 'artículo'], 'min_priority': 2}
}

class TaskPrioritizer:
    def __init__(self):
        self.nlp = spacy.load('es_core_news_sm')

    def adjust_priority(self, task_description: str, subject_priority: int = 1) -> int:
        """
        Ajusta la prioridad en función de palabras clave urgentes en la descripción de la tarea.
        """
        doc = self.nlp(task_description.lower())
        task_description_lower = task_description.lower()
        
        # Detectar palabras clave de urgencia
        additional_priority = sum(URGENT_KEYWORDS.get(token.text, 0) for token in doc)
        
        if additional_priority > 0:
            print(f"Tarea marcada con {additional_priority} puntos adicionales de prioridad.")
        
        # Determinar el tipo de tarea y su prioridad mínima
        base_priority = subject_priority
        for task_type, info in TASK_TYPE_KEYWORDS.items():
            if any(keyword in task_description_lower for keyword in info['keywords']):
                base_priority = max(base_priority, info['min_priority'])
                break
        
        # Calcular la prioridad final
        final_priority = min(base_priority + additional_priority, 5)
        
        return final_priority
