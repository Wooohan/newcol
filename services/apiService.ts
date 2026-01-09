
import { User, FacebookPage, Conversation, Message, ApprovedLink, ApprovedMedia } from '../types';

class APIService {
  private apiPath: string = '/api/db';

  private async relayRequest(action: string, collection: string, body: any) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    try {
      const response = await fetch(this.apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          action,
          collection,
          ...body
        })
      });

      clearTimeout(timeoutId);
      
      const result = await response.json();
      if (!response.ok) {
        const err = new Error(result.error || `Relay Error: ${response.status}`);
        (err as any).status = response.status;
        (err as any).details = result.details;
        throw err;
      }
      return result;
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        throw new Error("SUPABASE_CONNECTION_TIMEOUT: The relay took too long. Check your Supabase URL/Key.");
      }
      throw e;
    }
  }

  setDatabase(name: string) {}
  getDatabaseName() { return "Supabase/Default"; }

  async getDbMetadata(): Promise<{ name: string; count: number; lastWrite?: string; exists?: boolean }[]> {
    try {
      const res = await this.relayRequest('listCollections', '', {});
      return res.collections || [];
    } catch (e) {
      return [];
    }
  }

  async ping(): Promise<boolean> {
    try {
      const res = await this.relayRequest('ping', 'system', {});
      return res.ok === true;
    } catch (e) {
      return false;
    }
  }

  async testWrite(): Promise<boolean> {
    try {
      const result = await this.relayRequest('updateOne', 'provisioning_logs', {
        update: { 
          $set: { 
            id: 'heartbeat', 
            status: 'SUCCESS',
            timestamp: new Date().toISOString()
          } 
        }
      });
      return result.ok === true;
    } catch (e) {
      throw e;
    }
  }

  async manualWriteToTest(): Promise<boolean> {
    return this.testWrite();
  }

  async getAll<T>(collection: string, filter: any = {}): Promise<T[]> {
    const result = await this.relayRequest('find', collection, { filter });
    return result.documents || [];
  }

  async put<T>(collection: string, item: T): Promise<void> {
    await this.relayRequest('updateOne', collection, {
      update: { $set: item }
    });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.relayRequest('deleteOne', collection, { filter: { id } });
  }

  async clearStore(collection: string): Promise<void> {
    await this.relayRequest('deleteMany', collection, {});
  }

  setCredentials(endpoint: string, key: string): void {}
  isConfigured(): boolean { return true; }
}

export const apiService = new APIService();
