import { Component, Inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import JsBarcode from 'jsbarcode';

@Component({
  standalone: false,
  selector: 'app-qr-code',
  template: `
    <div class="modal-container" [class.wide-content]="isWideBarcode">
      <div class="modal-header">
        <h2>{{ data.title || 'Barcode' }}</h2>
        <button mat-icon-button (click)="close()" class="close-button">
          &times;
        </button>
      </div>

      <div class="modal-body">
        <div class="user-info" *ngIf="data.userName">
          <div class="user-name">{{data.userName}}</div>
          <div class="user-name" *ngIf="data.num">{{data.num}}</div>
          <div class="badge-id">ID: {{data.badgeId}}</div>
        </div>

        <div #barcodeContainer class="barcode-container">
          <div class="barcode"></div>
        </div>

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
      min-width: 300px;
      max-width: 90vw;
      width: auto; /* S'adapte au contenu */
      margin: 0 auto;
      font-family: 'Segoe UI', Arial, sans-serif;
      transition: width 0.3s ease;
    }

    /* Classe pour les codes-barres larges */
    .modal-container.wide-content {
      min-width: 500px;
      max-width: 95vw;
    }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-grow: 1;
      overflow: visible;
    }
    
    .barcode-container {
      width: 100%;
      min-height: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 20px 0;
      overflow: visible;
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
      font-weight: 600;
    }

    .barcode {
      background: white;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 20px;
      width: auto;
      display: inline-block;
      overflow: visible;
    }

    .barcode svg {
      display: block;
      width: auto !important;
      height: auto !important;
      max-width: none;
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
    @media (max-width: 768px) {
      .modal-container {
        width: 95vw;
        min-width: 280px;
      }
      
      .modal-body {
        padding: 15px;
      }
      
      .barcode {
        padding: 10px;
      }

      .modal-container.wide-content {
        min-width: 300px;
      }
    }

    @media (max-width: 480px) {
      .modal-container {
        width: 100vw;
        max-width: 100vw;
        min-width: 100vw;
      }
      
      .modal-container.wide-content {
        width: 100vw;
        min-width: 100vw;
      }
      
      .barcode svg {
        max-width: 100% !important;
        width: 100% !important;
      }
    }

    /* Impression */
    @media print {
      .modal-header, .modal-footer {
        display: none !important;
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
      
      .modal-body {
        padding: 0;
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
  isWideBarcode = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      badgeId: string, 
      userName?: string, 
      num?: number,
      title?: string
    },
    private dialogRef: MatDialogRef<QrCode>
  ) {
    // Détermine si c'est un code long (probablement un OR) qui nécessite plus d'espace
    this.isWideBarcode = !!(this.data.badgeId && this.data.badgeId.length > 8);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.generateBarcode();
      this.adjustModalSize();
    }, 100);
  }

  generateBarcode(): void {
    try {
      const barcodeElement = this.barcodeContainer.nativeElement.querySelector('.barcode');
      barcodeElement.innerHTML = '';
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      barcodeElement.appendChild(svg);

      // Calcul dynamique de la largeur selon la longueur du code
      let width: number;
      let height: number = 80;
      
      if (this.data.badgeId.length <= 6) {
        // Codes courts (badge utilisateur)
        width = 2.5;
        height = 80;
      } else if (this.data.badgeId.length <= 10) {
        // Codes moyens
        width = 2;
        height = 80;
      } else {
        // Codes longs (OR)
        width = 1.2;
        height = 70;
      }
      
      JsBarcode(svg, this.data.badgeId, {
        format: 'CODE128',
        lineColor: '#000',
        width: width,
        height: height,
        displayValue: true,
        fontSize: this.data.badgeId.length > 10 ? 12 : 14,
        margin: 8
      });

      // Ajuster la taille du modal après génération
      setTimeout(() => this.adjustModalSize(), 50);
      
    } catch (error) {
      this.errorMessage = 'Erreur lors de la génération du code-barres';
      console.error('Erreur barcode:', error);
    }
  }

  private adjustModalSize(): void {
    try {
      const svg = this.barcodeContainer.nativeElement.querySelector('svg');
      if (!svg) return;

      // Obtenir les dimensions réelles du SVG
      const svgRect = svg.getBoundingClientRect();
      const svgWidth = svgRect.width;

      // Calculer la largeur minimale nécessaire pour le modal
      const paddingAndMargins = 80; // padding du modal + marges
      const minModalWidth = Math.max(300, svgWidth + paddingAndMargins);
      const maxModalWidth = window.innerWidth * 0.9;
      
      const optimalWidth = Math.min(minModalWidth, maxModalWidth);

      // Appliquer la largeur au conteneur du modal
      const modalContainer = this.barcodeContainer.nativeElement.closest('.modal-container');
      if (modalContainer) {
        modalContainer.style.width = `${optimalWidth}px`;
        modalContainer.style.maxWidth = '90vw';
      }

      // Mise à jour de la classe CSS si nécessaire
      if (svgWidth > 300) {
        this.isWideBarcode = true;
      }

    } catch (error) {
      console.error('Erreur lors de l\'ajustement de la taille:', error);
    }
  }

  printBarcode(): void {
    try {
      const printContent = document.createElement('div');
      const barcodeClone = this.barcodeContainer.nativeElement.querySelector('.barcode').cloneNode(true);
      
      printContent.innerHTML = `
        <style>
          @page { 
            size: auto; 
            margin: 5mm; 
          }
          body { 
            font-family: Arial; 
            margin: 0; 
            padding: 10px; 
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          svg { 
            max-width: 100%; 
            height: auto; 
            display: block;
          }
          .print-header {
            text-align: center; 
            margin-bottom: 15px;
          }
          .print-user-name {
            font-size: 16px;
            margin-bottom: 5px;
          }
          .print-badge-id {
            font-weight: bold;
            margin-bottom: 10px;
          }
          .barcode {
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        </style>
        <div class="print-header">
          ${this.data.userName ? `<div class="print-user-name">${this.data.userName}</div>` : ''}
          <div class="print-badge-id">${this.data.title || 'ID'}: ${this.data.badgeId}</div>
        </div>
      `;
      
      printContent.appendChild(barcodeClone);

      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Les popups sont peut-être bloquées.');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Impression Barcode</title>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
            setTimeout(() => printWindow.close(), 500);
          } catch (printError) {
            console.error('Erreur lors de l\'impression:', printError);
            alert('Erreur lors de l\'impression. Veuillez réessayer.');
            printWindow.close();
          }
        }, 500);
      };

    } catch (error) {
      console.error('Erreur dans printBarcode:', error);
      this.errorMessage = 'Erreur lors de la préparation de l\'impression';
    }
  }

  downloadBarcode(): void {
    try {
      const svg = this.barcodeContainer.nativeElement.querySelector('svg');
      if (!svg) {
        throw new Error('Aucun code-barres trouvé');
      }

      const serializer = new XMLSerializer();
      const svgBlob = new Blob([serializer.serializeToString(svg)], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.data.title ? this.data.title.toLowerCase().replace(/\s+/g, '_') : 'barcode'}_${this.data.badgeId}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      this.errorMessage = 'Erreur lors du téléchargement';
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}