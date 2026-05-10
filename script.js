let catalogo = [];
let idEmEdicao = null;
let idParaExcluir = null;
let avaliacaoSelecionada = 0;

function salvar() {
  localStorage.setItem('cinelog', JSON.stringify(catalogo));
}

function carregar() {
  const dados = localStorage.getItem('cinelog');
  if (dados) {
    catalogo = JSON.parse(dados);
  } else {
    catalogo = [];
  }
}

function atualizarEstrelas(valor) {
  const estrelas = document.querySelectorAll('.estrela');
  const texto = document.getElementById('texto-avaliacao');
  const labels = ['Clique para avaliar', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente!'];

  estrelas.forEach(function(estrela, index) {
    if (index < valor) {
      estrela.classList.add('ativa');
    } else {
      estrela.classList.remove('ativa');
    }
  });

  texto.textContent = labels[valor];
  avaliacaoSelecionada = valor;
  document.getElementById('campo-avaliacao').value = valor;
}

function gerarEstrelasHTML(nota) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= nota) {
      html += '<span>★</span>';
    } else {
      html += '<span class="vazia">★</span>';
    }
  }
  return html;
}

function renderizar() {
  const busca  = document.getElementById('campo-busca').value.toLowerCase();
  const genero = document.getElementById('filtro-genero').value;
  const status = document.getElementById('filtro-status').value;

  const filtrados = catalogo.filter(function(item) {
    const nomeOk   = item.nome.toLowerCase().includes(busca);
    const generoOk = genero === '' || item.genero === genero;
    const statusOk = status === '' || item.status === status;
    return nomeOk && generoOk && statusOk;
  });

  const grid = document.getElementById('grid-catalogo');
  grid.innerHTML = '';

  const msgVazio        = document.getElementById('msg-vazio');
  const msgSemResultado = document.getElementById('msg-sem-resultado');

  if (catalogo.length === 0) {
    msgVazio.style.display        = 'block';
    msgSemResultado.style.display = 'none';
  } else if (filtrados.length === 0) {
    msgVazio.style.display        = 'none';
    msgSemResultado.style.display = 'block';
  } else {
    msgVazio.style.display        = 'none';
    msgSemResultado.style.display = 'none';
  }

  document.getElementById('badge-total').textContent = catalogo.length + ' títulos';

  filtrados.forEach(function(item) {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-4';

    const statusTexto    = item.status === 'assistido' ? '✅ Assistido' : '⏳ Pendente';
    const statusCor      = item.status === 'assistido' ? 'success' : 'warning';
    const btnToggleTexto = item.status === 'assistido' ? 'Marcar pendente' : 'Marcar assistido';

    col.innerHTML =
      '<div class="card-titulo">' +
        '<span class="badge bg-secondary">' + item.tipo + '</span> ' +
        '<span class="badge bg-' + statusCor + '">' + statusTexto + '</span>' +
        '<div class="nome-titulo">' + item.nome + '</div>' +
        '<div class="meta-titulo">' + item.genero + ' · ' + item.ano + '</div>' +
        '<div class="estrelas-display">' + gerarEstrelasHTML(item.avaliacao) + '</div>' +
        (item.obs ? '<div class="obs-titulo">' + item.obs + '</div>' : '') +
        '<div class="acoes-card">' +
          '<button class="btn btn-outline-success btn-sm" onclick="alternarStatus(' + item.id + ')">' + btnToggleTexto + '</button>' +
          '<button class="btn btn-outline-primary btn-sm" onclick="iniciarEdicao(' + item.id + ')">Editar</button>' +
          '<button class="btn btn-outline-danger btn-sm" onclick="pedirExclusao(' + item.id + ')">Remover</button>' +
        '</div>' +
      '</div>';

    grid.appendChild(col);
  });

  atualizarEstatisticas();
}

