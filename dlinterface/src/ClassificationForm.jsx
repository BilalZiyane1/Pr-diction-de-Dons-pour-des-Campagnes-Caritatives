import React, { useState } from 'react';
import axios from 'axios';

const ClassificationForm = () => {
  // Données initiales alignées avec le backend
  const [formData, setFormData] = useState({
    total_donations: 5,
    total_donated: 1000,
    avg_donation: 200,
    donation_frequency: 0.5,
    days_since_last_donation: 30,
    donor_tenure: 365,
    donor_is_teacher_binary: 0,
    donation_sequence: 3,
    days_since_prev_donation: 45,
    donation_day_of_week: 3,
    donation_month: 6
  });

  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [featureImportance, setFeatureImportance] = useState(null);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: parseFloat(e.target.value)});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setFeatureImportance(null);
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/classify', {
        donor_data: formData
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setResults(response.data);
      
      // Extraire l'importance des caractéristiques si disponible
      if (response.data.feature_importance) {
        setFeatureImportance(response.data.feature_importance);
        delete response.data.feature_importance;
      }
      
    } catch (error) {
      console.error('Classification failed:', error);
      
      if (error.response) {
        setError(`Erreur serveur: ${error.response.data.error || error.response.statusText}`);
      } else {
        setError('Erreur de réseau ou de connexion au serveur');
      }
    } finally {
      setLoading(false);
    }
  };

  // Tous les champs
  const fields = [
    'total_donations', 
    'total_donated', 
    'avg_donation', 
    'donation_frequency', 
    'days_since_last_donation',
    'donor_tenure', 
    'donor_is_teacher_binary',
    'donation_sequence', 
    'days_since_prev_donation',
    'donation_day_of_week', 
    'donation_month'
  ];

  // Fonction pour formater les noms des champs
  const formatFieldName = (name) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Générer des recommandations basées sur les résultats
  const generateRecommendations = () => {
    if (!results) return [];
    
    const recommendations = [];
    
    // Ajouter des recommandations basées sur les caractéristiques
    if (formData.days_since_last_donation > 60) {
      recommendations.push("Envoyer une campagne de relance ciblée pour réengager le donateur");
    }
    
    if (formData.donation_frequency < 0.3) {
      recommendations.push("Proposer un programme de dons récurrents pour augmenter la fréquence");
    }
    
    if (formData.donor_tenure > 365) {
      recommendations.push("Reconnaître le donateur de longue date avec un remerciement spécial");
    }
    
    // Recommandations générales
    recommendations.push(
      "Personnaliser les demandes en fonction de l'historique des dons",
      "Optimiser le moment des demandes (jours de semaine vs week-end)",
      "Fournir des mises à jour sur l'impact des dons précédents"
    );
    
    return recommendations;
  };

  return (
    <div className="classification-form" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' ,backgroundColor: 'rgba(255, 255, 255, 0.85)'}}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Prédiction de Propension au Don</h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffebee', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {fields.map((key) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '5px', fontWeight: key === 'donor_is_teacher_binary' ? 'normal' : 'bold' }}>
              {formatFieldName(key)}:
            </label>
            {key === 'donor_is_teacher_binary' ? (
              <select
                name={key}
                value={formData[key]}
                onChange={handleChange}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value={0}>Non</option>
                <option value={1}>Oui</option>
              </select>
            ) : (
              <input
                type="number"
                step="any"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                required={key !== 'donor_is_teacher_binary'}
                min="0"
                max={key === 'donation_day_of_week' ? 6 : (key === 'donation_month' ? 12 : undefined)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            )}
          </div>
        ))}
        
        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#cccccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Analyse en cours...' : 'Prédire la Propension'}
          </button>
        </div>
      </form>

      {results && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Résultats de Prédiction</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.entries(results).map(([model, result]) => (
              <div key={model} style={{ 
                padding: '20px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ 
                  marginTop: 0, 
                  color: model === 'logistic_regression' ? '#4CAF50' : 
                         model === 'neural_network' ? '#2196F3' : '#FF9800'
                }}>
                  {model === 'logistic_regression' ? 'Régression Logistique' : 
                   model === 'neural_network' ? 'Réseau de Neurones' : 
                   model === 'xgboost' ? 'XGBoost' : model}
                </h4>
                
                <div style={{ margin: '15px 0' }}>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '5px 10px',
                    backgroundColor: result.prediction === 1 ? '#4CAF50' : '#F44336',
                    color: 'white',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {result.explanation}
                  </div>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>Probabilité:</strong> {result.probability.toFixed(4)}
                </div>
                
                <div>
                  <strong>Confiance:</strong> {result.confidence}
                </div>
                
                {result.prediction === 1 && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '10px',
                    backgroundColor: '#E8F5E9',
                    borderRadius: '4px'
                  }}>
                    Ce donateur est susceptible de donner à nouveau. Suggestions:
                    <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
                      <li>Envoyer une demande de don personnalisée</li>
                      <li>Proposer une option de don récurrent</li>
                      <li>Inviter à un événement exclusif</li>
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {featureImportance && (
            <div style={{ marginTop: '40px' }}>
              <h4 style={{ textAlign: 'center' }}>Facteurs d'Influence Clés</h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center',
                gap: '10px',
                marginTop: '15px'
              }}>
                {Object.entries(featureImportance)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                  .slice(0, 5)
                  .map(([feature, importance]) => (
                    <div key={feature} style={{
                      padding: '10px 15px',
                      backgroundColor: importance > 0 ? '#E8F5E9' : '#FFEBEE',
                      borderRadius: '20px',
                      border: `1px solid ${importance > 0 ? '#4CAF50' : '#F44336'}`
                    }}>
                      <strong>{formatFieldName(feature)}:</strong> 
                      <span style={{ color: importance > 0 ? '#4CAF50' : '#F44336', marginLeft: '5px' }}>
                        {importance > 0 ? '+' : ''}{importance.toFixed(4)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '40px', backgroundColor: '#E3F2FD', padding: '20px', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0 }}>Recommandations pour Augmenter la Propension au Don</h4>
            <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
              {generateRecommendations().map((rec, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassificationForm;