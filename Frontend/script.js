// ---------- Dados locais iniciais (usados apenas como fallback para títulos) ----------
const conteudosFallback = [
  { id: "c1", slug: "orcamento", titulo: "Orçamento pessoal", descricao: "Aprenda a controlar seus gastos." },
  { id: "c2", slug: "investimentos", titulo: "Investimentos básicos", descricao: "Introdução à renda fixa e variável." },
  { id: "c3", slug: "aposentadoria", titulo: "Planejamento de aposentadoria", descricao: "Como se preparar para o futuro." },
  { id: "c4", slug: "dividas", titulo: "Controle de Dívidas", descricao: "Estratégias para sair do vermelho." }
];

// ---------- Configuração ----------
const API_BASE = "http://127.0.0.1:8000/api"; // ajuste se necessário
const MEDALHA_PONTOS = 30;

// ---------- Utilitários de autenticação ----------
function getToken() { return localStorage.getItem("token"); }
function getUsuario() {
  try { return JSON.parse(localStorage.getItem("usuario")) || null; } catch { return null; }
}
function setUsuario(email) { localStorage.setItem("usuario", JSON.stringify({ email })); }
function logout() { localStorage.removeItem("usuario"); localStorage.removeItem("token"); window.location.href = "login.html"; }

// ---------- Local storage helpers (mantidos para UX temporária) ----------
function getProgressoLocal() { return JSON.parse(localStorage.getItem("progresso")) || []; }
function setProgressoLocal(progresso) { localStorage.setItem("progresso", JSON.stringify(progresso)); }
function getPontosLocal() { return parseInt(localStorage.getItem("pontos") || "0", 10); }
function setPontosLocal(valor) { localStorage.setItem("pontos", String(valor)); }
function adicionarPontosLocal(valor) { if (valor > 0) { const atual = getPontosLocal(); setPontosLocal(atual + valor); } }

// ---------- API: Auth ----------
async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({detail:"Erro"}));
    throw new Error(err.detail || "Login falhou");
  }
  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("usuario", JSON.stringify({ email }));
  if (!localStorage.getItem("pontos")) setPontosLocal(0);
  return data;
}

async function apiFetchContents() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/contents`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) {
    // se não autenticado, redireciona para login
    window.location.href = "login.html";
    return [];
  }
  return res.json();
}

async function apiPostProgress(contentId, status) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ content_id: contentId, status })
  });
  if (!res.ok) throw new Error("Falha ao registrar progresso");
  return res.json();
}

async function apiGetProgress() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/progress`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Falha ao obter progresso");
  return res.json();
}

async function apiSubmitQuiz(answersArray) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ answers: answersArray })
  });
  if (!res.ok) throw new Error("Falha ao submeter quiz");
  return res.json();
}

// ---------- Funções locais de fallback e UX ----------
function salvarProgressoLocal(conteudoId, status) {
  let progresso = getProgressoLocal();
  const jaConcluido = progresso.some(p => p.conteudoId === conteudoId && p.status.includes("Concluído"));
  const timestamp = new Date().toISOString();
  if (status.startsWith("Concluído") && jaConcluido) return false;
  progresso.push({ conteudoId, status, timestamp });
  setProgressoLocal(progresso);
  return true;
}

function limparProgressoLocal() { localStorage.removeItem("progresso"); }
function adicionarPontos(valor) { adicionarPontosLocal(valor); }

// ---------- Login (substitui bloco anterior) ----------
if (document.getElementById("loginForm")) {
  if (getUsuario() && getToken()) window.location.href = "index.html";
  document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    try {
      await apiLogin(email, senha);
      document.getElementById("mensagem").innerHTML = "<p class='sucesso'>Login bem-sucedido!</p>";
      setTimeout(() => window.location.href = "index.html", 600);
    } catch (err) {
      document.getElementById("mensagem").innerHTML = `<p class='erro'>${err.message}</p>`;
    }
  });
}

