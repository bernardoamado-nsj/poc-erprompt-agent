import { useProfile, useKeycloakAuth, MinimunEntityLevel } from '@nasajon/erprompt-login-lib';
//import { AppBar } from './AppBar';
import { DynamicMenu } from '@nasajon/erprompt-launcher-lib';
import { AppRouter } from './router/AppRouter';
import { useNavigate } from 'react-router-dom';
import {
  hasEntityApi,
  registerEntityApi,
  NavigationContext,
  ERPromptConfig,
  AppBar,
  useUiStore,
} from '@nasajon/erprompt-lib';
import { useState, useMemo, useEffect } from 'react';
//import { ToastContainer } from 'react-toastify';
import { EntityApi } from './api/EntityApi';
import './App.css';


type EndpointData = {
  id: string;
  schema: string;
  escopo: string;
  codigo: string;
  endpoint: string;
};

export default function App() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [registeredApis, setRegisteredApis] = useState(false);

  const { tenant, grupoEmpresarial, isLoading } = useProfile();
  const { keycloak } = useKeycloakAuth();
  const { pageTitle } = useUiStore();

  const dynamicMenuConfig = useMemo(() => ({
    config: {
      tenant: tenant?.id ?? 0,
      grupoEmpresarial: grupoEmpresarial?.id ?? '',
      scope: 'erprompt-agent',
      minimunEntityLevel: MinimunEntityLevel.companyGroup,
      getAccessToken: async () => {
        if (!keycloak) throw new Error('Keycloak context não encontrado. O componente precisa estar dentro do KeycloakProvider.');
        // Garante renovação de token próximo ao vencimento (mesma lógica antiga).
        if (keycloak.isTokenExpired(5)) {
          await keycloak.updateToken(5);
        }
        if (!keycloak.token) throw new Error('Access Token is undefined');
        return keycloak.token;
      },
    },
    erpromptApiUrl: import.meta.env.VITE_ERPROMPT_API_URL ?? 'http://localhost:4000'
  }), [tenant, grupoEmpresarial, keycloak]);

  const appConfig: ERPromptConfig = useMemo(() => ({
    config: {
      scope: 'erprompt-agent'
    },
    erpromptApiUrl: import.meta.env.VITE_ERPROMPT_API_URL ?? 'http://localhost:4000'
  }), []);

  useEffect(() => {
    if (!registeredApis)
      fetch('http://localhost:4000/endpoints')
        .then(responseData => responseData.json())
        .then((data: EndpointData[]) => {
          //console.log('endpoints: ', data);
          for (const endpoint of data)
            if (!hasEntityApi(endpoint.schema)) {
              //console.log('register endpoint: ', endpoint);
              registerEntityApi(endpoint.schema, new EntityApi(endpoint.endpoint));
            }
          setRegisteredApis(true);
        });
  }, [registeredApis]);

  if (
    (!registeredApis)
    || isLoading
  ) {
    return <div>Carregando...</div>;
  }

  return (
    <NavigationContext.Provider value={navigate}>
      <>
        <AppBar
          logo=""
          logoAlt='Gerador de telas'
          onLogoClick={() => navigate('/')}
          onMenuClick={() => setExpanded((prev) => !prev)}
          pageTitle={pageTitle}
        />
        <div style={{ display: 'flex', height: '91.5%' }}>
          <DynamicMenu appName="erprompt-agent" expanded={expanded} {...dynamicMenuConfig} />
          <div style={{ flex: 1, width: '95.5%' }}>
            <AppRouter {...appConfig} />
          </div>
        </div>
      </>
    </NavigationContext.Provider>
  );
};
