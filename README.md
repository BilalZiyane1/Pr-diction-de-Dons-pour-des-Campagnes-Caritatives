# Prédiction de Dons pour des Campagnes Caritatives

Ce projet vise à prédire le comportement des donateurs pour des campagnes caritatives, en utilisant des modèles de Machine Learning et Deep Learning pour la classification, la régression et la prévision temporelle.

## Structure du projet

```
.
├── Prediction_dons/
│   ├── Classification/
│   │   └── Classification.ipynb
│   ├── Regression/
│   │   └── Regression.ipynb
│   └── TimeSeries/
│       └── sequence.ipynb
├── dlinterface/
│   ├── api/
│   │   └── app.py
│   ├── public/
│   │   └── (fichiers frontend statiques)
│   ├── src/
│   │   ├── App.js
│   │   ├── ClassificationForm.jsx
│   │   ├── pp.jsx
│   │   └── (autres composants React)
│   ├── package.json
│   └── README.md
├── .vscode/
│   └── PythonImportHelper-v2-Completion.json
├── README.md
└── (autres fichiers)
```

## Fonctionnalités

- **Classification** : Prédire si un donateur va redonner dans l'année (modèles : Régression Logistique, Forêt Aléatoire, Réseau de Neurones, XGBoost).
- **Régression** : Prédire le montant du prochain don (modèles : Lasso, TabNet, Deep Neural Network).
- **Séries temporelles** : Prédire le nombre de jours avant le prochain don (modèle LSTM).
- **Interface Web** : Application React pour saisir les données et visualiser les prédictions.
- **API Flask** : Backend pour servir les modèles et recevoir les requêtes du frontend.

## Installation

### Prérequis

- Python 3.8+
- Node.js & npm
- Environnements virtuels recommandés (ex: venv, conda)

### Installation Backend

1. Rendez-vous dans le dossier `dlinterface/api`.
2. Installez les dépendances Python nécessaires (voir requirements dans les notebooks ou à générer).
3. Activez l'environnement virtuel et lancez le serveur Flask :
   ```sh
   cd dlinterface/api
   # Activez votre environnement virtuel
   flask run --no-debugger
   ```

### Installation Frontend

1. Rendez-vous dans le dossier `dlinterface`.
2. Installez les dépendances npm :
   ```sh
   npm install
   ```
3. Lancez l'application React :
   ```sh
   npm start
   ```

L'interface sera accessible sur [http://localhost:3000](http://localhost:3000).

## Utilisation

- **Classification** : Remplissez le formulaire pour prédire la probabilité qu'un donateur redonne.
- **Régression** : Prédisez le montant du prochain don.
- **Séries temporelles** : Prédisez le délai avant le prochain don.

Les modèles sont entraînés à partir des notebooks dans `Prediction_dons/`. Les artefacts (modèles, scalers) sont sauvegardés dans les dossiers `donation_prediction_artifacts/` ou `saved_models/` selon la tâche.

## Détails techniques

- **Notebooks** : Chaque notebook (`Classification.ipynb`, `Regression.ipynb`, `sequence.ipynb`) contient le pipeline complet : nettoyage, feature engineering, entraînement, évaluation, et fonctions de prédiction.
- **API** : Le backend expose des endpoints pour la classification (`/classify`) et la régression (`/predict`).
- **Frontend** : Les composants React (`ClassificationForm.jsx`, `pp.jsx`) communiquent avec l'API via Axios.

## Datasets

Le projet utilise les données DonorsChoose.org (fichiers CSV) pour la démonstration et l'entraînement.

## Auteurs

- Projet académique, équipe Deep Learning

## Licence

Usage académique uniquement.

---

Pour toute question, consultez les notebooks ou le code source dans [dlinterface/src/](dlinterface/src/).

## Environnement Python (venv) et Requirements

Il est recommandé d'utiliser un environnement virtuel Python pour isoler les dépendances du projet.

### Création et activation de l'environnement virtuel

Sous Windows :
```sh
python -m venv tf-env
tf-env\Scripts\activate
```

Sous Linux/Mac :
```sh
python3 -m venv tf-env
source tf-env/bin/activate
```

### Installation des dépendances Python

Créez un fichier `requirements.txt` à la racine du projet avec le contenu suivant :

```
numpy
pandas
scikit-learn
matplotlib
seaborn
joblib
tqdm
flask
flask-cors
tensorflow
xgboost
pytorch-tabnet
```

Installez toutes les dépendances avec :
```sh
pip install -r requirements.txt
```

**Remarque :** Certains packages (comme `pytorch-tabnet` ou `tensorflow`) peuvent nécessiter des versions spécifiques selon votre environnement. Adaptez si besoin.