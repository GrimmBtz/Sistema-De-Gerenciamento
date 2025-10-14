
let produtos = JSON.parse(localStorage.getItem("produtos")) || []

// Pega o formulário HTML pelo seu ID.
const form = document.getElementById("produtosForm")
// Pega o campo de input para o nome do produto.
const nomeInput = document.getElementById("nomeProduto")
// Pega o campo de input para o preço do produto.
const precoInput = document.getElementById("precoProduto")
// Pega o elemento <tbody> da tabela onde os produtos serão listados.
const tabela = document.getElementById("tabelaProdutos")
// Pega o botão para gerar o código de barras/QR Code e adicionar o produto.
const gerarBtn = document.getElementById("gerarBtn")
// Pega o botão para gerar o relatório em PDF.
const gerarPDFbtn = document.getElementById("gerarPDF")

// Função responsável por recarregar e exibir a lista de produtos na tabela HTML.
function rendertabela(){
    // Limpa o conteúdo atual da tabela (remove todas as linhas existentes).
    tabela.innerHTML = ""

    // Itera sobre cada 'produto' dentro do array 'produtos'.
    produtos.forEach((produto) => {
        // Cria um novo elemento de linha de tabela (<tr>).
        const tr = document.createElement("tr")
        // Define o HTML interno da linha com os dados do produto.
        // Usa `produto.id`, `produto.nome`, `produto.preco`.
        // Adiciona as imagens para o código de barras e QR Code (caminhos salvos em `produto.barcode` e `produto.qrcode`).
        // Cria botões "Editar" e "Excluir", chamando funções JS com o ID do produto.
        tr.innerHTML = `
        <td>${produto.id}</td>
        <td>${produto.nome}</td>
        <td>R$ ${produto.preco}</td>
        <td><img src="${produto.barcode}" alt="Código de Barras"></td>
        <td><img src="${produto.qrcode}" alt="QR Code"></td>
        <td>
        <button class="edit" onclick="editarProduto(${produto.id})">Editar</button>
        <button class="delete" onclick="deletarProduto(${produto.id})">Excluir</button>
        </td>
        `
        // Adiciona a nova linha (<tr>) ao corpo da tabela (<tbody>).
        tabela.appendChild(tr)
    });

    // Salva o array 'produtos' atualizado no armazenamento local do navegador (localStorage).
    // O array é convertido para string JSON antes de salvar ('JSON.stringify(produtos)').
    localStorage.setItem("produtos", JSON.stringify(produtos))
}

// Função para gerar o código de barras, QR Code e adicionar um novo produto.
function gerarCodigo() {
    // Pega o valor do nome do produto e remove espaços em branco extras (trim()).
    const nome = nomeInput.value.trim()

    const preco = precoInput.value.trim()
     // Adicionado: Pega o valor do preço.
    // Verifica se o nome OU || o preço está vazio. Se estiver, mostra um alerta e sai da função.
    if (!nome || !preco) return alert("Digite o nome do produto é preço")
    
    // Procura se já existe um produto com o MESMO nome (ignora maiúsculas/minúsculas)
    const nomeDigitado = nome.toLowerCase();
    const jaExiste = produtos.find(
        (p) => p.nome.toLowerCase() === nomeDigitado
    );

    // Se já existir, avisa o usuário e PARA a função aqui.
    if (jaExiste) {
        alert("Ops! Este produto já está cadastrado.");
        return; 
    }

    // Gera um ID único baseado no timestamp atual
    const id = Date.now()

    // Cria um elemento <canvas> temporário para desenhar o código de barras.
    const svgBar = document.createElement("canvas")

    // Usa a biblioteca JsBarcode para desenhar o código de barras no canvas.
    // O código de barras é baseado no 'id' convertido para string, no formato CODE128.
    JsBarcode(svgBar, id.toString(), { format: "CODE128"}) // biblioteca js

    // Converte o conteúdo do canvas (o código de barras) para uma URL de dados 
    const barcode = svgBar.toDataURL("image/png")


    // Cria um elemento <div> temporário onde o QR Code será renderizado.
    const qrcodeCanavas = document.createElement("div")

    // Cria uma nova instância do objeto QRcode 
    // Ele renderiza o QR Code dentro do 'qrcodeCanavas'.
    // O conteúdo do QR Code é o 'id' convertido para string.
    const qr = new QRcode(qrcodeCanavas, {
        Text: id.toString(),
        width: 100,
        height: 100
    })

    // Depois que o QR Code é gerado, a biblioteca geralmente insere uma tag <img> dentro do <div>.
    // Esta linha tenta pegar essa imagem.
    const qrImg = qrcodeCanavas.querySelector("img")

    // Um pequeno atraso (500ms) é necessário para garantir que a biblioteca QR Code tenha terminado
    // de gerar a imagem e que 'qrImg.src' tenha o valor correto antes de prosseguir.
    setTimeout(() => {
        // Cria o objeto 'produto' com todos os dados coletados e gerados.
        const produto = {
            id, // ID gerado
            nome, // Nome do input
            preco, // Preço do input (já corrigido para ser do precoInput)
            barcode, // URL de dados do código de barras
            qrcode: qrImg.src // URL de dados do QR Code (obtido da tag <img>)
        }

        // Adiciona o novo produto ao array principal.
        produtos.push(produto)

        // Limpa o campo de nome para o próximo produto.
        nomeInput.value = ""
        // Limpa o campo de preço (Adicionado: para uma melhor experiência de usuário).
        precoInput.value = "" // Adicionado: Limpa o campo de preço.

        // Chama a função para redesenhar a tabela e salvar no localStorage.
        rendertabela()
    }, 500)
}

