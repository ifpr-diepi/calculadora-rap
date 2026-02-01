import { useState, useMemo, useEffect } from 'react';

// 1. Definição do que é um curso vindo do JSON
interface CursoDB {
  tipo: string;
  eixo: string;
  curso: string;
  fec: string | number;
}

// 2. Definição do que é um item na sua lista de cálculos
interface ItemLista {
  id: number;
  curso: string;
  tipo: string;
  eixo: string;
  n: number;
  fec: number;
  fech: number;
  mateq: number;
  fcg: number;
  meqRap: number;
  chOriginal: number;
}

export default function App() {
  const [cursosDB, setCursosDB] = useState<CursoDB[]>([]);
  const [lista, setLista] = useState(() => {
    const saved = localStorage.getItem('pnp_lista');
    return saved ? JSON.parse(saved) : [];
  });

  const [prof20h, setProf20h] = useState(() => localStorage.getItem('pnp_p20') || 0);
  const [prof40h, setProf40h] = useState(() => localStorage.getItem('pnp_p40') || 0);
  const [profDE, setProfDE] = useState(() => localStorage.getItem('pnp_pde') || 0);

  const [tipoSel, setTipoSel] = useState("");
  const [eixoSel, setEixoSel] = useState("");
  const [cursoObj, setCursoObj] = useState<CursoDB | null>(null);
  const [nomeCustom, setNomeCustom] = useState("");
  const [matriculas, setMatriculas] = useState(1);
  const [chmr, setChmr] = useState(800);

  // Salvamento automático
  useEffect(() => {
    localStorage.setItem('pnp_lista', JSON.stringify(lista));
    localStorage.setItem('pnp_p20', prof20h.toString());
    localStorage.setItem('pnp_p40', prof40h.toString());
    localStorage.setItem('pnp_pde', profDE.toString());
  }, [lista, prof20h, prof40h, profDE]);

  // Carregamento do JSON - Ajustado para GitHub Pages
  useEffect(() => {
    console.log("Tentando carregar o arquivo: cursos_fec.json");
    fetch('./cursos_fec.json')
      .then(response => {
        if (!response.ok) {
          console.error("ERRO: O arquivo cursos_fec.json não foi encontrado na pasta!");
          throw new Error("Arquivo não encontrado");
        }
        return response.json();
      })
      .then(dados => {
        console.log("Dados carregados com sucesso:", dados.length, "cursos.");
        if (dados.length === 0) console.error("AVISO: O arquivo JSON está vazio!");
        setCursosDB(dados);
      })
      .catch(err => {
        console.error("ERRO DE CARREGAMENTO: Verifique se o arquivo JSON está formatado corretamente.");
        console.error(err);
      });
  }, []);

  // Filtros memorizados (useMemo)
  const tiposDisponiveis = useMemo(() => {
    return cursosDB.length > 0 ? [...new Set(cursosDB.map(c => c.tipo))].sort() : [];
  }, [cursosDB]);

  const eixosDisponiveis = useMemo(() => {
    if (!tipoSel || cursosDB.length === 0) return [];
    return [...new Set(cursosDB.filter(c => c.tipo === tipoSel).map(c => c.eixo))].sort();
  }, [tipoSel, cursosDB]);

  const cursosDisponiveis = useMemo(() => {
    if (!tipoSel || !eixoSel || cursosDB.length === 0) return [];
    return cursosDB.filter(c => c.tipo === tipoSel && c.eixo === eixoSel)
      .sort((a, b) => a.curso.localeCompare(b.curso));
  }, [tipoSel, eixoSel, cursosDB]);

  // Lógica de Fatores
  const isQualificacao = tipoSel === "Qualificação Profissional";
  const isGraduacao = ["Tecnologia", "Licenciatura", "Bacharelado"].includes(tipoSel);
  const currentFECH = isQualificacao ? (Number(chmr) / 800) : 1;
  const currentFCG = isGraduacao ? 1.1111 : 1;

  const adicionar = () => {
    if (!cursoObj) return;
    const fecLimpo = Number(cursoObj.fec.toString().replace(',', '.'));
    const nomeFinal = (cursoObj.curso.toUpperCase() === "TODOS") ? nomeCustom : cursoObj.curso;

    if ((cursoObj.curso.toUpperCase() === "TODOS") && !nomeCustom) return console.error("Digite o nome do curso!");

    const mateq = Number(matriculas) * fecLimpo * currentFECH;
    const mateqRap = mateq * currentFCG;

    setLista([{
      id: Date.now(),
      curso: nomeFinal,
      tipo: tipoSel,
      eixo: eixoSel,
      n: Number(matriculas),
      fec: fecLimpo,
      fech: currentFECH,
      mateq: mateq,
      fcg: currentFCG,
      meqRap: mateqRap,
      chOriginal: chmr // para edição
    }, ...lista]);

    setCursoObj(null); setNomeCustom("");
  };

  const remover = (id: number) => setLista(lista.filter((i: ItemLista) => i.id !== id));

  const deletarTudo = () => {
    if (confirm("Deseja apagar os cursos?")) {
      setLista([]); // Ao zerar aqui, o useEffect acima limpa o navegador
    }
  };

  const editar = (item: ItemLista) => {
    setTipoSel(item.tipo);
    setEixoSel(item.eixo);
    // Busca o objeto original no banco para manter a referência
    const original = cursosDB.find(c => c.tipo === item.tipo && c.eixo === item.eixo && (c.curso === item.curso || c.curso.toUpperCase() === "TODOS"));
    setCursoObj(original || null);
    if (original?.curso.toUpperCase() === "TODOS") setNomeCustom(item.curso);
    setMatriculas(item.n);
    setChmr(item.chOriginal || 800);
    remover(item.id);
  };

  // Totais
  const totalMateq = lista.reduce((acc: number, curr: ItemLista) => acc + curr.mateq, 0);
  const totalMateqRap = lista.reduce((acc: number, curr: ItemLista) => acc + curr.meqRap, 0);
  const totalProfeq = (Number(prof20h) * 0.5) + Number(prof40h) + Number(profDE);
  const rapFinal = totalProfeq > 0 ? (totalMateqRap / totalProfeq) : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Cabeçalho Ajustado */}
      <header className="mb-6 bg-emerald-800 text-white p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-center border-b-2">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-black uppercase tracking-tight italic text-emerald-300 tracking-widest">CALCULADORA RAP</h1>
          <p className="text-sm opacity-80 font-semibold tracking-wide mt-1">IFPR • Portaria 146/2021</p>
        </div>
        <div className="bg-emerald-900/50 p-4 rounded-2xl border border-emerald-700/50 text-center min-w-[180px]">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Resultado RAP</div>
          <div className="text-5xl font-black text-white">{rapFinal.toFixed(2)}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Formulário com labels externos */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold mb-6 text-emerald-800 flex items-center gap-2">
              <i className="fas fa-plus-circle text-emerald-600"></i> Adicionar Matrículas
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Tipo de Curso</label>
                <select className="w-full mt-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500" value={tipoSel} onChange={e => { setTipoSel(e.target.value); setEixoSel(""); setCursoObj(null); }}>
                  <option value="">Selecione o tipo...</option>
                  {tiposDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Eixo Tecnológico</label>
                <select disabled={!tipoSel} className="w-full mt-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none disabled:opacity-30" value={eixoSel} onChange={e => { setEixoSel(e.target.value); setCursoObj(null); }}>
                  <option value="">Selecione o eixo...</option>
                  {eixosDisponiveis.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Curso</label>
                <select disabled={!eixoSel} className="w-full mt-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none disabled:opacity-30" value={cursoObj?.curso || ""} onChange={e => setCursoObj(cursosDB.find(c => c.curso === e.target.value && c.tipo === tipoSel && c.eixo === eixoSel) || null)}>
                  <option value="">Selecione o curso...</option>
                  {cursosDisponiveis.map(c => <option key={c.curso} value={c.curso}>{c.curso}</option>)}
                </select>
              </div>

              {cursoObj?.curso.toUpperCase() === "TODOS" && (
                <div>
                  <label className="text-[11px] font-bold text-amber-600 uppercase ml-1">Nome Específico</label>
                  <input type="text" className="w-full mt-1 p-3 bg-amber-50 border-2 border-amber-200 rounded-2xl font-bold" value={nomeCustom} onChange={e => setNomeCustom(e.target.value)} placeholder="Digite o nome real do curso..." />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Matrícula</label>
                  <input type="number" className="w-full mt-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={matriculas} onChange={e => setMatriculas(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Carga Horária</label>
                  <input type="number" disabled={!isQualificacao} className={`w-full mt-1 p-3 border-2 rounded-2xl font-bold ${isQualificacao ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-100 opacity-30'}`} value={chmr} onChange={e => setChmr(Number(e.target.value))} />
                </div>
              </div>
              <button onClick={adicionar} disabled={!cursoObj} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 disabled:opacity-20 transition-all uppercase">Adicionar à Lista</button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
              <i className="fas fa-chalkboard-teacher"></i> Professor Equivalente
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Regime 20h (x0.5)</span>
                <input type="number" className="w-16 bg-white border rounded-lg p-1 text-center font-bold" value={prof20h} onChange={e => setProf20h(e.target.value)} />
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Regime 40h (x1.0)</span>
                <input type="number" className="w-16 bg-white border rounded-lg p-1 text-center font-bold" value={prof40h} onChange={e => setProf40h(e.target.value)} />
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Regime DE (x1.0)</span>
                <input type="number" className="w-16 bg-white border rounded-lg p-1 text-center font-bold" value={profDE} onChange={e => setProfDE(e.target.value)} />
              </div>
              <div className="pt-3 flex justify-between items-center border-t border-blue-50">
                <span className="text-[10px] font-black text-blue-900 uppercase">Total Professor Equivalente:</span>
                <span className="text-2xl font-black text-blue-600 italic">{totalProfeq.toFixed(1)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Tabela com as novas colunas */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col min-h-[750px]">
            <div className="p-6 bg-slate-50/80 border-b flex justify-between items-center">
              <span className="font-black text-slate-600 text-xs uppercase tracking-widest">Quadro de matrículas equivalentes</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{lista.length} Registros</span>
              <button onClick={deletarTudo} className="text-[9px] font-black bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-600 hover:text-white transition-all">LIMPAR TUDO</button>
            </div>
            <div className="flex-grow overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/30 border-b text-[10px] font-black uppercase text-slate-400">
                    <th className="p-4 text-left">Curso</th>
                    <th className="p-4 text-center">N</th>
                    <th className="p-4 text-center">FEC</th>
                    <th className="p-4 text-center">FECH</th>
                    <th className="p-4 text-center bg-slate-100/50 text-slate-600">MatEq</th>
                    <th className="p-4 text-center text-amber-600 italic">FCG</th>
                    <th className="p-4 text-right text-emerald-700">MatEq-RAP</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lista.map((i: ItemLista) => (
                    <tr key={i.id} className="hover:bg-emerald-50/20 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{i.curso}</div>
                        <div className="text-[9px] opacity-40 uppercase font-black">{i.tipo}</div>
                      </td>
                      <td className="p-4 text-center font-mono text-xs">{i.n}</td>
                      <td className="p-4 text-center font-mono text-xs">{i.fec.toFixed(3)}</td>
                      <td className="p-4 text-center font-mono text-xs text-blue-500">{i.fech.toFixed(2)}</td>
                      <td className="p-4 text-center font-bold text-xs bg-slate-50/50">{i.mateq.toFixed(4)}</td>
                      <td className="p-4 text-center font-mono text-xs text-amber-600">{i.fcg.toFixed(3)}</td>
                      <td className="p-4 text-right font-black text-emerald-800 italic">{i.meqRap.toFixed(4)}</td>
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => editar(i)} title="Editar" className="text-slate-300 hover:text-blue-500 transition-colors"><i className="fas fa-edit"></i></button>
                          <button onClick={() => remover(i.id)} title="Excluir" className="text-slate-200 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-[10px]"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALIZADORES INFERIORES */}
            <div className="p-8 bg-slate-900 text-white grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 border-emerald-500">
              <div className="flex gap-4 items-center border-r border-slate-700 pr-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">Σ</div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Total Matrícula Equivalente</div>
                  <div className="text-2xl font-black text-emerald-50 tracking-tighter">{totalMateq.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</div>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/40 flex items-center justify-center text-emerald-300 font-black italic">R</div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Total Matrícula Equivalente RAP</div>
                  <div className="text-2xl font-black text-white tracking-tighter">{totalMateqRap.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MEMÓRIA DE CÁLCULO - EXPLICAÇÃO FINAL DA TELA */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
        <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-8 flex items-center gap-3">
          <i className="fas fa-book text-emerald-600"></i> Memória de Cálculo (Metodologia PNP)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="font-black text-[10px] uppercase text-emerald-600 tracking-widest border-b pb-2">1. Matrícula Equivalente (MatEq)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Representa a carga de trabalho gerada por cada curso, ponderada pelo seu esforço.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl font-mono text-[11px] border border-slate-100">
              MatEq = N x FEC x FECH
            </div>
            <ul className="text-[10px] space-y-2 text-slate-600">
              <li>• <b>N:</b> Número de matrículas atendidas no período.</li>
              <li>• <b>FEC (Fator de Esforço):</b> Peso de custo relativo ao eixo (Anexo II - Portaria 146/2021).</li>
              <li>• <b>FECH (Carga Horária):</b> Razão entre CHMR e carga padrão de 800h (apenas para cursos FIC). Outros cursos possuem FECH = 1.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-[10px] uppercase text-amber-600 tracking-widest border-b pb-2">2. MatEq-RAP (Fator de Correção)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ajuste necessário para unificar as metas de 18 alunos/professor (graduação) e 20 alunos/professor (técnico).
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl font-mono text-[11px] border border-slate-100">
              MatEq-RAP = MatEq x FCG
            </div>
            <ul className="text-[10px] space-y-2 text-slate-600">
              <li>• <b>FCG (Fator de Correção de Graduação):</b> Valor fixo de <b>1,111</b> (calculado como 20/18).</li>
              <li>• Aplicado exclusivamente a cursos de <b>Tecnologia, Licenciatura e Bacharelado</b>. Para os demais cursos, o FCG é 1.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-[10px] uppercase text-blue-600 tracking-widest border-b pb-2">3. RAP (Relação Aluno-Professor)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Indicador final de eficiência docente do campus.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl font-mono text-[11px] border border-slate-100">
              RAP Final = Σ MatEq-RAP / Profeq
            </div>
            <ul className="text-[10px] space-y-2 text-slate-600">
              <li>• <b>Profeq (Professor Equivalente):</b> Calculado como a soma ponderada do regime de trabalho:</li>
              <li className="font-bold text-blue-700 bg-blue-50 p-2 rounded-lg italic">Profeq = (RT 20h x 0.5) + RT 40h + RT DE</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="mt-12 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest opacity-50">
        Baseado no Art. 7º e Anexo II da Portaria MEC nº 146, de 25 de março de 2021.
      </footer>
    </div>
  );
};