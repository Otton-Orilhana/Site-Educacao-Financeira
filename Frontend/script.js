// ---------- Dados simulados ----------
const conteudos = [
  { id: "c1", titulo: "Orçamento pessoal", descricao: "Aprenda a controlar seus gastos." },
  { id: "c2", titulo: "Investimentos básicos", descricao: "Introdução à renda fixa e variável." },
  { id: "c3", titulo: "Planejamento de aposentadoria", descricao: "Como se preparar para o futuro." },
  { id: "c4", titulo: "Controle de dívidas", descricao: "Estratégias para sair do vermelho." }
];

const quizPerguntas = [
  {
    id: "q1",
    pergunta: "Qual é a primeira etapa para organizar suas finanças?",
    opcoes: [
      { value: "a", texto: "Fazer um orçamento" },
      { value: "b", texto: "Investir em ações" },
      { value: "c", texto: "Contratar um empréstimo" }
    ],
    correta: "a",
    relacionado: "c1",
    pontos: 10,
    explicacao: "O orçamento é a base da organização financeira."
  },
  {
    id: "q2",
    pergunta: "O que é renda fixa?",
    opcoes: [
      { value: "a", texto: "Investimentos com retorno previsível" },
      { value: "b", texto: "Ações de empresas" },
      { value: "c", texto: "Criptomoedas" }
    ],
    correta: "a",
    relacionado: "c2",
    pontos: 10,
    explicacao: "Renda fixa tem retorno previsível, como Tesouro Direto e CDBs."
  }
];


// ---------- Utilitários ----------
function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || null;
  } catch {
    return null;
  }
}
function setUsuario(email) { localStorage.setItem("usuario", JSON.stringify({ email })); }
function logout() { localStorage.removeItem("usuario"); window.location.href = "login.html"; }

function getProgresso() { return JSON.parse(localStorage.getItem("progresso")) || []; }
function setProgresso(progresso) { localStorage.setItem("progresso", JSON.stringify(progresso)); }

function salvarProgresso(conteudoId, status) {
  let progresso = getProgresso();
  const jaConcluido = progresso.some(p => p.conteudoId === conteudoId && p.status.includes("Concluído"));
  const timestamp = new Date().toISOString();

  if (status.startsWith("Concluído") && jaConcluido) {
    return false;
  }

  progresso.push({ conteudoId, status, timestamp });
  setProgresso(progresso);
  return true;
}

function limparProgresso() { localStorage.removeItem("progresso"); }

function getPontos() { return parseInt(localStorage.getItem("pontos") || "0", 10); }
function setPontos(valor) { localStorage.setItem("pontos", String(valor)); }
function adicionarPontos(valor) {
  if (valor > 0) {
    const atual = getPontos();
    setPontos(atual + valor);
  }
}

// threshold para medalha
const MEDALHA_PONTOS = 30;

// ---------- Login ----------
if (document.getElementById("loginForm")) {
  if (getUsuario()) window.location.href = "index.html";

  document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (email === "teste@teste.com" && senha === "1234") {
      document.getElementById("mensagem").innerHTML = "<p class='sucesso'>Login bem-sucedido!</p>";
      setUsuario(email);
      if (!localStorage.getItem("pontos")) setPontos(0);
      setTimeout(() => window.location.href = "index.html", 800);
    } else {
      document.getElementById("mensagem").innerHTML = "<p class='erro'>Credenciais inválidas</p>";
    }
  });
}


// ---------- Função para atualizar resumo e barra ----------
function atualizarResumoEBarra() {
  const resumoEl = document.getElementById("resumoProgresso");
  if (!resumoEl) return;

  const progresso = getProgresso();
  const concluidos = progresso.filter(p => p.status.startsWith("Concluído")).length;
  const total = conteudos.length;
  const pontos = getPontos();

  resumoEl.textContent = `Você concluiu ${concluidos} de ${total} conteúdos. Pontos: ${pontos}.`;

  const percent = total === 0 ? 0 : Math.round((concluidos / total) * 100);
  const fill = document.getElementById("progressFill");
  if (fill) {
    fill.style.width = `${percent}%`;
    fill.setAttribute("aria-valuenow", percent);
    fill.setAttribute("aria-valuemin", 0);
    fill.setAttribute("aria-valuemax", 100);
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
    if (!localStorage.getItem("pontos")) setPontos(0);
    atualizarResumoEBarra();
  }
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
}

