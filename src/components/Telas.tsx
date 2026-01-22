import { DynamicPage, ERPromptConfig } from "@nasajon/erprompt-lib";
import { useEffect, useState } from "react";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { Card, CardBody, CardTitle, TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import { Label } from "@progress/kendo-react-labels";
import { TextArea } from "@progress/kendo-react-inputs";
import { Button } from "@progress/kendo-react-buttons";

type GeneratedPage = {
  id: string;
  escopo: string;
  codigo: string;
  descricao: string;
};

type GeneratedPageDropdownItem = GeneratedPage & { text: string };

type RunStartResponse = {
  runId?: string;
  status?: string;
  statusUrl?: string;
  error?: string;
};

type RunStatusResponse = {
  runId?: string;
  status?: "queued" | "running" | "done" | "blocked" | "failed" | string;
  error?: string | null;
};

export function Telas(erpromptConfig: ERPromptConfig) {
  const apiBaseUrl = (erpromptConfig as any)?.erpromptApiUrl ?? "http://localhost:4000";
  const normalizedApiBaseUrl = String(apiBaseUrl).replace(/\/+$/, "");
  const apiUrl = (p: string) => {
    if (!p) return normalizedApiBaseUrl;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return p.startsWith("/") ? `${normalizedApiBaseUrl}${p}` : `${normalizedApiBaseUrl}/${p}`;
  };

  const [selectedPage, setSelectedPage] = useState<GeneratedPageDropdownItem | undefined>();
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [selectedTab, setSelectedTab] = useState<number>(0); // 0: Telas geradas | 1: Gerar nova

  const retrievePages = () => {
    setIsLoadingPages(true);
    fetch(apiUrl("/generated-pages"))
      .then((res) => res.json())
      .then(setPages)
      .finally(() => setIsLoadingPages(false));
  };

  useEffect(() => {
    retrievePages();
  }, []);

  const pagesDropdownData: GeneratedPageDropdownItem[] = pages.map((page) => ({
    ...page,
    text: page.descricao
  }));

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const sendPrompt = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    if (isGenerating) return;

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setPrompt("");
    setIsGenerating(true);

    try {
      const resp = await fetch(apiUrl("/ai/runs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: trimmed })
      });

      let payload: RunStartResponse | null = null;
      try {
        payload = (await resp.json()) as RunStartResponse;
      } catch {
        payload = null;
      }

      if (!resp.ok) {
        const msg = payload?.error ? String(payload.error) : `HTTP ${resp.status} ${resp.statusText}`;
        setMessages((current) => [...current, { role: "assistant", content: `Falha ao iniciar geração: ${msg}` }]);
        return;
      }

      const runId = payload?.runId ? String(payload.runId) : "";
      const statusPath = payload?.statusUrl ? String(payload.statusUrl) : runId ? `/ai/runs/${runId}/status` : "";

      setMessages((current) => [
        ...current,
        { role: "assistant", content: runId ? `Geração iniciada (runId: ${runId}).` : "Geração iniciada." }
      ]);

      if (!statusPath) return;

      // Polling simples de status (até ~2 minutos)
      for (let i = 0; i < 120; i++) {
        await sleep(1000);
        const statusResp = await fetch(apiUrl(statusPath));
        if (!statusResp.ok) continue;

        const statusPayload = (await statusResp.json().catch(() => null)) as RunStatusResponse | null;
        const status = String(statusPayload?.status ?? "");

        if (status === "done") {
          setMessages((current) => [
            ...current,
            { role: "assistant", content: "Geração concluída. Atualizando lista de telas..." }
          ]);
          retrievePages();
          setSelectedTab(0);
          return;
        }

        if (status === "blocked") {
          setMessages((current) => [
            ...current,
            { role: "assistant", content: "Geração bloqueada (existem perguntas pendentes no planner)." }
          ]);
          return;
        }

        if (status === "failed") {
          const err = statusPayload?.error ? String(statusPayload.error) : "Falha no processo de geração.";
          setMessages((current) => [...current, { role: "assistant", content: err }]);
          return;
        }
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Geração ainda em andamento. Você pode aguardar e depois atualizar a lista de telas." }
      ]);
    } catch (err: any) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: `Erro ao chamar backend: ${err?.message ?? String(err)}` }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const startNewPage = () => {
    setSelectedPage(undefined);
    setMessages([]);
    setPrompt("");
  };

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "420px minmax(0, 1fr)",
        gap: "1rem",
        alignItems: "start"
      }}
    >
      <article
        className="user-interaction"
        style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <TabStrip selected={selectedTab} onSelect={(e) => setSelectedTab(e.selected)}>
          <TabStripTab title="Telas geradas">
            <Card>
              <CardBody>
                <CardTitle>Selecionar tela</CardTitle>
                <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Label editorId="telas_dropdown">Telas disponíveis</Label>
                    <DropDownList
                      id="telas_dropdown"
                      data={pagesDropdownData}
                      dataItemKey="id"
                      textField="text"
                      value={selectedPage}
                      onChange={(e) => setSelectedPage(e.value)}
                      defaultValue={{ id: "", escopo: "", codigo: "", descricao: "", text: "Selecione uma tela..." }}
                      disabled={isLoadingPages || pagesDropdownData.length === 0}
                      style={{ width: "100%" }}
                    />
                  </div>
                </section>
              </CardBody>
            </Card>
          </TabStripTab>
          <TabStripTab title="Gerar nova">
            <Card>
              <CardBody>
                <CardTitle>Conversa com a IA</CardTitle>
                <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div
                    style={{
                      minHeight: 220,
                      maxHeight: 360,
                      overflow: "auto",
                      padding: "0.75rem",
                      border: "1px solid #dee2e6",
                      borderRadius: 8,
                      background: "white"
                    }}
                  >
                    {messages.length === 0 ? (
                      <span style={{ color: "#6c757d" }}>Digite um prompt para começar.</span>
                    ) : (
                      messages.map((m, i) => (
                        <p key={i} style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                          <strong>{m.role === "user" ? "Você" : "IA"}:</strong> {m.content}
                        </p>
                      ))
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Label editorId="telas_chat_prompt">Prompt</Label>
                    <TextArea
                      id="telas_chat_prompt"
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.value)}
                      placeholder="Descreva a tela que você quer gerar..."
                      disabled={isGenerating}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Button onClick={sendPrompt} disabled={!prompt.trim() || isGenerating} themeColor="primary">
                      Enviar
                    </Button>
                    <Button onClick={startNewPage} disabled={isGenerating}>
                      Limpar
                    </Button>
                  </div>
                </section>
              </CardBody>
            </Card>
          </TabStripTab>
        </TabStrip>
      </article>

      <article className="rendered-page" style={{ minWidth: 0 }}>
        <Card>
          <CardBody>
            <CardTitle>Pré-visualização</CardTitle>
            {selectedPage?.id ? <DynamicPage layoutId={selectedPage.id} {...erpromptConfig} /> : null}
          </CardBody>
        </Card>
      </article>
    </main>
  );
}