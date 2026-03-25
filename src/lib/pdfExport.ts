import jsPDF from 'jspdf';
import { ReportData } from './types';

const DARK_PURPLE = '#5C1F6B';
const MEDIUM_PURPLE = '#7B2D8B';
const LIGHT_LILAC = '#F5EEF8';
const OCCURRENCES_BG = '#EDE0F0';
const WHITE = '#FFFFFF';
const BLACK = '#1A1A1A';
const BORDER = '#D8BFD8';
const LIGHT_BAR_BG = '#EEE6F2';

function fontFamily(doc: jsPDF, weight: 'regular' | 'semibold' | 'bold' = 'regular') {
  const families = typeof doc.getFontList === 'function' ? doc.getFontList() : {};
  const montserratKey = Object.keys(families).find((k) => k.toLowerCase() === 'montserrat');

  if (montserratKey) {
    const styles = families[montserratKey] || [];
    const wanted = weight === 'bold' ? 'bold' : weight === 'semibold' ? 'semibold' : 'normal';
    const fallback = weight === 'regular' ? 'normal' : 'bold';
    const chosen = styles.includes(wanted) ? wanted : fallback;
    doc.setFont(montserratKey, chosen);
    return;
  }

  doc.setFont('helvetica', weight === 'regular' ? 'normal' : 'bold');
}

function setTextStyle(doc: jsPDF, size: number, weight: 'regular' | 'semibold' | 'bold' = 'regular', color = BLACK) {
  fontFamily(doc, weight);
  doc.setFontSize(size);
  doc.setTextColor(color);
}

function mmLineHeight(fontSize: number, multiplier = 1.2) {
  return fontSize * 0.3528 * multiplier;
}

function centerTextBlock(doc: jsPDF, lines: string[], x: number, y: number, w: number, h: number, fontSize: number, weight: 'regular' | 'semibold' | 'bold', color = BLACK) {
  setTextStyle(doc, fontSize, weight, color);
  const lineHeight = mmLineHeight(fontSize, 1.15);
  const totalHeight = lines.length * lineHeight;
  let currentY = y + (h - totalHeight) / 2 + lineHeight * 0.78;
  lines.forEach((line) => {
    doc.text(line, x + w / 2, currentY, { align: 'center', baseline: 'alphabetic' });
    currentY += lineHeight;
  });
}

function leftTextBlock(doc: jsPDF, lines: string[], x: number, y: number, h: number, fontSize: number, weight: 'regular' | 'semibold' | 'bold', color = BLACK) {
  setTextStyle(doc, fontSize, weight, color);
  const lineHeight = mmLineHeight(fontSize, 1.12);
  const totalHeight = lines.length * lineHeight;
  let currentY = y + (h - totalHeight) / 2 + lineHeight * 0.78;
  lines.forEach((line) => {
    doc.text(line, x, currentY, { align: 'left', baseline: 'alphabetic' });
    currentY += lineHeight;
  });
}

function getShiftLabel(report: ReportData) {
  return report.tipoRelatorio === 'NOTURNO' ? 'NOTURNO' : 'DIURNO';
}



function slugifyFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'ocorrencia';
}

function buildOccurrenceDownloadPageUrl(report: ReportData, occurrenceIndex: number, occurrenceTitle: string) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    reportDate: report.data || '',
    title: occurrenceTitle || `ocorrencia_${occurrenceIndex + 1}`,
    index: String(occurrenceIndex),
  });
  return `${baseUrl}/download-ocorrencia.html?${params.toString()}`;
}