// ---------- Atualizar resumo e barra ----------
async function atualizarResumoEBarra() {
  const resumoEl = document.getElementById("resumoProgresso");
  if (!resumoEl) return;
  let progresso = [];
  let pontos = getPontosLocal();
  try {
    // tenta obter do backend
    const apiProgresso = await apiGetProgress();
    progresso = apiProgresso.map(p => ({ conteudoId: `c${p.content_id}`, status: p.status, timestamp: p.timestamp }));
  } catch {
    progresso = getProgressoLocal();
  }
  const concluidos = progresso.filter(p => p.status.startsWith("Concluído")).length;
  const total = conteudosFallback.length;
  resumoEl.textContent = `Você concluiu ${concluidos} de ${total} conteúdos. Pontos: ${pontos}.`;
  const percent = total === 0 ? 0 : Math.round((concluidos / total) * 100);
  const fill = document.getElementById("progressFill");
  if (fill) {
    fill.style.width = `${percent}%`;
    fill.setAttribute("aria-valuenow", percent);
  }
  const medalha = document.getElementById("medalha");
  if (medalha) {
    medalha.style.display = pontos >= MEDALHA_PONTOS ? "inline-block" : "none";
  }
}

// ---------- Index ----------
if (document.getElementById("usuarioEmail")) {
  const usuario = getUsuario();
  if (usuario) {
    document.getElementById("usuarioEmail").textContent = usuario.email;
    document.getElementById("boasVindas").style.display = "block";
    if (!localStorage.getItem("pontos")) setPontosLocal(0);
    atualizarResumoEBarra();
  }
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
}

// ---------- Conteúdos (renderiza a lista chamando a API) ----------
if (document.getElementById("listaConteudos")) {
  (async () => {
    const usuario = getUsuario();
    if (!usuario || !getToken()) {
      window.location.href = "login.html";
      return;
    }
    const lista = document.getElementById("listaConteudos");
    lista.innerHTML = "";
    let contents = [];
    try {
      contents = await apiFetchContents();
      // map para formato esperado
      contents = contents.map(c => ({ id: `c${c.id}`, slug: c.slug, titulo: c.title, descricao: c.description }));
    } catch {
      // fallback
      contents = conteudosFallback;
    }
    const arquivosMap = {
      c1: "orcamento.html",
      c2: "investimentos.html",
      c3: "aposentadoria.html",
      c4: "dividas.html"
    };
    contents.forEach(c => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = arquivosMap[c.id] || "#";
      link.innerHTML = `<strong>${c.titulo}</strong>`;
      link.style.marginRight = "8px";
      const desc = document.createElement("span");
      desc.textContent = ` - ${c.descricao || ""} `;
      const btn = document.createElement("button");
      btn.className = "btn-concluir";
      btn.setAttribute("data-id", c.id);
      btn.setAttribute("aria-label", `Marcar conteúdo ${c.titulo} como concluído`);
      btn.textContent = "Marcar como concluído";
      li.appendChild(link);
      li.appendChild(desc);
      li.appendChild(btn);
      lista.appendChild(li);
    });
    document.querySelectorAll(".btn-concluir").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        const contentIdNum = parseInt(id.replace("c",""),10);
        // tenta salvar no backend
        try {
          await apiPostProgress(contentIdNum, "Concluído (manual)");
          const adicionou = salvarProgressoLocal(id, "Concluído (manual)");
          if (adicionou) {
            adicionarPontos(5);
            e.target.textContent = "✔ Concluído";
            e.target.disabled = true;
          } else {
            e.target.textContent = "✔ Já concluído";
            e.target.disabled = true;
          }
        } catch (err) {
          // fallback local se API falhar
          const adicionou = salvarProgressoLocal(id, "Concluído (manual)");
          if (adicionou) {
            adicionarPontos(5);
            e.target.textContent = "✔ Concluído (offline)";
            e.target.disabled = true;
          } else {
            e.target.textContent = "✔ Já concluído";
            e.target.disabled = true;
          }
        }
        atualizarResumoEBarra();
      });
    });
  })();
}

