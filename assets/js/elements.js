document.head.innerHTML += `
      
      <style>
        .image-slide-container {
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.55);
          position: relative;
          overflow: hidden;
          padding: 2rem 0;
        }
    
        /* Fade nas bordas */
        .image-slide-container::before,
        .image-slide-container::after {
          content: "";
          position: absolute;
          top: 0;
          width: 80px;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        }
    
        .image-slide-container::before {
          left: 0;
          background: linear-gradient(to right, #000 0%, transparent 100%);
        }
    
        .image-slide-container::after {
          right: 0;
          background: linear-gradient(to left, #000 0%, transparent 100%);
        }
    
        .image-slide {
          display: flex;
          align-items: center;
          gap: 1rem;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding: 2rem;
        }
    
        .image-card {
          flex: 0 0 auto;
          aspect-ratio: 16 / 9;
          width: clamp(200px, 30vw, 320px);
          position: relative;
          margin-right: 1rem;
          background: #111;
          border: 2px solid #e50914;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 0 12px rgba(229, 9, 20, 0.5);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
    
        .image-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
    
        .image-card.selected {
          transform: scale(1.12);
          box-shadow: 0 0 25px rgba(229, 9, 20, 0.9);
          z-index: 5;
        }
        
        .card-actions {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease, pointer-events 0.3s ease;
        }
    
        .image-card.selected:hover .card-actions {
          opacity: 1;
          pointer-events: auto;
        }
    
        .card-actions button {
          background: rgba(0,0,0,0.7);
          border: none;
          color: #fff;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 14px;
          transition: background 0.3s ease;
        }
    
        .card-actions button:hover {
          background: #e50914;
        }
    
        .add-card {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 2rem;
          color: #e50914;
          cursor: pointer;
          background: #111;
          border: 2px dashed #e50914;
        }
    
        .add-card:hover {
          background: #1a1a1a;
        }
    
        .modal-content {
          background: #111;
          color: #fff;
          border: 2px solid #e50914;
        }
    
        .modal-header {
          border-bottom: 1px solid #e50914;
        }
    
        .modal-footer {
          border-top: 1px solid #e50914;
        }
        
        .image-name {
          position: absolute;
          top: 0;
          left: 1rem;
          display: block;
          opacity: 0;
          text-align: center;
          color: #fff;
          font-size: 0.9rem;
          margin-top: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: clamp(200px, 30vw, 320px);
          background: rgba(0, 0, 0, 0.7);
          padding: 2px 4px;
          border-radius: 4px;
          transition: opacity 0.3s ease;
        }
        
        .image-card.selected:hover .image-name {
          opacity: 1;
        }
      </style>
    `;

