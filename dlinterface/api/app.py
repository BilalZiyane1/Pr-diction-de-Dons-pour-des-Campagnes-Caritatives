from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import os
from pytorch_tabnet.tab_model import TabNetRegressor
import tensorflow as tf
from flask_cors import CORS
import logging
import xgboost as xgb

app = Flask(__name__)
CORS(app)

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('api')

# Charger les modèles avec des chemins absolus
model_dir = os.path.join(os.path.dirname(__file__), 'models')

# ========== CONFIGURATION RÉGRESSION ==========
REGRESSION_FEATURE_ORDER = [
    'total_donations', 
    'total_donated', 
    'avg_donation', 
    'donation_frequency', 
    'days_since_last_donation',
    'donor_tenure', 
    'donation_sequence', 
    'days_since_prev_donation',
    'log_recency', 
    'frequency_per_month', 
    'avg_donation_log',
    'recency_frequency', 
    'tenure_frequency', 
    'monetary_frequency',
    'is_weekend_donation', 
    'is_holiday_season', 
    'is_quarter_end',
    'donation_momentum'
]

# ========== CONFIGURATION CLASSIFICATION ==========
CLASSIFICATION_FEATURES = [
    'total_donations', 'total_donated', 'avg_donation',
    'donation_frequency', 'days_since_last_donation',
    'donor_tenure', 'donor_is_teacher_binary',
    'donation_sequence', 'days_since_prev_donation',
    'donation_day_of_week', 'donation_month'
]

try:
    # ========== CHARGEMENT MODÈLES RÉGRESSION ==========
    regression_scaler = joblib.load(os.path.join(model_dir, 'scaler.pkl'))
    lasso_model = joblib.load(os.path.join(model_dir, 'lasso_model.pkl'))
    tabnet_model = TabNetRegressor()
    tabnet_model.load_model(os.path.join(model_dir, 'tabnet_model.zip'))
    dnn_model = tf.keras.models.load_model(os.path.join(model_dir, 'dnn_model.keras'))
    
    # ========== CHARGEMENT MODÈLES CLASSIFICATION ==========
    classification_scaler = joblib.load(os.path.join(model_dir, 'classification_scaler.joblib'))
    
    classification_models = {
        "logistic_regression": joblib.load(os.path.join(model_dir, 'logistic_regression.joblib')),
        "neural_network": tf.keras.models.load_model(os.path.join(model_dir, 'neural_network.keras')),
    }
    
    # Charger XGBoost si disponible
    if os.path.exists(os.path.join(model_dir, 'xgboost_model.json')):
        xgb_model = xgb.XGBClassifier()
        xgb_model.load_model(os.path.join(model_dir, 'xgboost_model.json'))
        classification_models["xgboost"] = xgb_model
    
    logger.info("Tous les modèles chargés avec succès")
    
except Exception as e:
    logger.error(f"Erreur de chargement des modèles: {str(e)}")
    raise

# ========== FONCTIONS UTILITAIRES ==========
def validate_input(donor_data, required_fields):
    """Valide les données d'entrée"""
    missing = [field for field in required_fields if field not in donor_data]
    if missing:
        raise ValueError(f"Champs manquants: {', '.join(missing)}")
    return True

# ========== FONCTIONS RÉGRESSION ==========
def create_regression_features(input_df):
    """Crée toutes les features nécessaires pour la régression"""
    # Feature engineering
    input_df['log_recency'] = np.log1p(input_df['days_since_last_donation'])
    input_df['frequency_per_month'] = input_df['donation_frequency'] * 30
    input_df['avg_donation_log'] = np.log1p(input_df['avg_donation'])
    input_df['recency_frequency'] = input_df['log_recency'] * input_df['donation_frequency']
    input_df['tenure_frequency'] = input_df['donor_tenure'] * input_df['donation_frequency']
    input_df['monetary_frequency'] = input_df['avg_donation'] * input_df['donation_frequency']
    
    # Features optionnelles
    input_df['is_weekend_donation'] = input_df.get('donation_day_of_week', 0).apply(
        lambda x: 1 if x in [5, 6] else 0
    )
    input_df['is_holiday_season'] = input_df.get('donation_month', 0).apply(
        lambda x: 1 if x in [11, 12] else 0
    )
    input_df['is_quarter_end'] = input_df.get('donation_month', 0).apply(
        lambda x: 1 if x in [3, 6, 9, 12] else 0
    )
    
    input_df['donation_momentum'] = input_df['donation_sequence'] / (input_df['donor_tenure'] + 1)
    
    # Vérifier que toutes les features nécessaires sont présentes
    missing_features = set(REGRESSION_FEATURE_ORDER) - set(input_df.columns)
    for feature in missing_features:
        logger.warning(f"Feature manquante ajoutée: {feature}")
        input_df[feature] = 0  # Valeur par défaut
    
    # Réorganiser les colonnes dans l'ordre exact
    return input_df[REGRESSION_FEATURE_ORDER]

