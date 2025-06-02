import React, { useState } from 'react';
import axios from 'axios';

const PredictForm = () => {
  // Données initiales alignées avec le backend
  const [formData, setFormData] = useState({
    total_donations: 5,
    total_donated: 1000,
    avg_donation: 200,
    donation_frequency: 0.5,
    days_since_last_donation: 30,
    donor_tenure: 365,
    donation_sequence: 3,
    days_since_prev_donation: 45,
    donation_day_of_week: 3,
    donation_month: 6
  });

  const [model, setModel] = useState('lasso');
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: parseFloat(e.target.value)});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPrediction(null);
    setLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5000/predict', {
        model,
        donor_data: formData,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setPrediction(res.data.prediction);
    } catch (error) {
      console.error('Prediction failed:', error);
      
      // Affichage détaillé de l'erreur
      if (error.response) {
        setError(`Erreur serveur: ${error.response.data.error || error.response.statusText}`);
      } else {
        setError('Erreur de réseau ou de connexion au serveur');
      }
    } finally {
      setLoading(false);
    }
  };

  // Champs obligatoires
  const requiredFields = [
    'total_donations', 
    'total_donated', 
    'avg_donation', 
    'donation_frequency', 
    'days_since_last_donation',
    'donor_tenure', 
    'donation_sequence', 
    'days_since_prev_donation'
  ];
  
  // Champs optionnels
  const optionalFields = [
    'donation_day_of_week', 
    'donation_month'
  ];

  // Fonction pour formater les noms des champs
  const formatFieldName = (name) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="prediction-form" style={{ maxWidth: '500px', margin: '0 auto', padding: '20px',backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Prédiction de don</h2>
      
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
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ marginBottom: '10px' }}>Informations obligatoires</h3>
        {requiredFields.map((key) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>
              {formatFieldName(key)}:
            </label>
            <input
              type="number"
              step="any"
              name={key}
              value={formData[key]}
              onChange={handleChange}
              required
              min="0"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        ))}
        
        <h3 style={{ marginBottom: '10px', marginTop: '20px' }}>Informations optionnelles</h3>
        {optionalFields.map((key) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '5px' }}>
              {formatFieldName(key)}:
            </label>
            <input
              type="number"
              step="any"
              name={key}
              value={formData[key]}
              onChange={handleChange}
              min="0"
              max={key === 'donation_day_of_week' ? 6 : 12}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        ))}
        
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '15px' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>Modèle :</label>
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="lasso">Lasso</option>
            <option value="tabnet">TabNet</option>
            <option value="dnn">Deep Neural Network (DNN)</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: loading ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            marginTop: '20px'
          }}
        >
          {loading ? 'Prédiction en cours...' : 'Prédire'}
        </button>
      </form>

      {prediction !== null && (
        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          backgroundColor: '#e8f5e9', 
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <h3>Montant prédit : ${Number(prediction).toFixed(2)}</h3>
        </div>
      )}
    </div>
  );
};

export default PredictForm;