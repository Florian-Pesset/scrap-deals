import subprocess
import json
import os
from datetime import datetime

def check_and_update_partners():
    try:
        # Exécuter le scraper Node.js
        subprocess.run(['node', 'scraper.js'], check=True)
        
        # Vérifier si le fichier JSON existe et n'est pas vide
        if not os.path.exists('all-offers.json'):
            raise Exception("Le fichier JSON n'a pas été créé")
            
        with open('all-offers.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not data:
                raise Exception("Le fichier JSON est vide")
            
        # Créer un fichier de timestamp pour le suivi
        with open('last_update.txt', 'w') as f:
            f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            
        print("Mise à jour réussie!")
        return True
        
    except Exception as e:
        error_message = f"Erreur lors de la mise à jour : {str(e)}"
        print(error_message)
        
        # Enregistrer l'erreur dans un fichier
        with open('error.log', 'w') as f:
            f.write(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - {error_message}")
        
        return False

if __name__ == "__main__":
    check_and_update_partners() 