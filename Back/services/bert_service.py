from transformers import AutoModelForSequenceClassification, AutoTokenizer

class BERTService:
    def __init__(self, model_name="dccuchile/bert-base-spanish-wwm-cased"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)

    async def classify_task(self, task_description):
        inputs = self.tokenizer(task_description, return_tensors="pt", padding=True, truncation=True)
        outputs = self.model(**inputs)
        logits = outputs.logits
        return logits.argmax(dim=-1).item()  # Simulación de clasificación de dificultad
