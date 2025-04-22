
import schedule
import time
import requests
import logging
import os
from datetime import datetime

# Crear directorio para logs si no existe
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'keep_alive.log')

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

API_URL = 'https://focci.onrender.com'

def ping_api():
    try:
        response = requests.get(API_URL)
        if response.status_code == 200:
            logging.info(f'✅ API pinged successfully - Status: {response.status_code}')
        else:
            logging.warning(f'⚠️ API responded with status code: {response.status_code}')
    except requests.RequestException as e:
        logging.error(f'❌ Error pinging API: {str(e)}')

def main():
    logging.info('🚀 Starting Focci API keep-alive service...')
    logging.info(f'📡 Target API URL: {API_URL}')
    logging.info(f'📝 Logs will be saved to: {log_file}')
    
    # Programar el ping cada 14 minutos
    schedule.every(14).minutes.do(ping_api)
    
    # Ejecutar el ping inmediatamente al iniciar
    ping_api()
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        logging.info('👋 Servicio detenido por el usuario')
    except Exception as e:
        logging.error(f'❌ Error inesperado: {str(e)}')

if __name__ == "__main__":
    main() 