// ---------- Conteúdos ----------
if (document.getElementById("listaConteudos")) {
  const usuario = getUsuario();
  if (!usuario) {
    window.location.href = "login.html";
  } else {
    const lista = document.getElementById("listaConteudos");
    lista.innerHTML = "";

    const arquivosMap = {
      c1: "orcamento.html",
      c2: "investimentos.html",
      c3: "aposentadoria.html",
      c4: "dividas.html"
    };

    conteudos.forEach(c => {
      const li = document.createElement("li");

      const link = document.createElement("a");
      link.href = arquivosMap[c.id] || "#";
      link.innerHTML = `<strong>${c.titulo}</strong>`;
      link.style.marginRight = "8px";

      const desc = document.createElement("span");
      desc.textContent = ` - ${c.descricao} `;

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
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const adicionou = salvarProgresso(id, "Concluído (manual)");
        if (adicionou) {
          adicionarPontos(5);
          e.target.textContent = "✔ Concluído";
          e.target.disabled = true;
        } else {
          e.target.textContent = "✔ Já concluído";
          e.target.disabled = true;
        }
        atualizarResumoEBarra();
      });
    });
  }
}


// ---------- Quiz ----------
if (document.getElementById("quizForm")) {
  const usuario = getUsuario();
  if (!usuario) window.location.href = "login.html";
  else {
    const form = document.getElementById("quizForm");

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

    form.addEventListener("submit", function(e) {
      e.preventDefault();
      let acertos = 0;
      let pontosGanhos = 0;

      quizPerguntas.forEach(q => {
        const resposta = document.querySelector(`input[name="${q.id}"]:checked`)?.value;
        const feedbackDiv = document.getElementById(`feedback-${q.id}`);

        if (resposta === q.correta) {
          acertos++;
          const adicionou = salvarProgresso(q.relacionado, "Concluído (quiz)");
          if (adicionou) {
            const pts = q.pontos || 10;
            adicionarPontos(pts);
            pontosGanhos += pts;
          }
          feedbackDiv.innerHTML = "<p class='sucesso'>✔ Resposta correta!</p>";
        } else {
          salvarProgresso(q.relacionado, "Tentativa incorreta (quiz)");
          feedbackDiv.innerHTML = `<p class='erro'>✘ Resposta incorreta. A correta era: ${q.opcoes.find(o => o.value === q.correta).texto}</p>`;
        }
      });

      const resultadoDiv = document.getElementById("resultado");
      resultadoDiv.setAttribute("aria-live", "polite");
      resultadoDiv.innerHTML = `<p class='sucesso'>Você acertou ${acertos} de ${quizPerguntas.length}. Pontos ganhos: ${pontosGanhos}.</p>`;

      atualizarResumoEBarra();
    });
  }
}

// ---------- Progresso ----------
if (document.getElementById("listaProgresso")) {
  const usuario = getUsuario();
  if (!usuario) window.location.href = "login.html";
  else {
    const ul = document.getElementById("listaProgresso");
    const progresso = getProgresso();

    if (progresso.length === 0) {
      ul.innerHTML = "<li>Nenhum progresso registrado ainda.</li>";
    } else {
      progresso.forEach(p => {
        const conteudo = conteudos.find(c => c.id === p.conteudoId);
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
          limparProgresso();
          setPontos(0);
          ul.innerHTML = "<li>Progresso resetado.</li>";
          atualizarResumoEBarra();
        }
      });
    }
  }
}

// ---------- Função utilitária para páginas de conteúdo ----------
function marcarConteudo(conteudoId, btnElement) {
  const adicionou = salvarProgresso(conteudoId, "Concluído (conteúdo)");
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
      btnElement.setAttribute("aria-label", "Conteúdo já concluído");
    }
  }
  atualizarResumoEBarra();
}