// ---------- Quiz ----------
if (document.getElementById("quizForm")) {
  (async () => {
    const usuario = getUsuario();
    if (!usuario || !getToken()) window.location.href = "login.html";
    const form = document.getElementById("quizForm");
    // Se você tiver quizzes no backend, ideal é buscá-los. Aqui usamos quizPerguntas locais se não houver endpoint.
    const quizPerguntas = window.quizPerguntas || [
      {
        id: "q1",
        pergunta: "Qual é a primeira etapa para organizar suas finanças?",
        opcoes: [{ value: "a", texto: "Fazer um orçamento" }, { value: "b", texto: "Investir em ações" }, { value: "c", texto: "Contratar um empréstimo" }],
        correta: "a",
        relacionado: "c1",
        pontos: 10
      },
      {
        id: "q2",
        pergunta: "O que é renda fixa?",
        opcoes: [{ value: "a", texto: "Investimentos com retorno previsível" }, { value: "b", texto: "Ações de empresas" }, { value: "c", texto: "Criptomoedas" }],
        correta: "a",
        relacionado: "c2",
        pontos: 10
      }
    ];
    quizPerguntas.forEach((q, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className = "pergunta";
      const p = document.createElement("p");
      p.textContent = `${idx + 1}. ${q.pergunta}`;
      wrapper.appendChild(p);
      q.opcoes.forEach(opt => {
        const label = document.createElement("label");
        label.style.display = "block";
        label.innerHTML = `<input type="radio" name="${q.id}" value="${opt.value}"> ${opt.texto}`;
        wrapper.appendChild(label);
      });
      const feedback = document.createElement("div");
      feedback.id = `feedback-${q.id}`;
      feedback.setAttribute("aria-live", "polite");
      wrapper.appendChild(feedback);
      form.appendChild(wrapper);
      form.appendChild(document.createElement("hr"));
    });
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn-quiz";
    submit.textContent = "Enviar respostas";
    form.appendChild(submit);

    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      let acertos = 0;
      let pontosGanhos = 0;
      const answersArray = [];
      quizPerguntas.forEach(q => {
        const resposta = document.querySelector(`input[name="${q.id}"]:checked`)?.value;
        const feedbackDiv = document.getElementById(`feedback-${q.id}`);
        if (resposta === q.correta) {
          acertos++;
          answersArray.push({ quiz_id: parseInt(q.id.replace("q","")) || 0, selected_option: resposta });
        } else {
          answersArray.push({ quiz_id: parseInt(q.id.replace("q","")) || 0, selected_option: resposta || "" });
        }
      });

      // tenta enviar ao backend
      try {
        const apiAnswers = answersArray.map(a => ({ quiz_id: a.quiz_id, selected_option: a.selected_option }));
        const result = await apiSubmitQuiz(apiAnswers);
        pontosGanhos = result.total_points || 0;
        if (pontosGanhos > 0) adicionarPontos(pontosGanhos);
        // mostrar feedback por pergunta com base em result.results
        result.results.forEach(r => {
          const qid = `q${r.quiz_id}`;
          const feedbackDiv = document.getElementById(`feedback-${qid}`);
          if (feedbackDiv) {
            if (r.correct) feedbackDiv.innerHTML = "<p class='sucesso'>✔ Resposta correta!</p>";
            else feedbackDiv.innerHTML = "<p class='erro'>✘ Resposta incorreta.</p>";
          }
        });
      } catch (err) {
        // fallback: calcular localmente
        quizPerguntas.forEach(q => {
          const resposta = document.querySelector(`input[name="${q.id}"]:checked`)?.value;
          const feedbackDiv = document.getElementById(`feedback-${q.id}`);
          if (resposta === q.correta) {
            acertos++;
            const pts = q.pontos || 10;
            adicionarPontos(pts);
            pontosGanhos += pts;
            if (feedbackDiv) feedbackDiv.innerHTML = "<p class='sucesso'>✔ Resposta correta!</p>";
          } else {
            if (feedbackDiv) feedbackDiv.innerHTML = `<p class='erro'>✘ Resposta incorreta. A correta era: ${q.opcoes.find(o => o.value === q.correta).texto}</p>`;
          }
        });
      }

      const resultadoDiv = document.getElementById("resultado");
      resultadoDiv.setAttribute("aria-live", "polite");
      resultadoDiv.innerHTML = `<p class='sucesso'>Você acertou ${acertos} de ${quizPerguntas.length}. Pontos ganhos: ${pontosGanhos}.</p>`;
      atualizarResumoEBarra();
    });
  })();
}

