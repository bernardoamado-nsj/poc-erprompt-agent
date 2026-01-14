/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PARQUETS_API_URL: string;
    readonly VITE_ERPROMPT_API_URL: string;
    readonly VITE_PRODUTOS_URL: string;
    readonly VITE_DOCUMENTOS_URL: string;
    readonly VITE_CTE_URL: string;
    readonly VITE_BASE_DASHBOARD_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
