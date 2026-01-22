import { DynamicPage, hasEntityApi, registerEntityApi, ERPromptConfig } from "@nasajon/erprompt-lib";
import { useEffect, useMemo, useState } from "react";
import { EntityApi } from "../api/EntityApi";

type EndpointData = {
  id: string;
  schema: string;
  escopo: string;
  codigo: string;
  endpoint: string;
};

type LayoutEntityRef = {
  schema?: string;
};

type LayoutTransaction = {
  entities?: LayoutEntityRef[];
};

type LayoutSchema = {
  transaction?: LayoutTransaction;
};

type LayoutRecord = {
  json_schema?: LayoutSchema;
};

function extractEntitySchemas(layoutRecord: LayoutRecord | null): string[] {
  const entities = layoutRecord?.json_schema?.transaction?.entities;
  if (!Array.isArray(entities)) return [];
  return entities.map((e) => e?.schema).filter((s): s is string => typeof s === "string" && s.length > 0);
}

export function DynamicPageContainer(props: { layoutId: string; erpromptConfig: ERPromptConfig }) {
  const { layoutId, erpromptConfig } = props;

  const apiBaseUrl = (erpromptConfig as any)?.erpromptApiUrl ?? "http://localhost:4000";
  const normalizedApiBaseUrl = String(apiBaseUrl).replace(/\/+$/, "");
  const apiUrl = useMemo(
    () => (p: string) => {
      if (!p) return normalizedApiBaseUrl;
      if (p.startsWith("http://") || p.startsWith("https://")) return p;
      return p.startsWith("/") ? `${normalizedApiBaseUrl}${p}` : `${normalizedApiBaseUrl}/${p}`;
    },
    [normalizedApiBaseUrl]
  );

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const controller = new AbortController();

    async function ensureApisForLayout() {
      setIsReady(false);
      setError(null);

      if (!layoutId) return;

      const layoutResp = await fetch(apiUrl(`/layouts-schemas/${encodeURIComponent(layoutId)}`), {
        signal: controller.signal
      });
      if (!layoutResp.ok) {
        throw new Error(`Falha ao carregar layout (${layoutId}). HTTP ${layoutResp.status} ${layoutResp.statusText}`);
      }

      const layoutRecord = (await layoutResp.json()) as LayoutRecord;
      const neededSchemas = extractEntitySchemas(layoutRecord);

      const missingSchemas = neededSchemas.filter((schema) => !hasEntityApi(schema));
      if (missingSchemas.length === 0) return;

      const endpointsResp = await fetch(apiUrl("/endpoints"), { signal: controller.signal });
      if (!endpointsResp.ok) {
        throw new Error(`Falha ao carregar endpoints. HTTP ${endpointsResp.status} ${endpointsResp.statusText}`);
      }

      const endpoints = (await endpointsResp.json()) as EndpointData[];
      for (const schema of missingSchemas) {
        const found = endpoints.find((e) => e?.schema === schema);
        if (!found?.endpoint) {
          throw new Error(`Endpoint não encontrado para o schema ${schema}.`);
        }
        if (!hasEntityApi(schema)) {
          registerEntityApi(schema, new EntityApi(found.endpoint));
        }
      }
    }

    ensureApisForLayout()
      .then(() => {
        if (canceled) return;
        setIsReady(true);
      })
      .catch((e: any) => {
        if (canceled) return;
        setError(e?.message ?? String(e));
      });

    return () => {
      canceled = true;
      controller.abort();
    };
  }, [apiUrl, layoutId]);

  if (error) return <div>{error}</div>;
  if (!isReady) return <div>Carregando...</div>;
  return <DynamicPage layoutId={layoutId} {...erpromptConfig} />;
}

