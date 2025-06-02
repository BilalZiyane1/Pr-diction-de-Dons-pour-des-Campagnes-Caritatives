import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import ClassificationForm from './ClassificationForm';
import PredictForm from './PredictForm';

const App = () => (
  <Router>
    <Navbar />
    <div style={{ padding: '20px' }}>
      <Routes>
        <Route path="/" element={<ClassificationForm />} />
        <Route path="/predict" element={<PredictForm />} />
      </Routes>
    </div>
  </Router>
);

export default App;