// Função chamada ao clicar no botão 'Editar' de um produto específico.
function editarProduto(id) {
    // Pede ao usuário o novo nome do produto usando uma caixa de diálogo 'prompt'.
    const novoNome = prompt("Digite o novo nome do produto:")
    // Pede ao usuário o novo preço do produto usando uma caixa de diálogo 'prompt'.
    const novoPreco = prompt("Digite o novo preço do produto")

    // Se o usuário clicar em Cancelar ou deixar em branco em qualquer prompt, sai da função.
    if (!novoNome || !novoPreco) return
    
    // Procura o objeto 'produto' no array que tenha o ID correspondente.
    const produto = produtos.find((p) => p.id === id)
    // Atualiza a propriedade 'nome' do objeto encontrado.
    produto.nome = novoNome
    // Atualiza a propriedade 'preco' do objeto encontrado.
    produto.preco = novoPreco

    // Redesenha a tabela para mostrar as alterações (e salva no localStorage).
    rendertabela()
}

// Função chamada ao clicar no botão 'Excluir' de um produto específico.
function deletarProduto(id) {
    // Exibe uma caixa de confirmação. Se o usuário confirmar (clicar em OK).
    if (confirm("tem certeza que deseja excluir este produto?")) {
        // Filtra o array 'produtos', criando um novo array que exclui o produto com o ID correspondente.
        // O array 'produtos' é reatribuído com este novo array.
        produtos = produtos.filter((p) => p.id !== id)
        // Redesenha a tabela para refletir a exclusão (e salva no localStorage).
        rendertabela()
    }
}

// Função assíncrona para gerar e baixar um relatório em PDF usando a biblioteca jsPDF.
async function gerarPDF() {
    // --- Configuração do jsPDF ---

    // Importa a classe construtora 'jsPDF' do objeto global 'window.jspdf' (assumindo que a biblioteca foi carregada).
    const { jsPDF} = window.jspdf
    
    // Cria uma nova instância do documento PDF.
    const doc = new jsPDF()
    

    // Define o tamanho da fonte.
    doc.setFontSize(18)
    // Adiciona o texto do título nas coordenadas (70, 15) do PDF.
    doc.text("Relatório de produtos", 70, 15)


    // Variável para controlar a posição vertical (eixo Y) onde o próximo item será desenhado.
    let y = 30 

    // Itera sobre cada produto no array 'produtos'. O 'for...of' é usado com 'await'.
    for (const produto of produtos) {
        // Adiciona o texto do ID, Nome e Preço do produto no documento nas coordenadas (10, y).
        doc.text(`ID: ${produto.id}`, 10, y)
        doc.text(`Produto: ${produto.nome}`, 50, y) // Ajustado: movi o nome e preço para não sobrepor o ID
        doc.text(`Preço: ${produto.preco}`, 120, y) // Ajustado: movi o nome e preço para não sobrepor o ID

        // O 'await new Promise' é crucial aqui para lidar com a natureza assíncrona do carregamento de imagens.
        // Ele garante que o processamento do PDF PARE até que as imagens tenham carregado.
        await new Promise((resolve) => {
            // Cria novos objetos Image nativos do navegador para carregar as URLs de dados do código de barras e QR Code.
            const imgBar = new Image()
            const imgQR = new Image()

            // Define a fonte da imagem para as URLs de dados salvas. Isso inicia o carregamento.
            imgBar.src = produto.barcode
            imgQR.src = produto.qrcode

            // O código dentro de 'imgQR.onload' só é executado quando a imagem do QR Code terminar de carregar.
            // (Presume-se que o QR Code será o último a carregar ou que seu carregamento indica que o código de barras também está pronto).
            imgQR.onload = () => {
                // Adiciona a imagem do Código de Barras ao PDF: doc.addImagem(imagem, formato, x, y, largura, altura).
                // NOTA: O método correto em jsPDF é 'addImage', não 'addImagem'.
                doc.addImage(imgBar, "PNG", 10, y + 10, 60, 20)
                // Adiciona a imagem do QR Code ao PDF.
                doc.addImage(imgQR, "PNG", 80, y + 5, 25, 25)
                
                // Avança a posição Y para o próximo produto, garantindo que haja espaço.
                y += 40
                
                // Resolve a Promise, permitindo que o loop 'for...of' continue para o próximo produto.
                resolve()
            }
        })
    }
    // Salva o documento PDF com o nome especificado, iniciando o download no navegador.
    doc.save("relatorio_produtos.pdf")
}


// Quando o botão for clicado, a função 'gerarCodigo' será executada.
gerarBtn.addEventListener("click", gerarCodigo)

// Quando o botão for clicado, a função 'gerarPDF' será executada.
gerarPDFbtn.addEventListener("click", gerarPDF)

// Chama a função 'rendertabela' uma vez quando o script é carregado.
rendertabela()