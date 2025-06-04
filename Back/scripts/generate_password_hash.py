#!/usr/bin/env python3
"""
Script para generar hash de contraseña compatible con Focci
Usa el mismo sistema que la aplicación (passlib + bcrypt)
"""

import sys
import os
from passlib.context import CryptContext

# Configurar el contexto de password igual que en la aplicación
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_password_hash(password):
    """Generar hash de contraseña usando bcrypt"""
    return pwd_context.hash(password)

def verify_password(password, hashed):
    """Verificar si una contraseña coincide con su hash"""
    return pwd_context.verify(password, hashed)

def main():
    if len(sys.argv) > 1:
        password = sys.argv[1]
    else:
        password = "test123"
    
    print(f"🔐 Generando hash para la contraseña: '{password}'")
    hashed = generate_password_hash(password)
    print(f"📄 Hash generado: {hashed}")
    
    # Verificar que funciona
    print(f"✅ Verificación exitosa: {verify_password(password, hashed)}")
    
    return hashed

if __name__ == "__main__":
    main() 