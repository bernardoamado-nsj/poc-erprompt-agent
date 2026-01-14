import { DynamicPage, ERPromptConfig } from "@nasajon/erprompt-lib";
import { useEffect, useState } from "react";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { Card, CardBody, CardTitle } from "@progress/kendo-react-layout";
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

export function Telas(erpromptConfig: ERPromptConfig) {
  const [selectedPage, setSelectedPage] = useState<GeneratedPageDropdownItem | undefined>();
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  const retrievePages = () => {
    setIsLoadingPages(true);
    fetch("http://localhost:4000/generated-pages")
      .then((res) => res.json())
      .then(setPages)
      .finally(() => setIsLoadingPages(false));
  };

  useEffect(() => {
    retrievePages();
  }, []);

  const pagesDropdownData: GeneratedPageDropdownItem[] = pages.map((page) => ({
    ...page,
    text: `${page.id} - ${page.descricao}`
  }));

  const sendPrompt = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setPrompt("");
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
        <Card>
          <CardBody>
            <CardTitle>Telas</CardTitle>

            <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Label editorId="telas_dropdown">Selecionar tela pronta</Label>
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

              <Button onClick={startNewPage} themeColor="primary">
                Criar nova tela
              </Button>
            </section>
          </CardBody>
	        </Card>
{
/*
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
	                  rows={5}
	                  value={prompt}
	                  onChange={(e) => setPrompt(e.value)}
	                  placeholder="Descreva a tela que você quer gerar..."
	                />
	              </div>

	              <Button onClick={sendPrompt} disabled={!prompt.trim()}>
	                Enviar
	              </Button>
	            </section>
	          </CardBody>
	        </Card>
*/
}
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