export async function generatePDF(report: ReportData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const pageH = 297;
  const marginL = 12;
  const marginR = 12;
  const contentW = pageW - marginL - marginR;
  let y = 10;
  const sectionGap = 2.2;

  const rowBaseH = 7;
  const cellPaddingX = 2.5;
  const cellPaddingY = 1.6;
  const bodyLineH = 3.7;

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 15) {
      doc.addPage();
      y = 12;
    }
  };

  const drawMainHeader = () => {
    const headerTop = 0;
    const headerH = 35;

    doc.setFillColor(DARK_PURPLE);
    doc.rect(0, headerTop, pageW, headerH, 'F');

    const logoY = 6;
    const logoH = 14;
    const logoW = 62;
    const leftX = 10;
    const rightX = pageW - 10 - logoW;

    doc.setDrawColor(WHITE);
    doc.setLineWidth(0.55);
    doc.roundedRect(leftX, logoY, logoW, logoH, 2.4, 2.4, 'S');
    doc.roundedRect(rightX, logoY, logoW, logoH, 2.4, 2.4, 'S');

    doc.setLineWidth(0.45);
    doc.line(pageW / 2, logoY + 1.4, pageW / 2, logoY + logoH - 1.4);

    centerTextBlock(doc, ['WELLNESS BEACH', 'PARK RESORT'], leftX + 3, logoY + 1.7, logoW - 6, 7.3, 10.5, 'bold', WHITE);
    setTextStyle(doc, 7.2, 'regular', WHITE);
    doc.text('Beach Park Resort', leftX + logoW / 2, logoY + 11.5, { align: 'center' });

    centerTextBlock(doc, ['GRUPO CASTELO BORGES'], rightX + 3, logoY + 2.1, logoW - 6, 5.6, 8.8, 'bold', WHITE);
    setTextStyle(doc, 6.8, 'regular', WHITE);
    doc.text('DESDE 1906', rightX + logoW / 2, logoY + 10.9, { align: 'center' });

    setTextStyle(doc, 9, 'semibold', WHITE);
    doc.text('DEPARTAMENTO DE SEGURANÇA PATRIMONIAL', pageW / 2, 26.2, { align: 'center' });
    setTextStyle(doc, 12, 'bold', WHITE);
    doc.text(`RELATÓRIO ${getShiftLabel(report)}`, pageW / 2, 31.6, { align: 'center' });

    const infoY = headerH + 2;
    const infoH = 9;
    const third = contentW / 3;

    doc.setFillColor(WHITE);
    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.3);
    doc.rect(marginL, infoY, contentW, infoH, 'FD');
    doc.line(marginL + third, infoY, marginL + third, infoY + infoH);
    doc.line(marginL + third * 2, infoY, marginL + third * 2, infoY + infoH);

    setTextStyle(doc, 8, 'bold', DARK_PURPLE);
    doc.text(`DATA: ${formatDate(report.data)}`, marginL + third / 2, infoY + 5.8, { align: 'center' });
    doc.text(`DIA: ${report.diaSemana || '-'}`, marginL + third + third / 2, infoY + 5.8, { align: 'center' });
    doc.text(`PLANTONISTA: ${report.plantonista || '-'}`, marginL + third * 2 + third / 2, infoY + 5.8, { align: 'center' });

    y = infoY + infoH + 4;
  };

  const sectionTitle = (text: string) => {
    checkPage(12);
    setTextStyle(doc, 10, 'bold', DARK_PURPLE);
    doc.text(text.toUpperCase(), marginL, y + 4.2, { align: 'left' });
    doc.setDrawColor(MEDIUM_PURPLE);
    doc.setLineWidth(0.4);
    doc.line(marginL, y + 6.1, marginL + contentW, y + 6.1);
    y += 8.5;
  };

  const drawTable = (
    headers: string[],
    rows: string[][],
    colWidths?: number[],
    options?: { leftAlignCols?: number[] }
  ) => {
    const cols = headers.length;
    const widths = colWidths || headers.map(() => contentW / cols);
    const leftAlignCols = options?.leftAlignCols || [];
    const dataRows = rows.length > 0 ? rows : [headers.map(() => '-')];

    checkPage(rowBaseH * 2);

    let x = marginL;
    headers.forEach((header, i) => {
      doc.setFillColor(MEDIUM_PURPLE);
      doc.setDrawColor(BORDER);
      doc.setLineWidth(0.25);
      doc.rect(x, y, widths[i], rowBaseH, 'FD');
      const headerLines = doc.splitTextToSize(header.toUpperCase(), Math.max(widths[i] - 2, 8)) as string[];
      centerTextBlock(doc, headerLines, x + 1, y + 0.2, widths[i] - 2, rowBaseH - 0.4, 8, 'semibold', WHITE);
      x += widths[i];
    });
    y += rowBaseH;

    dataRows.forEach((row, rowIndex) => {
      const wrappedCells = row.map((cell, ci) => {
        const value = (cell || '-').toString();
        const innerW = Math.max(widths[ci] - cellPaddingX * 2, 8);
        return doc.splitTextToSize(value, innerW) as string[];
      });

      const maxLines = Math.max(1, ...wrappedCells.map((lines) => lines.length));
      const dynamicRowH = Math.max(rowBaseH, cellPaddingY * 2 + maxLines * bodyLineH);
      checkPage(dynamicRowH + 1);

      x = marginL;
      const fillColor = rowIndex % 2 === 0 ? WHITE : LIGHT_LILAC;

      wrappedCells.forEach((lines, ci) => {
        doc.setFillColor(fillColor);
        doc.setDrawColor(BORDER);
        doc.setLineWidth(0.25);
        doc.rect(x, y, widths[ci], dynamicRowH, 'FD');

        if (leftAlignCols.includes(ci)) {
          leftTextBlock(doc, lines, x + cellPaddingX, y, dynamicRowH, 8, 'regular', BLACK);
        } else {
          centerTextBlock(doc, lines, x + 1, y, widths[ci] - 2, dynamicRowH, 8, 'regular', BLACK);
        }

        x += widths[ci];
      });

      y += dynamicRowH;
    });

    y += sectionGap;
  };

  const renderSection = (
    title: string,
    headers: string[],
    rows: string[][],
    colWidths?: number[],
    options?: { leftAlignCols?: number[] }
  ) => {
    sectionTitle(title);
    drawTable(headers, rows, colWidths, options);
  };

  const drawOccupancyStats = () => {
    const values = [
      { label: 'ATUAL', value: Number(report.ocupacao.atual) || 0, color: '#7B2D8B' },
      { label: 'PREVISTA', value: Number(report.ocupacao.prevista) || 0, color: '#4CAF50' },
      { label: 'CHECK-IN', value: Number(report.ocupacao.checkin) || 0, color: '#2196F3' },
      { label: 'CHECK-OUT', value: Number(report.ocupacao.checkout) || 0, color: '#FF9800' },
    ];

    const boxH = 29;
    checkPage(boxH + 2);
    doc.setFillColor(WHITE);
    doc.setDrawColor(BORDER);
    doc.roundedRect(marginL, y, contentW, boxH, 2, 2, 'FD');

    setTextStyle(doc, 8, 'bold', DARK_PURPLE);
    doc.text('RESUMO VISUAL DA OCUPAÇÃO', marginL + contentW / 2, y + 5.5, { align: 'center' });

    const leftLabelW = 34;
    const barMaxW = contentW - leftLabelW - 22;
    let localY = y + 9;
    values.forEach((item) => {
      setTextStyle(doc, 7.5, 'semibold', DARK_PURPLE);
      doc.text(item.label, marginL + 4, localY + 2.8);
      doc.setFillColor(LIGHT_BAR_BG);
      doc.roundedRect(marginL + leftLabelW, localY, barMaxW, 4.8, 1.2, 1.2, 'F');
      const width = Math.max(0, Math.min(barMaxW, (item.value / 100) * barMaxW));
      doc.setFillColor(item.color);
      doc.roundedRect(marginL + leftLabelW, localY, width, 4.8, 1.2, 1.2, 'F');
      setTextStyle(doc, 7.5, 'bold', item.color);
      doc.text(`${item.value}`, marginL + leftLabelW + barMaxW + 6, localY + 2.9, { align: 'right' });
      localY += 5.4;
    });

    y += boxH + sectionGap;
  };

  const drawOccurrencesSection = () => {
    if (report.ocorrencias.length === 0) return;

    checkPage(20);
    doc.setFillColor(DARK_PURPLE);
    doc.setDrawColor(BORDER);
    doc.rect(marginL, y, contentW, 8, 'FD');
    centerTextBlock(doc, [`OCORRÊNCIAS/INTERVENÇÕES DURANTE O PLANTÃO ${getShiftLabel(report)}`], marginL, y, contentW, 8, 8, 'bold', WHITE);
    y += 11;

    report.ocorrencias.forEach((oc, i) => {
      const title = `${i + 1} - ${oc.titulo || 'SEM TÍTULO'}`;
      const titleLines = doc.splitTextToSize(title, contentW) as string[];
      const descriptionLines = doc.splitTextToSize(oc.descricao || '-', contentW - 4) as string[];
      const hasImage = Boolean(oc.imagemBase64);
      const titleH = Math.max(5, titleLines.length * 4);
      const descH = Math.max(4, descriptionLines.length * 3.8);
      const attachmentH = hasImage ? 7 : 0;
      checkPage(titleH + descH + attachmentH + 9);

      setTextStyle(doc, 8.5, 'bold', DARK_PURPLE);
      let titleY = y;
      titleLines.forEach((line) => {
        doc.text(line, marginL, titleY);
        titleY += 4;
      });

      doc.setDrawColor(MEDIUM_PURPLE);
      doc.setLineWidth(0.25);
      doc.line(marginL, titleY - 1, marginL + contentW, titleY - 1);

      setTextStyle(doc, 8, 'regular', BLACK);
      let descY = titleY + 3;
      descriptionLines.forEach((line) => {
        doc.text(line, marginL + 1.5, descY);
        descY += 3.8;
      });

      if (hasImage && oc.imagemBase64) {
        const downloadUrl = buildOccurrenceDownloadPageUrl(report, i, oc.titulo || `ocorrencia_${i + 1}`);
        setTextStyle(doc, 8, 'semibold', '#1D4ED8');
        doc.textWithLink('Baixar imagem anexada', marginL + 1.5, descY + 1.5, { url: downloadUrl });
        descY += 4.8;
      }

      y = descY + 2.2;
    });

    checkPage(10);
    doc.setFillColor(DARK_PURPLE);
    doc.setDrawColor(BORDER);
    doc.rect(marginL, y + 1, contentW, 8, 'FD');
    centerTextBlock(doc, ['REPASSO O PLANTÃO SEM MAIS'], marginL, y + 1, contentW, 8, 10, 'bold', WHITE);
    y += 11;
  };

  drawMainHeader();

  renderSection(
    '1.1 EFETIVO SEGURANÇA DO PLANTÃO',
    ['FUNÇÃO', 'NOME', 'HORÁRIO', 'RÁDIO'],
    report.efetivo.map((r) => [r.funcao, r.nome, r.horario, r.radio]),
    [40, 60, 45, 41]
  );

  renderSection(
    '1.2 VISITA CASTELO BORGES',
    ['NOME', 'FUNÇÃO', 'ENTRADA', 'SAÍDA'],
    report.visitas.map((r) => [r.nome, r.funcao, r.entrada, r.saida])
  );

  renderSection(
    '1.3 OCUPAÇÃO WELLNESS RESORT',
    ['OCUPAÇÃO', 'VALOR'],
    [
      ['ATUAL', `${report.ocupacao.atual || '-'}%`],
      ['PREVISTA', `${report.ocupacao.prevista || '-'}%`],
      ['CHECK-IN', report.ocupacao.checkin || '-'],
      ['CHECK-OUT', report.ocupacao.checkout || '-'],
    ],
    [93, 93]
  );
  drawOccupancyStats();

  const estacionamentoRows = report.estacionamento.map((r) => [r.local, String(r.capacidade), r.quantidade || '-', r.agente || '-']);
  const totalCapacidade = report.estacionamento.reduce((sum, r) => sum + r.capacidade, 0);
  const totalQuantidade = report.estacionamento.reduce((sum, r) => sum + (parseInt(r.quantidade, 10) || 0), 0);
  estacionamentoRows.push(['TOTAL', String(totalCapacidade), String(totalQuantidade), '-']);
  renderSection(
    '1.4 CONTROLE DE ESTACIONAMENTO',
    ['LOCAL', 'CAPACIDADE', 'QUANTIDADE', 'AGENTE'],
    estacionamentoRows,
    [50, 40, 46, 50]
  );

  renderSection(
    '1.5 VIATURA/APOIO',
    ['NOME', 'HORÁRIO 1', 'HORÁRIO 2', 'HORÁRIO 3'],
    report.viaturas.map((r) => [r.nome, r.horario1 || '-', r.horario2 || '-', r.horario3 || '-'])
  );

  renderSection(
    '1.6 TESTE – INTERFONE/ALARME – ELEVADORES',
    ['ELEVADORES', 'HORÁRIO', 'INTERFONE', 'ALARME', 'NOME'],
    report.elevadorTeste.map((r) => [r.elevador, r.horario, r.interfone, r.alarme, r.agente]),
    [40, 30, 36, 36, 44]
  );

  renderSection(
    '1.7 CONTROLE DE RÁDIOS',
    ['RECEBIMENTO DO PLANTÃO', 'PASSAGEM DE PLANTÃO'],
    [[report.radiosRecebimento || '-', report.radiosPassagem || '-']],
    [93, 93]
  );

  const crachaRows = report.crachas.map((r) => [r.descricao, r.quantidade || '-', r.cor || '-']);
  const totalCrachas = report.crachas.reduce((sum, r) => sum + (parseInt(r.quantidade, 10) || 0), 0);
  crachaRows.push(['TOTAL', String(totalCrachas), '-']);
  renderSection(
    '1.8/1.9 CRACHÁS NA PORTARIA',
    ['DESCRIÇÃO', 'QUANTIDADE', 'COR'],
    crachaRows,
    [62, 62, 62]
  );

  renderSection(
    '1.10 LIBERAÇÃO SISTEMA GEC',
    ['EMPRESA', 'QTD', 'SETOR', 'STATUS', 'ATIVIDADE'],
    report.gec.map((r) => [r.empresa, r.quantidade, r.setor, r.status, r.atividade]),
    [38, 24, 38, 38, 48]
  );

  renderSection(
    '1.11 ACHADOS E PERDIDOS',
    ['LOCAL', 'SEGURANÇA', 'OBJETO ENCONTRADO', 'ENTREGUE'],
    report.achados.map((r) => [r.local, r.seguranca, r.objeto, r.entregue])
  );

  renderSection(
    '1.12 AUTORIZAÇÃO SAÍDA DE MENOR',
    ['NOME DA CRIANÇA', 'AUTORIZADOR', 'UH', 'VALIDADE', 'STATUS'],
    report.autorizacaoMenor.map((r) => [r.nomeCrianca, r.autorizador, r.uh, r.validade, r.status]),
    [40, 38, 28, 38, 42]
  );

  renderSection(
    '1.13 TENTATIVA SAÍDA MENOR DESACOMPANHADO',
    ['NOME DA CRIANÇA', 'UH', 'PORTARIA', 'AUTORIZAÇÃO?'],
    report.tentativaMenor.map((r) => [r.nomeCrianca, r.uh, r.portaria, r.possuiAutorizacao])
  );

  renderSection(
    '1.14 SAÍDA DE MATERIAL',
    ['RESPONSÁVEL', 'SETOR', 'AUTORIZADOR', 'DESCRIÇÃO', 'RETORNO'],
    report.saidaMaterial.map((r) => [r.responsavel, r.setor, r.autorizador, r.descricao, r.retorno]),
    [34, 30, 38, 48, 36]
  );

  renderSection(
    '1.15 PROCEDIMENTO TESOURARIA',
    ['NOME', 'ENTRADA', 'SAÍDA', 'NÍVEL', 'SENHA', 'DESTINO'],
    report.tesouraria.map((r) => [r.nome, r.entrada, r.saida, r.nivel, r.senha, r.destino]),
    [32, 28, 28, 30, 30, 38]
  );

  renderSection(
    '1.16 ENTRADAS GESTORES/LÍDERES NA PORTARIA',
    ['ENTRADA', 'NOME', 'SETOR/CARGO', 'SAÍDA'],
    report.entradaGestores.map((r) => [r.entrada, r.nome, r.setorCargo, r.saida]),
    [30, 56, 60, 40]
  );

  renderSection(
    '1.17 ENTREGAS HÓSPEDES E PROPRIETÁRIOS',
    ['Nº', 'TIPO DE ENTREGA', 'UH'],
    report.entregaHospedes.map((r, i) => [String(i + 1).padStart(2, '0'), r.tipo, r.uh]),
    [20, 83, 83]
  );

  renderSection(
    '1.18 ENTREGAS FORNECEDORES/PRESTADORES',
    ['Nº', 'EMPRESA', 'SETOR'],
    report.entregaFornecedores.map((r, i) => [String(i + 1).padStart(2, '0'), r.empresa, r.setor]),
    [20, 83, 83]
  );

  renderSection(
    '1.19 FALTA DE ENERGIA',
    ['Nº PROTOCOLO ENEL', 'HORÁRIO DA FALTA', 'HORÁRIO DO RETORNO'],
    [[report.faltaEnergia.protocolo || '-', report.faltaEnergia.horarioFalta || '-', report.faltaEnergia.horarioRetorno || '-']],
    [62, 62, 62]
  );

  renderSection(
    '1.20 HELPDESK',
    ['NOME', 'DESCRIÇÃO', 'Nº CHAMADO', 'SETOR'],
    report.helpdesk.map((r) => [r.nome, r.descricao, r.chamado, r.setor]),
    [34, 72, 40, 40],
    { leftAlignCols: [1] }
  );

  renderSection(
    '1.21 ENCOMENDAS DE PROPRIETÁRIOS',
    ['Nº', 'UH', 'QUANTIDADE', 'PROPRIETÁRIO'],
    report.encomendas.map((r, i) => [String(i + 1).padStart(2, '0'), r.uh, r.quantidade, r.proprietario])
  );

  drawOccurrencesSection();

  const fileName = `Relatorio_${getShiftLabel(report)}_${report.data || 'sem_data'}.pdf`;
  doc.save(fileName);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
  return dateStr;
}
