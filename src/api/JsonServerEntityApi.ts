import { DataDomain, IEntityApi } from '@nasajon/erprompt-lib';
import { AbstractApi } from './AbstractApi';

export class JsonServerEntityApi extends AbstractApi implements IEntityApi {
  protected entityEndpoint: string;
  constructor(entityEndpoint: string) {
    super();
    this.entityEndpoint = entityEndpoint;
  }

  async fetchAll(dataDomain: DataDomain, filters?: Record<string, any>, abortSignal?: AbortSignal) {
    const response = await this.makeRequest({
      endpoint: this.entityEndpoint,
      dataDomain,
      method: 'GET',
      filters,
      abortSignal,
    });

    if (response.ok) {
      const responseData = await response.json();
      return {
        result: responseData?.result ?? (Array.isArray(responseData)
          ? responseData
          : [responseData]),
        next: null
      };
    }
    else throw new Error(`Error fetching the data. status: ${response.status}; message: ${response.statusText}`);
  }
  async fetchOne(id: string, dataDomain: DataDomain, abortSignal?: AbortSignal): Promise<any> {
    const response = await this.makeRequest({
      dataDomain,
      method: 'GET',
      endpoint: `${this.entityEndpoint}/${id}`,
      abortSignal,
    });
    if (response.ok) return response.json();
    else throw new Error(`Error fetching one data. status: ${response.status}; message: ${response.statusText}`);
  }
  async create(data: any, dataDomain: DataDomain, abortSignal?: AbortSignal): Promise<any> {
    const response = await this.makeRequest({
      endpoint: this.entityEndpoint,
      dataDomain,
      method: 'POST',
      abortSignal,
      payload: data,
    });
    if (response.ok) return response.json();
    else throw new Error(`Error creating data. status: ${response.status}; message: ${response.statusText}`);
  }
  async update(id: string, data: any, dataDomain: DataDomain, abortSignal?: AbortSignal): Promise<any> {
    const response = await this.makeRequest({
      endpoint: `${this.entityEndpoint}/${id}`,
      dataDomain,
      method: 'PUT',
      abortSignal,
      payload: data,
    });
    if (response.ok) return response.json();
    else throw new Error(`Error updating data. status: ${response.status}; message: ${response.statusText}`);
  }
  async delete(id: string, dataDomain: DataDomain, abortSignal?: AbortSignal): Promise<void> {
    const response = await this.makeRequest({
      endpoint: `${this.entityEndpoint}/${id}`,
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