class ImageSlide {
  constructor(element) {
    this.element = element;

    // Definir propriedades para escopo global
    this.cropper = null;
    this.isChanging = false;
    
    this.element.innerHTML = `
    <div class="image-slide-container">
        <div class="image-slide">
          <div class="image-card add-card">
            <i class="fas fa-plus"></i>
          </div>
        </div>
      </div>
      
      <input type="file" class="image-slide-input" accept="image/*" hidden>`;

    // Adicionar modais ao body (fora do Shadow DOM, pois modais precisam ser globais)
    if (!document.body.querySelector("#previewModal")) {
      document.body.innerHTML += `
        <div class="modal fade" id="previewModal" tabindex="-1" aria-labelledby="previewModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="previewModalLabel">Pré-visualização</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body text-center">
                <img id="previewImage" src="" class="img-fluid rounded" alt="Imagem de pré-visualização">
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal fade" id="adjustModal" tabindex="-1" aria-labelledby="adjustModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content bg-dark text-light">
              <div class="modal-header">
                <h5 class="modal-title" id="adjustModalLabel">Ajustar Imagem</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body text-center">
                <div style="width:100%; max-height:60vh;">
                  <img id="adjustImage" style="max-width:100%; display:block; margin:auto;" alt="Imagem para ajuste" />
                </div>
              </div>
              <div class="modal-footer justify-content-between">
                <div class="d-flex gap-2">
                  <button class="btn btn-outline-light zoomInBtn"><i class="fas fa-search-plus"></i></button>
                  <button class="btn btn-outline-light zoomOutBtn"><i class="fas fa-search-minus"></i></button>
                  <button class="btn btn-outline-light resetBtn"><i class="fas fa-undo"></i></button>
                </div>
                <button type="button" class="btn btn-danger saveAdjustBtn" data-bs-dismiss="modal">Salvar Ajuste</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    this.init();
  }
  
  get slider(){
    return this.element.querySelector(".image-slide");
  }
  
  get input(){
    return this.element.querySelector(".image-slide-input");
  }
  
  get current() {
    return this.element.querySelector(".image-card.selected");
  }

  init() {
    const addCard = this.element.querySelector(".add-card");

    // Adicionar evento para o botão de adicionar imagem
    addCard.addEventListener("click", () => {
      console.log("Clicked!")
      this.input.click();
    });

    // Atualizar para suportar múltiplos arquivos
    this.input.addEventListener("change", (e) => {
      if (this.isChanging) return;

      let files = Array.from(e.target.files);
      if (files.length > 10) {
        files = files.slice(0, 10);
      }

      if (files.length > 0) {
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            this.addImage(reader.result, file.name);
          };
          reader.readAsDataURL(file);
        });
        this.input.value = "";
      }
    });

    // Inicializar eventos para cards existentes
    const cards = this.slider.querySelectorAll(".image-card:not(.add-card)");
    cards.forEach((card) => this.actions(card));

    // Focar o primeiro card, se existir
    const firstCard = this.slider.querySelector(".image-card:not(.add-card)");
    if (firstCard) this.focus(firstCard);

    // Controles do modal de ajuste
    document.body.querySelector(".zoomInBtn")?.addEventListener("click", () => {
      if (this.cropper) this.cropper.zoom(0.1);
    });
    document.body.querySelector(".zoomOutBtn")?.addEventListener("click", () => {
      if (this.cropper) this.cropper.zoom(-0.1);
    });
    document.body.querySelector(".resetBtn")?.addEventListener("click", () => {
      if (this.cropper) this.cropper.reset();
    });
    document.body.querySelector(".saveAdjustBtn")?.addEventListener("click", () => {
      if (this.cropper && this.current) {
        const canvas = this.cropper.getCroppedCanvas({ width: 1280, height: 720 });
        this.current.querySelector("img").src = canvas.toDataURL("image/jpeg");
      }
    });
  }

  actions(card) {
    card.addEventListener("click", () => this.focus(card));

    const actions = card.querySelectorAll(".card-actions button");
    if (actions.length) {
      actions[0].addEventListener("click", (e) => {
        e.stopPropagation();
        this.previewImage(card);
      });
      actions[1].addEventListener("click", (e) => {
        e.stopPropagation();
        this.adjustImage(card);
      });
      actions[2].addEventListener("click", (e) => {
        e.stopPropagation();
        this.changeImage(card);
      });
      actions[3].addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeImage(card);
      });
    }
  }

  focus(card) {
    this.slider.querySelectorAll(".image-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  previewImage(card) {
    let modal = document.body.querySelector("#previewModal");
    if (modal) {
      modal.querySelector("#previewImage").src = card.querySelector("img").src;
      new bootstrap.Modal(modal).show();
    }
  }

  removeImage(card) {
    card.remove();
    const remainingCards = this.slider.querySelectorAll(".image-card:not(.add-card)");
    if (remainingCards.length) this.focus(remainingCards[remainingCards.length - 1]);
  }

  changeImage(card) {
    this.isChanging = true;
    this.input.click();
    this.input.onchange = (ev) => {
      const file = ev.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          card.querySelector("img").src = reader.result;
        };
        reader.readAsDataURL(file);
      }
      this.isChanging = false;
    };
  }

  adjustImage(card) {
    const img = card.querySelector("img");
    const adjustImg = document.body.querySelector("#adjustImage");
    adjustImg.src = img.src;

    const modal = new bootstrap.Modal(document.body.querySelector("#adjustModal"));
    modal.show();

    adjustImg.onload = () => {
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }
      this.cropper = new Cropper(adjustImg, {
        aspectRatio: 16 / 9,
        viewMode: 1,
        dragMode: "move",
        background: false,
        autoCropArea: 1,
      });
    };

    document.body.querySelector("#adjustModal").addEventListener("hidden.bs.modal", () => {
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }
    });
  }

  addImage(src, name = "Unknown") {
    if (!src) return;
    const slide = this.element.querySelector(".image-slide");
    const addCard = slide.querySelector(".add-card");

    const card = document.createElement("div");
    card.className = "image-card";
    card.innerHTML = `
      <img src="${src}" name="${name}" alt="Preview">
      <div class="card-actions">
        <button title="Pré-visualizar"><i class="fas fa-eye"></i></button>
        <button title="Ajustar"><i class="fas fa-expand-arrows-alt"></i></button>
        <button title="Trocar"><i class="fas fa-sync-alt"></i></button>
        <button title="Remover"><i class="fas fa-trash"></i></button>
      </div>
      <span class="image-name">${name}</span>
    `;
    slide.insertBefore(card, addCard);

    this.actions(card);
    this.focus(card);

    this.element.dispatchEvent(
      new CustomEvent("input", {
        detail: { card, src, fileName: name },
        bubbles: true,
        composed: true,
      })
    );
  }

  getImages() {
    return this.slider.querySelectorAll(".image-card:not(.add-card) img");
  }
}

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      // verifica se o nó é um elemento e tem a classe desejada
      if (node.nodeType === 1 && node.classList.contains("js-img-slide")) {
        console.log("Loaded!")
        new ImageSlide(node);
      }

      // também verifica filhos adicionados dentro de algo maior
      if (node.querySelectorAll) {
        node
        .querySelectorAll(".js-img-slide")
        .forEach(e=>new ImageSlide(e));
      }
    });
  });
});

// Começa a observar mudanças no documento inteiro
observer.observe(document.body, { childList: true, subtree: true });

/*
document.addEventListener("DOMContentLoaded",()=>{
  
  let deadLine = 10;
  let requestTimes = 0;
  let id = setInterval(()=>{
    let slide = document
    .querySelectorAll("div.js-img-slide");
    
    //console.log(slide)
    
    slide.forEach((element) => {
      //console.log("Slider init");
      new ImageSlide(element);
    })
    
    if(requestTimes == deadLine||slide.length>0){
      clearInterval(id)
    }else{
      requestTimes++;
    }
  },1000)
})*/