def predict_donation(model_type, donor_data):
    try:
        # Validation des données
        required_fields = [
            'total_donations',
            'total_donated',
            'avg_donation',
            'donation_frequency',
            'days_since_last_donation',
            'donor_tenure',
            'donation_sequence',
            'days_since_prev_donation'
        ]
        validate_input(donor_data, required_fields)
        
        # Création du DataFrame
        input_df = pd.DataFrame([donor_data])
        
        # Création des features dans l'ordre correct
        input_df = create_regression_features(input_df)
        
        # Journalisation pour débogage
        logger.info(f"[RÉGRESSION] Features utilisées: {input_df.columns.tolist()}")
        
        # Vérification des valeurs NaN
        if input_df.isnull().values.any():
            raise ValueError("Données contenant des valeurs NaN")

        # Normalisation
        input_scaled = regression_scaler.transform(input_df)

        # Prédiction
        if model_type == 'lasso':
            prediction = lasso_model.predict(input_scaled)[0]
        elif model_type == 'tabnet':
            input_tab = input_df.values.astype(np.float32)
            prediction = tabnet_model.predict(input_tab)[0][0]
        elif model_type == 'dnn':
            prediction = dnn_model.predict(input_scaled, verbose=0)[0][0]
        else:
            raise ValueError("Type de modèle invalide")

        logger.info(f"Prédiction de montant réussie: {prediction}")
        return prediction
        
    except Exception as e:
        logger.error(f"Erreur de prédiction de montant: {str(e)}")
        raise

# ========== FONCTIONS CLASSIFICATION ==========
def predict_propensity(donor_data):
    try:
        # Validation des données
        required_fields = CLASSIFICATION_FEATURES.copy()
        required_fields.remove('donor_is_teacher_binary')  # Optionnel
        validate_input(donor_data, required_fields)
        
        # Création du DataFrame
        input_df = pd.DataFrame([donor_data])
        
        # S'assurer que toutes les features sont présentes
        missing_features = set(CLASSIFICATION_FEATURES) - set(input_df.columns)
        for feature in missing_features:
            input_df[feature] = 0  # Valeur par défaut
        
        # Sélectionner les features dans le bon ordre
        input_df = input_df[CLASSIFICATION_FEATURES]
        
        # Journalisation pour débogage
        logger.info(f"[CLASSIFICATION] Features utilisées: {input_df.columns.tolist()}")
        
        # Normalisation
        input_scaled = classification_scaler.transform(input_df)
        
        results = {}
        
        for model_name, model in classification_models.items():
            # Faire la prédiction
            if model_name == "neural_network":
                proba = model.predict(input_scaled, verbose=0)[0][0]
                prediction = 1 if proba > 0.5 else 0
            elif model_name == "xgboost":
                proba = model.predict_proba(input_scaled)[0][1]
                prediction = model.predict(input_scaled)[0]
            else:  # logistic_regression et autres
                proba = model.predict_proba(input_scaled)[0][1]
                prediction = model.predict(input_scaled)[0]
            
            # Générer l'explication
            explanation = "Likely to donate again" if prediction == 1 else "Unlikely to donate again"
            confidence = "High confidence" if proba > 0.7 or proba < 0.3 else "Medium confidence"
            
            results[model_name] = {
                "prediction": int(prediction),
                "probability": float(proba),
                "explanation": explanation,
                "confidence": confidence
            }
        
        # Analyse des facteurs d'influence
        if "logistic_regression" in classification_models:
            model = classification_models["logistic_regression"]
            if hasattr(model, 'coef_'):
                coefficients = model.coef_[0]
                feature_importance = dict(zip(CLASSIFICATION_FEATURES, coefficients))
                results["feature_importance"] = feature_importance
        
        logger.info(f"Prédiction de propension réussie")
        return results
        
    except Exception as e:
        logger.error(f"Erreur de prédiction de propension: {str(e)}")
        raise

# ========== ROUTES API ==========
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if not request.is_json:
            return jsonify({'error': 'Le contenu doit être au format JSON'}), 400
            
        data = request.get_json()
        logger.info(f"Données reçues (régression): {data}")
        
        if not data or 'model' not in data or 'donor_data' not in data:
            return jsonify({'error': 'Données ou modèle manquant'}), 400

        prediction = predict_donation(data['model'], data['donor_data'])
        return jsonify({'prediction': float(prediction)})
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Erreur serveur (régression): {str(e)}")
        return jsonify({'error': 'Échec de la prédiction'}), 500

@app.route('/classify', methods=['POST'])
def classify():
    try:
        if not request.is_json:
            return jsonify({'error': 'Le contenu doit être au format JSON'}), 400
            
        data = request.get_json()
        logger.info(f"Données reçues (classification): {data}")
        
        if not data or 'donor_data' not in data:
            return jsonify({'error': 'Données manquantes'}), 400

        predictions = predict_propensity(data['donor_data'])
        return jsonify(predictions)
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Erreur serveur (classification): {str(e)}")
        return jsonify({'error': 'Échec de la classification'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)