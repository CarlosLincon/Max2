document.addEventListener('DOMContentLoaded', () => {
    let jogos = [];

    // Função para carregar e processar o arquivo Excel
    function lerArquivoExcel() {
        fetch('lotofacil.xlsx') // Substitua 'lotofacil.xlsx' pelo caminho correto do arquivo
            .then(response => response.arrayBuffer())
            .then(data => {
                // Lê o arquivo Excel
                const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                // Converte a primeira planilha para JSON
                const dados = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                // Processa os dados do Excel
                jogos = processarDadosExcel(dados);
                
                // Gera a dashboard com os dados processados
                gerarDashboard(jogos);
            })
            .catch(error => console.error('Erro ao carregar o arquivo Excel:', error));
    }

    // Função para processar os dados do Excel
    function processarDadosExcel(dados) {
        // Extrai os dados a partir do JSON da planilha
        return dados.slice(1).map((row, index) => ({
            jogo: index + 1, // Número do jogo
            data: row[1],    // Data do jogo
            numeros: row.slice(2, 17) // Os números do jogo (colunas 3 até 17)
        }));
    }

    // Função para gerar a dashboard com os jogos carregados
    function gerarDashboard(jogos) {
        exibirJogos(jogos);
        const frequencia = calcularFrequenciaNumeros(jogos);
        gerarGraficoFrequencia(frequencia);
        exibirChanceProximoResultado(jogos);
        exibirHotColdNumbers(jogos);
        preencherSelecaoNumeros(jogos);
    }

    // Função para exibir os jogos na tabela
    function exibirJogos(jogos) {
        const tableBody = document.getElementById('games-table');
        tableBody.innerHTML = ''; // Limpa a tabela

        jogos.forEach(game => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${game.jogo}</td>
                <td>${game.data}</td>
                <td>${game.numeros.join(', ')}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Função para calcular a frequência de cada número
    function calcularFrequenciaNumeros(jogos) {
        const frequencia = Array(25).fill(0); // Array para contar frequência de números 1 a 25

        jogos.forEach(jogo => {
            jogo.numeros.forEach(numero => {
                if (numero) {
                    frequencia[numero - 1]++;
                }
            });
        });

        return frequencia;
    }

    // Função para gerar gráfico de frequência dos números
    function gerarGraficoFrequencia(frequencia) {
        const ctx = document.getElementById('frequency-chart').getContext('2d');

        if (window.frequencyChart) {
            window.frequencyChart.destroy(); // Destroi o gráfico existente para gerar um novo
        }

        window.frequencyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 25 }, (_, i) => i + 1),
                datasets: [{
                    label: 'Frequência dos Números',
                    data: frequencia,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Função para exibir a chance do próximo resultado
    function exibirChanceProximoResultado(jogos) {
        const tableBody = document.getElementById('next-numbers');
        tableBody.innerHTML = ''; // Limpa a tabela

        // Adicione aqui a lógica para calcular a chance do próximo resultado
        const frequencia = calcularFrequenciaNumeros(jogos);
        const recomendacoes = frequencia.map((freq, idx) => ({ numero: idx + 1, frequencia: freq }))
                                        .sort((a, b) => b.frequencia - a.frequencia)
                                        .slice(0, 15); // Pegue os 15 números mais frequentes

        recomendacoes.forEach(recomendacao => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${recomendacao.numero}</td>
                <td>${recomendacao.frequencia}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Função para exibir números quentes, frios e neutros
function exibirHotColdNumbers(jogos) {
    const tableBody = document.getElementById('hot-cold-numbers');
    tableBody.innerHTML = ''; // Limpa a tabela

    const frequenciaTotal = calcularFrequenciaNumeros(jogos);
    const frequenciaUltimos10Jogos = calcularFrequenciaNumeros(jogos.slice(-10));

    // Critérios ajustados para "quente", "frio" e "neutro"
    const status = frequenciaTotal.map((freqTotal, idx) => {
        const freqUltimos10 = frequenciaUltimos10Jogos[idx];
        let status;

        if (freqUltimos10 === 0) {
            status = 'Frio'; // Não apareceu nos últimos 10 jogos
        } else if (freqUltimos10 >= 5) {
            status = 'Quente'; // Apareceu 3 ou mais vezes nos últimos 10 jogos
        } else {
            status = 'Neutro'; // Apareceu 1 ou 2 vezes nos últimos 10 jogos
        }

        return {
            numero: idx + 1,
            frequenciaTotal: freqTotal,
            frequenciaUltimos10: freqUltimos10,
            status: status
        };
    });

    status.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.numero}</td>
            <td>${item.frequenciaTotal}</td>
            <td>${item.frequenciaUltimos10}</td>
            <td>${item.status}</td>
        `;
        tableBody.appendChild(row);
    });
}


    // Função para exibir análise de acompanhamento de números
    function exibirAcompanhamentoNumeros() {
        const numeroSelecionado = parseInt(document.getElementById('numero-selecionado').value, 10);
        if (!numeroSelecionado) return;

        const tableBody = document.getElementById('acompanhamento-numeros');
        tableBody.innerHTML = ''; // Limpa a tabela

        const acompanhamentos = calcularAcompanhamentoNumeros(jogos, numeroSelecionado);

        acompanhamentos.forEach(acompanhamento => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${acompanhamento.numero}</td>
                <td>${acompanhamento.quantidade}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Função para calcular quantas vezes um número foi acompanhado por outro
    function calcularAcompanhamentoNumeros(jogos, numeroSelecionado) {
        const acompanhamentos = Array(25).fill(0); // Array para contar acompanhamentos

        jogos.forEach(jogo => {
            const count = jogo.numeros.filter(num => num !== numeroSelecionado).length;
            if (count > 0) {
                jogo.numeros.forEach(num => {
                    if (num !== numeroSelecionado) {
                        acompanhamentos[num - 1]++;
                    }
                });
            }
        });

        return acompanhamentos.map((quantidade, idx) => ({ numero: idx + 1, quantidade }))
                           .sort((a, b) => b.quantidade - a.quantidade);
    }

    // Função para preencher a seleção de números
    function preencherSelecaoNumeros(jogos) {
        const select = document.getElementById('numero-selecionado');
        select.innerHTML = ''; // Limpa o select

        // Adiciona as opções para o select
        for (let i = 1; i <= 25; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i;
            select.appendChild(option);
        }

        // Adiciona o evento de mudança para o select
        select.addEventListener('change', exibirAcompanhamentoNumeros);
    }

    // Função para atualizar os jogos filtrados
    function atualizarJogosFiltrados() {
        const filtro = document.getElementById('filtro-jogos').value;
        const jogosFiltrados = jogos.filter(jogo => jogo.data.includes(filtro));
        exibirJogos(jogosFiltrados);
    }

    // Carrega o arquivo Excel ao carregar a página
    lerArquivoExcel();
});
