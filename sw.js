// Service worker do Reino de Pythonia: guarda o app no aparelho para funcionar sem internet.
// VERSAO e ARQUIVOS são preenchidos pelo ferramentas/montar-app.ps1 a cada versão.
const VERSAO = "20261121-010040";
const CACHE = `pythonia-${VERSAO}`;
const ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./arte/anim-chefe-dragao.png",
  "./arte/anim-chefe-golem.png",
  "./arte/anim-chefe-guarda.png",
  "./arte/anim-chefe-lobo.png",
  "./arte/anim-chefe-mercador.png",
  "./arte/anim-heroi-andando.png",
  "./arte/anim-heroi-vitoria.png",
  "./arte/anim-heroina-andando.png",
  "./arte/anim-heroina-vitoria.png",
  "./arte/anim-mentor-ada.png",
  "./arte/anim-mentor-def.png",
  "./arte/anim-mentor-elif.png",
  "./arte/anim-mentor-lia.png",
  "./arte/anim-mentor-range.png",
  "./arte/anim-passaro.png",
  "./arte/cena-reino.png",
  "./arte/etapa-aprendiz.png",
  "./arte/etapa-avancado.png",
  "./arte/etapa-certificado.png",
  "./arte/etapa-especialista.png",
  "./arte/etapa-iniciante.png",
  "./arte/etapa-intermediario.png",
  "./arte/heroi.png",
  "./arte/heroina.png",
  "./arte/regiao-castelo.png",
  "./arte/regiao-caverna.png",
  "./arte/regiao-floresta.png",
  "./arte/regiao-montanha.png",
  "./arte/regiao-vila.png",
  "./vendor/skulpt-stdlib.js",
  "./vendor/skulpt.min.js",
  "./fontes/atkinsonhyperlegible-400-latin-ext.woff2",
  "./fontes/atkinsonhyperlegible-400-latin.woff2",
  "./fontes/atkinsonhyperlegible-700-latin-ext.woff2",
  "./fontes/atkinsonhyperlegible-700-latin.woff2",
  "./fontes/fontes.css",
  "./fontes/jetbrainsmono-400-latin-ext.woff2",
  "./fontes/jetbrainsmono-400-latin.woff2",
  "./fontes/jetbrainsmono-600-latin-ext.woff2",
  "./fontes/jetbrainsmono-600-latin.woff2",
  "./fontes/pixelifysans-400-latin-ext.woff2",
  "./fontes/pixelifysans-400-latin.woff2",
  "./fontes/pixelifysans-600-latin-ext.woff2",
  "./fontes/pixelifysans-600-latin.woff2",
  "./fontes/pixelifysans-700-latin-ext.woff2",
  "./fontes/pixelifysans-700-latin.woff2",
  "./icones/apple-touch-icon.png",
  "./icones/favicon-32.png",
  "./icones/icone-192.png",
  "./icones/icone-512.png",
  "./icones/icone-maskable-512.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome.startsWith("pythonia-") && nome !== CACHE).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim())
  );
});

// A página tenta a internet primeiro (para pegar versões novas) e cai no que está guardado se estiver offline.
// Imagens, fontes e o motor Python vêm do que está guardado.
self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET" || new URL(pedido.url).origin !== self.location.origin) return;
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put("./index.html", copia));
          }
          return resposta;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  evento.respondWith(caches.match(pedido, { ignoreSearch: true }).then((guardado) => guardado || fetch(pedido)));
});

// Lembrete diário que vem do servidor de avisos (Mac mini): mostra a notificação.
const DESTINO_PADRAO = "./#diarias";
self.addEventListener("push", (evento) => {
  let dados = {};
  try { dados = evento.data ? evento.data.json() : {}; } catch (erro) { /* aviso sem dados */ }
  const destino = /^\.\/#[a-z0-9-]*$/.test(dados.destino || "") ? dados.destino : DESTINO_PADRAO;
  evento.waitUntil(self.registration.showNotification(dados.titulo || "Reino de Pythonia", {
    body: dados.texto || "Hora de praticar Python!",
    icon: "icones/icone-192.png",
    tag: "pythonia-lembrete",
    data: { destino },
  }));
});
// Tocar no aviso abre o app nas Diárias (ou traz para a frente a janela que já estava aberta).
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = new URL((evento.notification.data && evento.notification.data.destino) || DESTINO_PADRAO, self.registration.scope).href;
  evento.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
    const aberta = janelas.find((janela) => janela.url.startsWith(self.registration.scope));
    if (!aberta) return self.clients.openWindow(destino);
    return aberta.focus().then((janela) => (janela.navigate ? janela.navigate(destino) : janela)).catch(() => self.clients.openWindow(destino));
  }));
});
