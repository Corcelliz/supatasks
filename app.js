// 1) CONEXÃO — URL e chave vêm de config.js (fora do git).
//    A chave "publishable" é pública por natureza: quem protege os dados é a RLS do banco.
const erro = document.getElementById('erro');
function mostrarErro(error) {
  erro.textContent = error ? (error.message || String(error)) : '';
}
if (!window.CONFIG) throw mostrarErro('Faltou o config.js. Copie config.example.js para config.js e preencha.');

const db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

const telaLogin = document.getElementById('tela-login');
const telaApp = document.getElementById('tela-app');
const lista = document.getElementById('lista');
const form = document.getElementById('form');
const campo = document.getElementById('titulo');

// 2) LOGIN — e-mail e senha pelo Supabase Auth. Novos cadastros ficam desligados no painel.
document.getElementById('form-login').onsubmit = async (e) => {
  e.preventDefault();
  const { error } = await db.auth.signInWithPassword({
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('senha').value,
  });
  // Só troca a mensagem quando o problema é mesmo credencial; outros erros (e-mail não confirmado,
  // projeto fora do ar, rede) aparecem como vieram, para não esconder a causa real.
  mostrarErro(error && (error.code === 'invalid_credentials' ? 'E-mail ou senha inválidos.' : error));
};

document.getElementById('sair').onclick = () => db.auth.signOut();

// Toda vez que a sessão muda (abriu a página, entrou, saiu), troca a tela.
db.auth.onAuthStateChange((_evento, sessao) => {
  telaLogin.hidden = !!sessao;
  telaApp.hidden = !sessao;
  const email = sessao ? sessao.user.email : '';
  document.getElementById('quem').textContent = email;
  document.getElementById('avatar').textContent = email.charAt(0).toUpperCase();
  if (sessao) setTimeout(carregar, 0); // fora do callback, como a doc do Supabase recomenda
  else lista.replaceChildren();
});

// 3) LER — SELECT * FROM tarefas ORDER BY criado_em DESC (a RLS só libera para o admin)
async function carregar() {
  const { data, error } = await db.from('tarefas').select('*').order('criado_em', { ascending: false });
  mostrarErro(error);
  const tarefas = data ?? [];
  lista.replaceChildren(...tarefas.map(criarItem));

  // Contador, barra de progresso e mensagem de lista vazia
  const feitas = tarefas.filter((t) => t.feita).length;
  document.getElementById('vazio').hidden = tarefas.length > 0;
  document.getElementById('resumo').textContent = tarefas.length ? `${feitas} de ${tarefas.length} concluídas` : '';
  document.getElementById('barra').style.width = tarefas.length ? `${(feitas / tarefas.length) * 100}%` : '0';
}

// Monta um <li>. textContent (nunca innerHTML) impede que o texto digitado vire HTML (XSS).
function criarItem(tarefa) {
  const li = document.createElement('li');
  li.className = tarefa.feita ? 'feita' : '';

  const marcar = document.createElement('input');
  marcar.type = 'checkbox';
  marcar.checked = tarefa.feita;
  marcar.setAttribute('aria-label', 'Concluir: ' + tarefa.titulo);
  marcar.onchange = () => alterar(tarefa.id, { feita: marcar.checked });

  const texto = document.createElement('span');
  texto.textContent = tarefa.titulo;

  const apagar = document.createElement('button');
  apagar.textContent = '✕';
  apagar.className = 'perigo';
  apagar.setAttribute('aria-label', 'Apagar: ' + tarefa.titulo);
  apagar.onclick = () => remover(tarefa.id);

  li.append(marcar, texto, apagar);
  return li;
}

// 4) CRIAR
form.onsubmit = async (e) => {
  e.preventDefault();
  const { error } = await db.from('tarefas').insert({ titulo: campo.value.trim() });
  mostrarErro(error);
  if (!error) campo.value = '';
  carregar();
};

// 5) ATUALIZAR
async function alterar(id, campos) {
  const { error } = await db.from('tarefas').update(campos).eq('id', id);
  mostrarErro(error);
  carregar();
}

// 6) APAGAR
async function remover(id) {
  const { error } = await db.from('tarefas').delete().eq('id', id);
  mostrarErro(error);
  carregar();
}
