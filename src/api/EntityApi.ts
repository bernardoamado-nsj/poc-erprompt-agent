import { DataDomain, IEntityApi } from '@nasajon/erprompt-lib';
import { AbstractApi } from './AbstractApi';

export type BasicApiOperation = 'List' | 'GetOne' | 'Create' | 'Update' | 'Delete';
type OpsConfig = {
  [op in BasicApiOperation]?: {
    endpoint?: string;
    defaultFilters?: Record<string, any>;
    ignoreFields?: string[];
    payloadFields?: string[];
  };
};

export class EntityApi extends AbstractApi implements IEntityApi {
  protected entityEndpoint: string;
  protected opsConfig: OpsConfig | undefined;
  constructor(entityEndpoint: string, opsConfig?: OpsConfig) {
    super();
    this.entityEndpoint = entityEndpoint;
    this.opsConfig = opsConfig;
  }

  async fetchAll(dataDomain: DataDomain, filters?: Record<string, any>, abortSignal?: AbortSignal) {
    console.log('fetching all ', this.entityEndpoint);
    const opConfig = this.opsConfig?.List;
    let requestFilters: Record<string, any> | undefined;
    if (opConfig && opConfig.defaultFilters) requestFilters = { ...opConfig.defaultFilters };
    if (filters) requestFilters = { ...requestFilters, ...filters };

    const response = await this.makeRequest({
      endpoint: opConfig?.endpoint ?? this.entityEndpoint,
      dataDomain,
      method: 'GET',
      filters: requestFilters,
      abortSignal,
    });

    //if (response.ok) return response.json();
    //else throw new Error(`Error fetching the data. status: ${response.status}; message: ${response.statusText}`);
    if (response.ok) {
      const payload = await response.json();
      if (Array.isArray(payload)) return {
        result: payload,
        next: null
      };
      if (Array.isArray(payload?.result)) return {
        result: payload.result,
        next: payload.next ?? null
      };
      throw new Error('Unexpected response format: ' + JSON.stringify(payload));
    } else throw new Error(`Error fetching the data. status: ${response.status}; message: ${response.statusText}`);
  }
  async fetchOne(id: string, dataDomain: DataDomain, abortSignal?: AbortSignal): Promise<any> {
    const opConfig = this.opsConfig?.GetOne;
    let requestFilters: Record<string, any> | undefined;
    if (opConfig && opConfig.defaultFilters) requestFilters = { ...opConfig.defaultFilters };
    const response = await this.makeRequest({
      dataDomain,
      method: 'GET',
      endpoint: `${this.opsConfig?.GetOne?.endpoint ?? this.entityEndpoint}/${id}`,
      abortSignal,
      filters: requestFilters,
    });
    if (response.ok) return response.json();
    else throw new Error(`Error fetching one data. status: ${response.status}; message: ${response.statusText}`);
  }
  async create(data: any, dataDomain: DataDomain, abortSignal?: AbortSignal): Promise<any> {
    const newPayload: Record<string, any> = {};
    const opConfig = this.opsConfig?.Create;
    if (opConfig?.payloadFields) for (let field of opConfig.payloadFields) newPayload[field] = data[field];
    else {
      const ignoreFields = opConfig?.ignoreFields ?? [];
      for (const [field, value] of Object.entries(data)) {
        if (!ignoreFields.includes(field)) newPayload[field] = value;
      }
    }

    const response = await this.makeRequest({
      endpoint: opConfig?.endpoint ?? this.entityEndpoint,
      dataDomain,
      method: 'POST',
      abortSignal,
      payload: newPayload,
    });

    if (response.ok) {
      let resp: any;
      try {
        resp = await response.json();
      } catch (errJson) {
        try {
          resp = await response.text();
        } catch (errTxt) {
          resp = {status: 'sucesso'};
        }
      }
      return resp;
    } else {
      // ⬇️ captura o corpo da resposta corretamente
      let message = response.statusText;
      try {
        const errorBody = await response.json(); // ⬅️ aguarde a resolução

        if (Array.isArray(errorBody)) {
          // Array de mensagens de erro
          message = errorBody.map((e) => e.message || JSON.stringify(e)).join(' | ');
        } else if (typeof errorBody === 'object' && errorBody !== null) {
          message = errorBody.message || JSON.stringify(errorBody);
        } else {
          message = JSON.stringify(errorBody.message);
        }
      } catch (_) {
        // fallback: statusText
      }

      throw new Error(`${[message]}`);
    }
  }

  async update(id: string, data: any, dataDomain: DataDomain, abortSignal?: AbortSignal): Promise<any> {
    const newPayload: Record<string, any> = {};
    const opConfig = this.opsConfig?.Update;
    if (opConfig?.payloadFields) for (let field of opConfig.payloadFields) newPayload[field] = data[field];
    else {
      const ignoreFields = opConfig?.ignoreFields ?? [];
      for (const [field, value] of Object.entries(data)) {
        if (!ignoreFields.includes(field)) newPayload[field] = value;
      }
    }
    const response = await this.makeRequest({
      endpoint: `${this.opsConfig?.Update?.endpoint ?? this.entityEndpoint}/${id}`,
      dataDomain,
      method: 'PUT',
      abortSignal,
      payload: newPayload,
    });
    if (response.ok) {
      let resp: any;
      try {
        resp = await response.json();
      } catch (errJson) {
        try {
          resp = await response.text();
        } catch (errTxt) {
          resp = {status: 'sucesso'};
        }
      }
      return resp;
    }
    else {
      let result = await response.json();
      if (Array.isArray(result))
        result = result[0];
      console.log('error result: ', result);
      throw new Error(`Erro ao atualizar. status: ${response.status}; mensagem: ${result?.message}`);
    }
  }
  async delete(id: string, dataDomain: DataDomain, abortSignal?: AbortSignal): Promise<void> {
    const response = await this.makeRequest({
      endpoint: `${this.opsConfig?.Delete?.endpoint ?? this.entityEndpoint}/${id}`,
      dataDomain,
      method: 'DELETE',
      abortSignal,
    });
    if (!response.ok) throw new Error(`Error deleting data. status: ${response.status}; message: ${response.statusText}`);
  }
  // not used in the transaction store yet
  fetchRelated(relationName: string, dataDomain: DataDomain, filters?: Record<string, any>, abortSignal?: AbortSignal): Promise<any[]> {
    return Promise.resolve([]);
  }
  // not effectively used in the transaction store yet
  transition(id: string, targetState: string, dataDomain: DataDomain, abortSignal?: AbortSignal): Promise<string> {
    return Promise.resolve('make transition');
  }
}
