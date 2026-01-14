import { Routes, Route, Navigate } from 'react-router-dom';
import { DynamicPageRoute, ERPromptConfig } from '@nasajon/erprompt-lib';
import { Telas } from '../components/Telas';

export const AppRouter = (appConfig: ERPromptConfig) => {
  return (
    <Routes>
      <Route path="/telas" element={<Telas {...appConfig}/>} />

      <Route path="/ud/:layoutId" element={<DynamicPageRoute {...appConfig} />} />
      <Route path="/ud/:layoutId/:id" element={<DynamicPageRoute {...appConfig} />} />
      <Route path="*" element={<Navigate to="/telas" /> } />
    </Routes>
  );
};
