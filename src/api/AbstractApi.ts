import { DataDomain } from '@nasajon/erprompt-lib';

import { getKeycloak } from '@nasajon/erprompt-login-lib';

export abstract class AbstractApi {

  /**
   * Recupera o access token do contexto do KeycloakProvider.
   * Só pode ser chamado dentro de componentes React.
   */
  protected async getAccessToken(): Promise<string> {
    const keycloak = getKeycloak();
    if (!keycloak) throw new Error('Keycloak context não encontrado. O componente precisa estar dentro do KeycloakProvider.');
    if ((keycloak.isTokenExpired(30)) || (!keycloak.token))
      await keycloak.updateToken(30);
    if (!keycloak.token)
      throw new Error('Keycloak sem token');
    return keycloak.token;
  }

  protected async basicHeaders() {
    const accessToken = await this.getAccessToken();
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  protected buildUrl(endpoint: string, dataDomain: DataDomain, filters?: Record<string, any>) {
    const url = new URL(endpoint);
    url.searchParams.append('tenant', dataDomain.tenant.toString());
    url.searchParams.append('grupo_empresarial', dataDomain.grupoEmpresarial);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (key && value) {
          url.searchParams.append(key, value);
        }
      });
    }

    return url;
  }

  protected makeRequest(args: { endpoint: string; dataDomain: DataDomain; method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; filters?: Record<string, any>; abortSignal?: AbortSignal; payload?: any }) {
    return this.basicHeaders().then((headers) =>
      fetch(this.buildUrl(args.endpoint, args.dataDomain, args?.filters), {
        headers,
        method: args.method,
        signal: args?.abortSignal,
        body: JSON.stringify(args?.payload),
      })
    );
  }
}