// ---------- Progresso (página) ----------
if (document.getElementById("listaProgresso")) {
  (async () => {
    const usuario = getUsuario();
    if (!usuario || !getToken()) window.location.href = "login.html";
    const ul = document.getElementById("listaProgresso");
    try {
      const progresso = await apiGetProgress();
      if (!progresso || progresso.length === 0) {
        ul.innerHTML = "<li>Nenhum progresso registrado ainda.</li>";
      } else {
        progresso.forEach(p => {
          const titulo = conteudosFallback.find(c => c.id === `c${p.content_id}`)?.titulo || `Conteúdo ${p.content_id}`;
          const li = document.createElement("li");
          li.textContent = `${titulo}: ${p.status} (${new Date(p.timestamp).toLocaleString()})`;
          ul.appendChild(li);
        });
      }
    } catch {
      const progresso = getProgressoLocal();
      if (progresso.length === 0) ul.innerHTML = "<li>Nenhum progresso registrado ainda.</li>";
      else progresso.forEach(p => {
        const conteudo = conteudosFallback.find(c => c.id === p.conteudoId);
        const titulo = conteudo ? conteudo.titulo : p.conteudoId;
        const li = document.createElement("li");
        li.textContent = `${titulo}: ${p.status} (${new Date(p.timestamp).toLocaleString()})`;
        ul.appendChild(li);
      });
    }

    const resetBtn = document.getElementById("resetProgresso");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("Deseja realmente resetar todo o progresso e pontos?")) {
          limparProgressoLocal();
          setPontosLocal(0);
          ul.innerHTML = "<li>Progresso resetado.</li>";
          atualizarResumoEBarra();
        }
      });
    }
  })();
}

// ---------- Função utilitária para páginas de conteúdo ----------
async function marcarConteudo(conteudoId, btnElement) {
  const contentIdNum = parseInt(conteudoId.replace("c",""),10);
  try {
    await apiPostProgress(contentIdNum, "Concluído (conteúdo)");
    const adicionou = salvarProgressoLocal(conteudoId, "Concluído (conteúdo)");
    if (adicionou) {
      adicionarPontos(5);
      if (btnElement) {
        btnElement.textContent = "✔ Concluído";
        btnElement.disabled = true;
        btnElement.setAttribute("aria-label", "Conteúdo concluído");
      }
    } else {
      if (btnElement) {
        btnElement.textContent = "✔ Já concluído";
        btnElement.disabled = true;
      }
    }
  } catch {
    // fallback offline
    const adicionou = salvarProgressoLocal(conteudoId, "Concluído (conteúdo)");
    if (adicionou) {
      adicionarPontos(5);
      if (btnElement) {
        btnElement.textContent = "✔ Concluído (offline)";
        btnElement.disabled = true;
      }
    } else {
      if (btnElement) {
        btnElement.textContent = "✔ Já concluído";
        btnElement.disabled = true;
      }
    }
  }
  atualizarResumoEBarra();
}

