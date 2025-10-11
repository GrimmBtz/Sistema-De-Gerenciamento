let produtos = JSON.parse(localStorage.getItem("produtos")) || []

const form = document.getElementById("produtoForm")
const nomeInput = document.getElementById("nomeProduto")
const precoInput = document.getElementById("precoProduto")
const tabela = document.getElementById("tabelaProdutos")
const gerarBtn = document.getElementById("gerarBtn")
const gerarPDFbtn = document.getElementById("gerarPDF")

function rendertabela(){
    tabela.innerHTML = ""

    produtos.forEach((produto) => {
        const tr = document.createElement("tr")
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
        tabela.appendChild(tr)
    });

    localStorage.setItem("produtos", JSON.stringify(produtos))
}

function gerarCodigo() {
    const nome = nomeInput.value.trim()
    const preco = precoInput.value.trim()

    if (!nome || !preco) return alert("Digite o nome do produto e o preço")

    const id = Date.now()

    // Gerar código de barras
    const canvasBar = document.createElement("canvas")
    JsBarcode(canvasBar, id, { format: "CODE128" })
    const barcode = canvasBar.toDataURL("image/png")

    // Gerar QR Code
    const qrcodeContainer = document.createElement("div")
    const qr = new QRCode(qrcodeContainer, {
        text: id,
        width: 100,
        height: 100
    })

    // Esperar o QR Code ser renderizado (async workaround)
    setTimeout(() => {
        const qrImg = qrcodeContainer.querySelector("img")
        const produto = {
            id,
            nome,
            preco,
            barcode,
            qrcode: qrImg.src
        }

        produtos.push(produto)

        nomeInput.value = ""
        precoInput.value = ""

        rendertabela()
    }, 500)
}

function editarProduto(id) {
    const novoNome = prompt("Digite o novo nome do produto:")
    const novoPreco = prompt("Digite o novo preço do produto:")

    if (!novoNome || !novoPreco) return
    
    const produto = produtos.find((p) => p.id === id)
    if (!produto) return

    produto.nome = novoNome
    produto.preco = novoPreco

    rendertabela()
}

function deletarProduto(id) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        produtos = produtos.filter((p) => p.id !== id)
        rendertabela()
    }
}

async function gerarPDF() {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text("Relatório de produtos", 70, 15)

    let y = 30 

    for (const produto of produtos) {
        doc.setFontSize(12)
        doc.text(`ID: ${produto.id}`, 10, y)
        doc.text(`Produto: ${produto.nome}`, 10, y + 6)
        doc.text(`Preço: ${produto.preco}`, 10, y + 12)

        await new Promise((resolve) => {
            const imgBar = new Image()
            const imgQR = new Image()

            imgBar.src = produto.barcode
            imgQR.src = produto.qrcode

            imgQR.onload = () => {
                doc.addImage(imgBar, "PNG", 10, y + 20, 60, 20)
                doc.addImage(imgQR, "PNG", 80, y + 15, 25, 25)
                y += 60
                resolve()
            }
        })
    }

    doc.save("relatorio_produtos.pdf")
}

gerarBtn.addEventListener("click", gerarCodigo)
gerarPDFbtn.addEventListener("click", gerarPDF)

rendertabela()
