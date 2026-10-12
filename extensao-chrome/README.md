# Caça Ofertas IA — Extensão Chrome (protótipo 0.1)

Captura dados públicos que a página de produto disponibiliza no HTML e mantém uma fila local no navegador.

## Instalação manual
1. Baixe o repositório pelo botão **Code → Download ZIP** e extraia o arquivo.
2. No Chrome, abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `extensao-chrome` extraída.
6. Abra uma página de produto, clique no ícone da extensão e escolha **Capturar produto desta página**.

## Funcionalidades
- Tenta capturar título, preço, imagem e URL.
- Guarda produtos com `chrome.storage.local`.
- Evita duplicar o mesmo URL.
- Exporta a fila para JSON.
- Abre o painel publicado.

## Limitações
- Protótipo: sites variam na forma de apresentar dados; confira sempre preço e título.
- A fila fica neste perfil de navegador e ainda não sincroniza com o painel.
- Não cria links de afiliado, não confirma comissão nem publica mensagens.
- Não acessa dados privados nem contorna proteções de marketplaces.
- Não coloque senhas, tokens ou chaves de API na extensão.

## Próximas etapas
1. Testar em páginas reais do Mercado Livre e ajustar a captura conforme necessário.
2. Adicionar importação de JSON ao painel.
3. Avaliar APIs oficiais e backend para sincronização, monitoramento de preços e envio a canais.