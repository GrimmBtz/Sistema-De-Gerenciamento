// Tenta carregar os produtos salvos no localStorage, se não houver, inicia um array vazio.
let produtos = JSON.parse(localStorage.getItem("produtos")) || []

// Pega os elementos HTML pelos seus IDs.
const form = document.getElementById("produtoForm")
const nomeInput = document.getElementById("nomeProduto")
const precoInput = document.getElementById("precoProduto")
const tabela = document.getElementById("tabelaProdutos") // Corpo (tbody) da tabela.
const gerarBtn = document.getElementById("gerarBtn")
const gerarPDFbtn = document.getElementById("gerarPDF")

// Função para renderizar (desenhar) a lista de produtos na tabela HTML.
function rendertabela(){
    // Limpa o conteúdo atual da tabela.
    tabela.innerHTML = ""

    // Itera sobre cada produto no array 'produtos'.
    produtos.forEach((produto) => {
        // Cria uma nova linha na tabela (tr).
        const tr = document.createElement("tr")
        // Define o HTML da linha com os dados do produto, incluindo imagens e botões de ação.
        tr.innerHTML = `
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>${produto.preco}</td>
            <td><img src="${produto.barcode}" alt="Código de Barras"></td>
            <td><img src="${produto.qrcode}" alt="QR Code"></td>
            <td>
                <button class="edit" onclick="editarProduto(${produto.id})">Editar</button>
                <button class="delete" onclick="deletarProduto(${produto.id})">Excluir</button>
            </td>
        `
        // Adiciona a linha ao corpo da tabela.
        tabela.appendChild(tr)
    });

    // Salva o array 'produtos' atualizado no localStorage (convertendo para string JSON).
    localStorage.setItem("produtos", JSON.stringify(produtos))
}

// Função principal para adicionar um novo produto com seus códigos.
function gerarCodigo() {
    // Pega e limpa (trim) os valores dos inputs.
    const nome = nomeInput.value.trim()
    const preco = precoInput.value.trim()

    // Verifica se os campos estão preenchidos. Se não, alerta e sai da função.
    if (!nome || !preco) return alert("Digite o nome do produto e o preço")
    
    // Procura por duplicidade: converte o nome para minúsculas para comparação.
    const nomeDigitado = nome.toLowerCase();
    const jaExiste = produtos.find(
        (p) => p.nome.toLowerCase() === nomeDigitado
    );

    // Se o produto já existir, alerta e sai (return).
    if (jaExiste) {
        alert("Ops! Este produto já está cadastrado.");
        return; 
    }

    // Gera um ID único baseado no timestamp atual.
    const id = Date.now()

    // --- Gerar Código de Barras (JsBarcode) ---
    // Cria um canvas temporário para o código de barras.
    const canvasBar = document.createElement("canvas")
    // Desenha o código de barras (CODE128) no canvas.
    JsBarcode(canvasBar, id, { format: "CODE128" })
    // Converte o canvas para uma URL de dados (base64 PNG).
    const barcode = canvasBar.toDataURL("image/png")

    // --- Gerar QR Code (QRCode.js) ---
    // Cria um container (div) temporário onde o QR Code será renderizado.
    const qrcodeContainer = document.createElement("div")
    // Cria uma nova instância do QR Code, renderizando na div.
    const qr = new QRCode(qrcodeContainer, {
        text: id, // Conteúdo do QR Code
        width: 100,
        height: 100
    })

    // Esperar o QR Code ser renderizado (funções de QR code são assíncronas).
    setTimeout(() => {
        // Captura a tag <img> gerada pela biblioteca dentro do container.
        const qrImg = qrcodeContainer.querySelector("img")
        
        // Cria o objeto produto com todos os dados.
        const produto = {
            id,
            nome,
            preco,
            barcode,
            qrcode: qrImg.src // Captura o src da imagem (URL de dados)
        }

        // Adiciona o novo produto ao array.
        produtos.push(produto)

        // Limpa os campos de input.
        nomeInput.value = ""
        precoInput.value = ""

        // Atualiza a tabela na tela e salva no localStorage.
        rendertabela()
    }, 500)
}

// Função para editar um produto existente.
function editarProduto(id) {
    // Solicita novos valores ao usuário.
    const novoNome = prompt("Digite o novo nome do produto:")
    const novoPreco = prompt("Digite o novo preço do produto:")

    // Sai se o usuário cancelar ou não digitar nada.
    if (!novoNome || !novoPreco) return
    
    // Encontra o produto pelo ID.
    const produto = produtos.find((p) => p.id === id)
    // Se o produto não for encontrado, sai.
    if (!produto) return

    // Atualiza os dados.
    produto.nome = novoNome
    produto.preco = novoPreco

    // Atualiza a tabela e o localStorage.
    rendertabela()
}

// Função para excluir um produto.
function deletarProduto(id) {
    // Pede confirmação.
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        // Filtra o array, mantendo apenas os produtos que NÃO têm o ID fornecido.
        produtos = produtos.filter((p) => p.id !== id)
        // Atualiza a tabela.
        rendertabela()
    }
}

// Função assíncrona para gerar o relatório em PDF (usando jsPDF).
async function gerarPDF() {
    // Importa o construtor do jsPDF.
    const { jsPDF } = window.jspdf
    const doc = new jsPDF() // Cria um novo documento.

    // Define o título.
    doc.setFontSize(18)
    doc.text("Relatório de produtos", 70, 15)

    let y = 30 // Posição vertical inicial.

    // Itera sobre os produtos, usando 'await' para esperar o carregamento das imagens.
    for (const produto of produtos) {
        doc.setFontSize(12)
        doc.text(`ID: ${produto.id}`, 10, y)
        doc.text(`Produto: ${produto.nome}`, 10, y + 6)
        doc.text(`Preço: ${produto.preco}`, 10, y + 12)

        await new Promise((resolve) => {
            const imgBar = new Image()
            const imgQR = new Image()

            // Define as URLs das imagens.
            imgBar.src = produto.barcode
            imgQR.src = produto.qrcode

            // Espera a imagem do QR Code carregar.
            imgQR.onload = () => {
                // Adiciona a imagem do código de barras ao PDF.
                doc.addImage(imgBar, "PNG", 10, y + 20, 60, 20)
                // Adiciona a imagem do QR Code ao PDF.
                doc.addImage(imgQR, "PNG", 80, y + 15, 25, 25)
                y += 60 // Move a posição Y para baixo para o próximo item.
                resolve() // Resolve a Promise para continuar o loop 'for'.
            }
        })
    }

    // Salva e baixa o documento PDF.
    doc.save("relatorio_produtos.pdf")
}

// Adiciona os event listeners aos botões.
gerarBtn.addEventListener("click", gerarCodigo)
gerarPDFbtn.addEventListener("click", gerarPDF)

// Carrega os dados salvos ao iniciar o script.
rendertabela()