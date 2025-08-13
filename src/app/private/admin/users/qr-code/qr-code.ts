import { Component, Inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import JsBarcode from 'jsbarcode';

@Component({
  standalone:false,
  selector: 'app-qr-code',
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2>Barcode</h2>
        <button mat-icon-button (click)="close()" class="close-button">
          &times;
        </button>
      </div>

      <div class="modal-body">
        <div class="user-info">
          <div class="user-name">{{data.userName}}</div>
          <div class="user-name">{{data.num}}</div>
          <div class="badge-id">ID: {{data.badgeId}}</div>
        </div>

        <div #barcodeContainer class="barcode"></div>

        <div *ngIf="errorMessage" class="error">
          {{errorMessage}}
        </div>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="printBarcode()" class="action-button print">
          Imprimer
        </button>
        <button mat-button (click)="downloadBarcode()" class="action-button download">
          Télécharger
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* Structure de base */
    .modal-container {
      display: flex;
      flex-direction: column;
      max-width: 90vw; /* Utilise une largeur relative à la fenêtre */
      margin: 0 auto;
      font-family: 'Segoe UI', Arial, sans-serif;
      min-width: 200px;
      width: auto; /* S'adapte au contenu */
    }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-grow: 1;
      overflow: hidden; /* Contrôle le débordement */
    }
    
    .barcode-container {
      width: 100%;
      min-height: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 20px 0;
    }
    /* En-tête */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eaeaea;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
    }

    .close-button {
      color: #888;
      font-size: 1.5rem;
      line-height: 1;
      padding: 0;
      min-width: auto;
      border: none;
      background: none;
      cursor: pointer;
    }

    .close-button:hover {
      color: #333;
    }

    .user-info {
      text-align: center;
      margin-bottom: 25px;
    }

    .user-name {
      font-size: 1.1rem;
      font-weight: 500;
      color: #444;
      margin-bottom: 5px;
    }

    .badge-id {
      font-size: 0.9rem;
      color: #666;
    }

    .barcode {
      background: white;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 20px;
      width: auto;
      display: inline-block;
      max-width: 100%;
      overflow: visible; /* Changé de auto à visible */
    }

    .barcode svg {
      max-width: 100%;
      height: auto;
    }

    .error {
      color: #d32f2f;
      font-size: 0.9rem;
      margin-top: 10px;
      text-align: center;
    }

    /* Pied de page */
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 15px 20px;
      border-top: 1px solid #eaeaea;
      gap: 10px;
    }

    .action-button {
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .action-button.print {
      border: 1px solid #ddd;
      color: #333;
    }

    .action-button.print:hover {
      background: #f5f5f5;
    }

    .action-button.download {
      background: #3f51b5;
      color: white;
    }

    .action-button.download:hover {
      background: #303f9f;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .modal-container {
        width: 100%;
      }
      
      .modal-body {
        padding: 20px 15px;
      }
      
      .barcode {
        padding: 10px;
      }
    }

    /* Impression */
    @media print {
      .modal-header, .modal-footer {
        display: none;
      }
      
      .modal-body {
        padding: 0;
      }
    }

    @media print {
      body * {
      visibility: hidden;
      }
  
     .modal-container, .modal-container * {
       visibility: visible;
      }
  
  .modal-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }
  
  .modal-header, .modal-footer {
    display: none !important;
  }
  
  .barcode {
    border: none;
    padding: 0;
    margin: 0;
    width: 100%;
    max-width: 100%;
    overflow: visible;
  }
  
  .barcode svg {
    width: 100% !important;
    height: auto !important;
  }
  
  .user-info {
    text-align: center;
    margin-bottom: 10px;
  }
}
  `]
})
export class QrCode implements AfterViewInit {
  @ViewChild('barcodeContainer') barcodeContainer!: ElementRef;
  errorMessage = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {badgeId: string, userName: string, num: number},
    private dialogRef: MatDialogRef<QrCode>
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.generateBarcode();
    }, 100);
  }

  generateBarcode(): void {
  try {
    this.barcodeContainer.nativeElement.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.barcodeContainer.nativeElement.appendChild(svg);

    // Ajuster la largeur en fonction de la longueur du code
    const width = this.data.badgeId.length > 10 ? 1.5 : 2;
    
    JsBarcode(svg, this.data.badgeId, {
      format: 'CODE128',
      lineColor: '#000',
      width: width, // Largeur dynamique
      height: 80,
      displayValue: true,
      fontSize: 14,
      margin: 5
    });
  } catch (error) {
    this.errorMessage = 'Erreur lors de la génération du code-barres';
  }
}

  printBarcode(): void {
  try {
    // Crée un clone du contenu pour l'impression
    const printContent = document.createElement('div');
    const modalContent = this.barcodeContainer.nativeElement.cloneNode(true);
    
    // Structure HTML pour l'impression
    printContent.innerHTML = `
      <style>
        @page { size: auto; margin: 5mm; }
        body { font-family: Arial; margin: 0; padding: 10px; }
        svg { max-width: 100%; height: auto; }
        .print-header {
          text-align: center; 
          margin-bottom: 15px;
        }
        .print-user-name {
          font-size: 16px;
        }
        .print-badge-id {
          font-weight: bold;
        }
      </style>
      <div class="print-header">
        <div class="print-user-name">${this.data.userName}</div>
        <div class="print-badge-id">ID: ${this.data.badgeId}</div>
      </div>
    `;
    
    printContent.appendChild(modalContent);

    // Ouvre la fenêtre d'impression avec vérification de nullité
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Les popups sont peut-être bloquées.');
    }

    // Écrit le contenu et gère l'impression
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();

    // Attache les gestionnaires d'événements avant impression
    printWindow.onload = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
          
          // Ferme la fenêtre après un délai (optionnel)
          setTimeout(() => {
            printWindow.close();
          }, 500);
        } catch (printError) {
          console.error('Erreur lors de l\'impression:', printError);
          alert('Erreur lors de l\'impression. Veuillez réessayer.');
          printWindow.close();
        }
      }, 500);
    };

  } catch (error) {
    console.error('Erreur dans printBarcode:', error);
    this.errorMessage = typeof error === 'string' ? error : 'Erreur lors de la préparation de l\'impression';
  }
}

  downloadBarcode(): void {
    try {
      const svg = this.barcodeContainer.nativeElement.querySelector('svg');
      const serializer = new XMLSerializer();
      const svgBlob = new Blob([serializer.serializeToString(svg)], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `badge_${this.data.badgeId}.svg`;
      link.click();
    } catch (error) {
      this.errorMessage = 'Erreur lors du téléchargement';
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}