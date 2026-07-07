import {
  HomeIcon,
  CalendarIcon,
  GroupIcon,
  SessionsIcon,
  DotsIcon,
} from "./icons";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/calendario", label: "Calendário", icon: CalendarIcon },
  { href: "/dashboard/alunos", label: "Alunos", icon: GroupIcon },
  { href: "/dashboard/servicos", label: "Serviços", icon: SessionsIcon },
  { href: "/dashboard/mais", label: "Mais", icon: DotsIcon },
];

export const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
export const WEEKDAYS_MON = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const WEEKDAYS_LONG = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];
