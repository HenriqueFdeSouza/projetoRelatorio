import { storage } from './storage';
import { ReportData } from './types';

export const configuracoesAdmin = {
  efetivo: [
    { funcao: 'Supervisor', nome: 'WAGNER COSTA', horario: '09:00-17:30', radio: '-' },
    { funcao: 'Portaria Social', nome: 'GEICIANE SILVA', horario: '07:00-19:00', radio: '-' },
    { funcao: 'Portaria Praia', nome: 'AMANDA LUIZA', horario: '07:00-19:00', radio: '-' },
    { funcao: 'Rondante', nome: 'VINÍCIOS', horario: '07:00-19:00', radio: '-' },
    { funcao: 'Bombeiro', nome: 'SAMUEL VIANA', horario: 'TREINAMENTO', radio: '-' },
    { funcao: 'Apoio', nome: '', horario: '', radio: '-' },
  ],

  elevadores: [
    { elevador: 'BLOCO 01', horario: '10:00', interfone: 'OFF/ON', alarme: 'OFF/ON', agente: 'HENRIQUE' },
    { elevador: 'BLOCO 02', horario: '10:10', interfone: 'ON/ON', alarme: 'ON/ON', agente: 'HENRIQUE' },
    { elevador: 'BLOCO 03 PAR', horario: '10:30', interfone: 'ON/ON', alarme: 'ON/ON', agente: 'HENRIQUE' },
    { elevador: 'BLOCO 03 ÍMPAR', horario: '10:35', interfone: 'ON/ON', alarme: 'OFF/OFF', agente: 'HENRIQUE' },
    { elevador: 'BLOCO 04', horario: '16:30', interfone: 'ON/ON', alarme: 'ON/ON', agente: 'HENRIQUE' },
    { elevador: 'BLOCO 05', horario: '16:35', interfone: 'ON/ON', alarme: 'ON/ON', agente: 'HENRIQUE' },
    { elevador: 'BLOCO 06', horario: '16:42', interfone: 'ON/ON', alarme: 'ON/ON', agente: 'HENRIQUE' },
    { elevador: 'BLOCO 07', horario: '16:55', interfone: 'ON/OFF', alarme: 'ON/OFF', agente: 'HENRIQUE' },
  ],

  radios: {
    recebimento: '21',
    passagem: '54',
  },

  crachas: {
    mes: 'FEVEREIRO',
    visitantes: '11',
    provisórios: '09',
    cor: 'VERDE',
  }
};

export function aplicarPreenchimentoPadrao(report: ReportData): Partial<ReportData> {


  return {
    efetivo: configuracoesAdmin.efetivo.map(item => ({ ...item })),
    elevadorTeste: configuracoesAdmin.elevadores.map(item => ({ ...item })),
    radiosRecebimento: configuracoesAdmin.radios.recebimento,
    radiosPassagem: configuracoesAdmin.radios.passagem,
    mesCrachas: configuracoesAdmin.crachas.mes,
    crachas: [
      {
        descricao: 'VISITANTES',
        quantidade: configuracoesAdmin.crachas.visitantes,
        cor: configuracoesAdmin.crachas.cor,
      },
      {
        descricao: 'PROVISÓRIOS',
        quantidade: configuracoesAdmin.crachas.provisórios,
        cor: configuracoesAdmin.crachas.cor,
      },
    ],
  };
}