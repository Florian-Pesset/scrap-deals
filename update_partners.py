import subprocess
import json
import os
import sys
from datetime import datetime

MIN_OFFERS = 80

def check_and_update_partners():
    try:
        subprocess.run(['node', 'scraper.js'], check=True)

        if not os.path.exists('all-offers.json'):
            raise Exception("Le fichier JSON n'a pas été créé")

        with open('all-offers.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        bourso = data.get('boursobank') or []
        if len(bourso) < MIN_OFFERS:
            raise Exception(
                f"Catalogue The Corner trop petit ({len(bourso)} offres, minimum {MIN_OFFERS})"
            )

        with open('last_update.txt', 'w') as f:
            f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

        print("Mise à jour réussie!")
        return True

    except Exception as e:
        error_message = f"Erreur lors de la mise à jour : {str(e)}"
        print(error_message)
        with open('error.log', 'w') as f:
            f.write(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - {error_message}")
        return False

if __name__ == "__main__":
    sys.exit(0 if check_and_update_partners() else 1)