function atualizarEstatisticas() {
  const total      = catalogo.length;
  const assistidos = catalogo.filter(function(i) { return i.status === 'assistido'; }).length;
  const pendentes  = total - assistidos;

  const comNota = catalogo.filter(function(i) { return i.avaliacao > 0; });
  let media = '—';
  if (comNota.length > 0) {
    const soma = comNota.reduce(function(acc, i) { return acc + i.avaliacao; }, 0);
    media = (soma / comNota.length).toFixed(1) + ' ★';
  }

  document.getElementById('stat-total').textContent      = total;
  document.getElementById('stat-assistidos').textContent = assistidos;
  document.getElementById('stat-pendentes').textContent  = pendentes;
  document.getElementById('stat-media').textContent      = media;

  const tbody = document.getElementById('tabela-generos');

  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum título cadastrado ainda.</td></tr>';
    return;
  }

  const porGenero = {};
  catalogo.forEach(function(item) {
    if (!porGenero[item.genero]) {
      porGenero[item.genero] = { total: 0, assistidos: 0, soma: 0, comNota: 0 };
    }
    porGenero[item.genero].total++;
    if (item.status === 'assistido') porGenero[item.genero].assistidos++;
    if (item.avaliacao > 0) {
      porGenero[item.genero].soma += item.avaliacao;
      porGenero[item.genero].comNota++;
    }
  });

  let linhas = '';
  for (const genero in porGenero) {
    const g = porGenero[genero];
    const mediaG = g.comNota > 0 ? (g.soma / g.comNota).toFixed(1) + ' ★' : '—';
    linhas +=
      '<tr>' +
        '<td>' + genero + '</td>' +
        '<td class="text-center">' + g.total + '</td>' +
        '<td class="text-center">' + g.assistidos + '</td>' +
        '<td class="text-center">' + mediaG + '</td>' +
      '</tr>';
  }
  tbody.innerHTML = linhas;
}

function validar() {
  const nome      = document.getElementById('campo-nome').value.trim();
  const genero    = document.getElementById('campo-genero').value;
  const ano       = parseInt(document.getElementById('campo-ano').value);
  const avaliacao = parseInt(document.getElementById('campo-avaliacao').value);

  if (!nome) {
    exibirAviso('Informe o nome do título.', 'danger');
    return false;
  }
  if (!genero) {
    exibirAviso('Selecione um gênero.', 'danger');
    return false;
  }
  if (!ano || ano < 1888 || ano > 2030) {
    exibirAviso('Informe um ano válido entre 1888 e 2030.', 'danger');
    return false;
  }
  if (avaliacao < 1) {
    exibirAviso('Selecione uma avaliação de 1 a 5 estrelas.', 'danger');
    return false;
  }
  return true;
}

function salvarTitulo() {
  if (!validar()) return;

  const titulo = {
    id:        idEmEdicao !== null ? idEmEdicao : Date.now(),
    nome:      document.getElementById('campo-nome').value.trim(),
    genero:    document.getElementById('campo-genero').value,
    ano:       parseInt(document.getElementById('campo-ano').value),
    tipo:      document.getElementById('campo-tipo').value,
    status:    document.getElementById('campo-status').value,
    avaliacao: parseInt(document.getElementById('campo-avaliacao').value),
    obs:       document.getElementById('campo-obs').value.trim()
  };

  if (idEmEdicao !== null) {
    const indice = catalogo.findIndex(function(i) { return i.id === idEmEdicao; });
    catalogo[indice] = titulo;
    exibirAviso('"' + titulo.nome + '" atualizado com sucesso!', 'success');
  } else {
    catalogo.push(titulo);
    exibirAviso('"' + titulo.nome + '" adicionado ao catálogo!', 'success');
  }

  salvar();
  resetarFormulario();
  renderizar();
}

