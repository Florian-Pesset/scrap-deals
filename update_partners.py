import requests
import json
import os
from datetime import datetime

def check_and_update_partners():
    try:
        # URL de la page The Corner (à remplacer par l'URL réelle)
        url = "VOTRE_URL_SOURCE"
        
        # Effectuer la requête
        response = requests.get(url)
        response.raise_for_status()
        
        # Vérifier si le contenu est présent
        if not response.text:
            raise Exception("Le contenu de la page est vide")
            
        # Sauvegarder les données
        with open('the-corner-partners.json', 'w', encoding='utf-8') as f:
            json.dump(response.json(), f, ensure_ascii=False, indent=2)
            
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