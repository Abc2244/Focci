import PyPDF2
import re

def extract_subject_info_from_pdf(pdf_path):
    """Lee el PDF de horarios y extrae materias y sus créditos"""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()

    # Busca patrones de texto que contengan la información de materias y créditos
    subject_pattern = re.compile(r"Materia: (.+?) \(Créditos: (\d+)\)")
    subjects = subject_pattern.findall(text)

    # Retorna una lista de diccionarios con el nombre de la materia y sus créditos
    subject_info = [{"name": name, "credits": int(credits)} for name, credits in subjects]
    return subject_info