function iniciarEdicao(id) {
  const item = catalogo.find(function(i) { return i.id === id; });
  if (!item) return;

  idEmEdicao = id;

  document.getElementById('campo-nome').value   = item.nome;
  document.getElementById('campo-genero').value = item.genero;
  document.getElementById('campo-ano').value    = item.ano;
  document.getElementById('campo-tipo').value   = item.tipo;
  document.getElementById('campo-status').value = item.status;
  document.getElementById('campo-obs').value    = item.obs || '';
  atualizarEstrelas(item.avaliacao);

  document.getElementById('btn-salvar').textContent     = 'Salvar Alterações';
  document.getElementById('btn-cancelar').style.display = 'inline-block';

  document.getElementById('secao-formulario').scrollIntoView({ behavior: 'smooth' });
}

function resetarFormulario() {
  idEmEdicao = null;
  document.getElementById('form-titulo').reset();
  atualizarEstrelas(0);
  document.getElementById('btn-salvar').textContent     = 'Adicionar';
  document.getElementById('btn-cancelar').style.display = 'none';
}

function pedirExclusao(id) {
  const item = catalogo.find(function(i) { return i.id === id; });
  if (!item) return;

  idParaExcluir = id;
  document.getElementById('modal-nome-titulo').textContent = '"' + item.nome + '"';

  const modal = new bootstrap.Modal(document.getElementById('modal-excluir'));
  modal.show();
}

function confirmarExclusao() {
  const item = catalogo.find(function(i) { return i.id === idParaExcluir; });
  catalogo = catalogo.filter(function(i) { return i.id !== idParaExcluir; });

  salvar();
  renderizar();
  exibirAviso('"' + item.nome + '" removido do catálogo.', 'warning');

  idParaExcluir = null;
  bootstrap.Modal.getInstance(document.getElementById('modal-excluir')).hide();
}

function alternarStatus(id) {
  const item = catalogo.find(function(i) { return i.id === id; });
  if (!item) return;

  item.status = item.status === 'assistido' ? 'pendente' : 'assistido';
  salvar();
  renderizar();

  const msg = item.status === 'assistido'
    ? '"' + item.nome + '" marcado como assistido! ✅'
    : '"' + item.nome + '" marcado como pendente. ⏳';
  exibirAviso(msg, 'success');
}

function exibirAviso(mensagem, tipo) {
  const area = document.getElementById('area-avisos');
  const div  = document.createElement('div');
  div.className = 'alert alert-' + tipo + ' alert-dismissible fade show';
  div.setAttribute('role', 'alert');
  div.innerHTML = mensagem + '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
  area.appendChild(div);

  setTimeout(function() {
    div.classList.remove('show');
    setTimeout(function() { div.remove(); }, 300);
  }, 4000);
}

document.getElementById('form-titulo').addEventListener('submit', function(e) {
  e.preventDefault();
  salvarTitulo();
});

document.getElementById('campo-busca').addEventListener('input', function() {
  renderizar();
});

document.getElementById('filtro-genero').addEventListener('change', function() {
  renderizar();
});

document.getElementById('filtro-status').addEventListener('change', function() {
  renderizar();
});

document.getElementById('btn-confirmar-exclusao').addEventListener('click', function() {
  confirmarExclusao();
});

document.getElementById('btn-cancelar').addEventListener('click', function() {
  resetarFormulario();
});

document.getElementById('btn-limpar').addEventListener('click', function() {
  document.getElementById('campo-busca').value   = '';
  document.getElementById('filtro-genero').value = '';
  document.getElementById('filtro-status').value = '';
  renderizar();
});

document.querySelectorAll('.estrela').forEach(function(estrela) {
  estrela.addEventListener('click', function() {
    atualizarEstrelas(parseInt(this.dataset.valor));
  });

  estrela.addEventListener('touchstart', function(e) {
    e.preventDefault();
    atualizarEstrelas(parseInt(this.dataset.valor));
  });
});

document.addEventListener('DOMContentLoaded', function() {
  carregar();
  renderizar();
});