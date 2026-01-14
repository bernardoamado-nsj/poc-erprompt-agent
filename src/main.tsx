import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import '@progress/kendo-theme-material/dist/all.css';
import { ProfileProvider, KeycloakProvider } from '@nasajon/erprompt-login-lib';
import { MinimunEntityLevel } from '@nasajon/erprompt-login-lib';
import App from './App';
import likelySubtags from 'cldr-core/supplemental/likelySubtags.json';
import currencyData from 'cldr-core/supplemental/currencyData.json';
import weekData from 'cldr-core/supplemental/weekData.json';
import ptNumbers from 'cldr-numbers-full/main/pt/numbers.json';
import ptLocalCurrency from 'cldr-numbers-full/main/pt/currencies.json';
import ptCaGregorian from 'cldr-dates-full/main/pt/ca-gregorian.json';
import ptDateFields from 'cldr-dates-full/main/pt/dateFields.json';
import { IntlProvider, load } from '@progress/kendo-react-intl';
import { ToastRenderer } from '@nasajon/erprompt-lib';
import { ToastContainer } from 'react-toastify';
//import '@nasajon/erprompt-lib/erprompt-lib.css';
//import '@nasajon/erprompt-launcher-lib/erprompt-launcher-lib.css';
//import '@nasajon/erprompt-login-lib/erprompt-login-lib.css';
import './Nhids.css';

load(likelySubtags, currencyData, weekData, ptLocalCurrency, ptNumbers, ptCaGregorian, ptDateFields);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <KeycloakProvider
    keycloackUrl={import.meta.env.VITE_KEYCLOAK_URL ?? 'https://auth.nasajon.com.br/auth'}
    keycloakClientid={import.meta.env.VITE_KEYCLOAK_CLIENTID ?? 'meurh_api'}
    keycloakRealm={import.meta.env.VITE_KEYCLOAK_REALM ?? 'master'}
  >
    <React.StrictMode>
      <Router basename="/erprompt-agent">
        <IntlProvider locale="pt-BR">
          <ProfileProvider
            minimunEntityLevel={MinimunEntityLevel.companyGroup}
            diretorioUrl={import.meta.env.VITE_DIRETORIO_URL ?? 'https://diretorio.nasajon.com.br'}
            profileEndpoint={import.meta.env.VITE_PROFILE_ENDPOINT ?? 'v2/api/profile'}
          >
            <Suspense fallback={<div>Loading...</div>}>
              <App />
              <ToastContainer />
              <ToastRenderer autoClose={false} />
            </Suspense>
          </ProfileProvider>
        </IntlProvider>
      </Router>
    </React.StrictMode>
  </KeycloakProvider>
);
