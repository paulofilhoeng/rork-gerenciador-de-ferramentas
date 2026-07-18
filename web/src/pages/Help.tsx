import { useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  Handshake,
  HelpCircle,
  Image,
  LayoutGrid,
  LogIn,
  MapPin,
  PenLine,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Sliders,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { PageContainer } from "@/components/Layout";
import { Card, SectionHeader, Separator } from "@/components/shared";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/shared";

interface HelpItem {
  id: string;
  title: string;
  icon: React.ElementType;
  content: string;
  images?: string[];
}

const HELP_ITEMS: HelpItem[] = [
  {
    id: "login",
    title: "Login e Cadastro",
    icon: LogIn,
    content:
      "Cada colaborador possui seu próprio login. Para entrar, informe e-mail e senha na aba “Entrar”. Se ainda não tem conta, toque em “Cadastrar” e preencha nome, e-mail e senha — o primeiro usuário cadastrado no sistema se torna Administrador automaticamente, com acesso total.",
  },
  {
    id: "dashboard",
    title: "Painel Inicial",
    icon: LayoutGrid,
    content:
      "Ao entrar, você vê um resumo geral: total de ferramentas, obras ativas, ferramentas por status (Próprias, Alugadas, Clientes, Em Uso, Disponíveis), alertas de auditoria pendente, custo de aluguel acumulado e as obras ativas com a contagem de ferramentas de cada uma.",
    images: [
      "https://r2-pub.rork.com/attachments/q5blxr932kunginqefanf.png",
      "https://r2-pub.rork.com/attachments/nbyyux8vdqv4gf2013a5r.png",
    ],
  },
  {
    id: "tools",
    title: "Cadastro e Consulta de Ferramentas",
    icon: Wrench,
    content:
      "Na aba “Ferramentas”, veja todas as ferramentas cadastradas com filtros rápidos: Todas, Próprias, Alugadas, Clientes, Em Uso, Disponíveis, Atrasadas, Manutenção e Desativadas. Toque em uma ferramenta para ver o detalhe completo: status atual, obra onde está localizada, responsável, dados de auditoria e histórico de fotos.",
    images: [
      "https://r2-pub.rork.com/attachments/o22fsl1c242jdy33ox67d.png",
      "https://r2-pub.rork.com/attachments/l7fbyluxi8299yi6trw2h.png",
    ],
  },
  {
    id: "edit-tool",
    title: "Editar Ferramenta",
    icon: PenLine,
    content:
      "Toque em “Editar” na tela de detalhe para alterar qualquer informação: nome, marca, modelo, código/patrimônio, propriedade (Própria, Alugada ou Cliente), status (Disponível, Em Uso, Manutenção, Atrasada ou Desativada), data de compra, obra/estoque de alocação, responsável, frequência de auditoria e observações.",
    images: [
      "https://r2-pub.rork.com/attachments/k7zw6cfcd9yg8su553blt.jpeg",
      "https://r2-pub.rork.com/attachments/8vgpvupdw6mo03khmuts1.jpeg",
      "https://r2-pub.rork.com/attachments/qosmb6tg2j701plyol83c.png",
      "https://r2-pub.rork.com/attachments/v8rlrkc1150j3phf0srwc.png",
      "https://r2-pub.rork.com/attachments/3ijkxqlypeq9mw6mib3vx.png",
      "https://r2-pub.rork.com/attachments/pqilj80y1m97ftg39mmm2.png",
    ],
  },
  {
    id: "client-property",
    title: "Propriedade “Cliente”",
    icon: Handshake,
    content:
      "Quando uma ferramenta pertence ao cliente contratante da obra (e não à construtora nem a uma locadora), selecione “Cliente” no campo Propriedade. O vínculo funciona da mesma forma que para ferramentas alugadas, identificando a quem ela pertence.",
    images: ["https://r2-pub.rork.com/attachments/qosmb6tg2j701plyol83c.png"],
  },
  {
    id: "audit",
    title: "Auditoria de Ativos",
    icon: Search,
    content:
      "Cada ferramenta tem uma frequência de auditoria (Semanal, Quinzenal ou Mensal). Quando vence, um alerta aparece para todos os usuários. Para resolver, abra a ferramenta e toque em “Realizar Auditoria”: confirme se ela está presente e em condições de uso (“Presente e OK”) ou marque “Avariada” e descreva o problema — nesse caso, o status muda automaticamente para “Avariada — Aguardando Manutenção” e a ferramenta continua na obra até ser enviada para manutenção.",
    images: [
      "https://r2-pub.rork.com/attachments/2vl3s4bcc77bvly372u0z.png",
      "https://r2-pub.rork.com/attachments/mbhz8c82fsxlaenz1ip4h.png",
      "https://r2-pub.rork.com/attachments/m7lxdf70na55ze5u00ypv.png",
    ],
  },
  {
    id: "maintenance",
    title: "Envio e Retorno de Manutenção",
    icon: RotateCcw,
    content:
      "Uma ferramenta avariada pode ser enviada para manutenção pelo botão correspondente na tela de detalhe. Ao retornar, é obrigatório anexar uma foto da nota fiscal ou orçamento, informar o valor do reparo e o número da nota fiscal — essas informações ficam permanentemente no histórico da ferramenta junto com a data do retorno e o responsável.",
    images: [
      "https://r2-pub.rork.com/attachments/zub2m2ihxrli13dklfft8.jpeg",
      "https://r2-pub.rork.com/attachments/03r7b7ggtjp82ewdfqcnz.jpeg",
      "https://r2-pub.rork.com/attachments/vy2900ziotzml8akpf075.png",
      "https://r2-pub.rork.com/attachments/b178ysas3k8yst1vrhg4r.png",
      "https://r2-pub.rork.com/attachments/o96dj52wyapqwoj4xdhm2.jpeg",
    ],
  },
  {
    id: "photos",
    title: "Registro Fotográfico (Recebimento e Entrega)",
    icon: Image,
    content:
      "Ao receber ou entregar uma ferramenta, é possível (e em alguns casos obrigatório) anexar fotos: mínimo de 3 fotos, incluindo 1 foto do número de registro da ferramenta. Toque em “Registrar Recebimento” ou “Registrar Entrega” na tela de detalhe.",
    images: [
      "https://r2-pub.rork.com/attachments/nejs3btr7xr3hfpasgz64.png",
      "https://r2-pub.rork.com/attachments/py0f0cbmcnvg5j9tjovgv.png",
      "https://r2-pub.rork.com/attachments/9q1dbhz1r9w2tur6d2qhs.png",
    ],
  },
  {
    id: "sites",
    title: "Obras",
    icon: MapPin,
    content:
      "Na aba “Obras”, veja todas as obras cadastradas com status (Ativa, Pausada, Concluída) e quantidade de ferramentas alocadas. Toque em uma obra para ver detalhes, endereço, responsável e todas as ferramentas atualmente alocadas nela.",
    images: [
      "https://r2-pub.rork.com/attachments/r0quxwtns091j82dp31km.png",
      "https://r2-pub.rork.com/attachments/qair1nbvvtmwrb5hv33pk.png",
    ],
  },
  {
    id: "permissions",
    title: "Permissões de Movimentação por Obra e Usuário",
    icon: Sliders,
    content:
      "Dentro do detalhe de uma obra, administradores podem definir, para cada usuário padrão individualmente, quais tipos de movimentação ele pode executar naquela obra específica: Transferência entre obras, Envio para manutenção, Retorno de manutenção e Auditoria/conferência. Isso permite que o mesmo colaborador tenha permissões diferentes em obras diferentes.",
    images: ["https://r2-pub.rork.com/attachments/o8tkhdjkyigeck57555eh.png"],
  },
  {
    id: "users",
    title: "Usuários e Níveis de Acesso",
    icon: Users,
    content:
      "Na aba “Usuários”, veja todos os colaboradores cadastrados, com seu nível de acesso: Administrador, Usuário Padrão ou Sem Acesso (apenas registro de funcionário, sem login). É possível cadastrar um funcionário sem conceder login — útil para quem só precisa ser referenciado em movimentações, mas não usa o app diretamente.",
    images: ["https://r2-pub.rork.com/attachments/495tobzq6qrc9gpma8ci5.png"],
  },
  {
    id: "edit-user",
    title: "Editar Usuário e Conceder Acesso",
    icon: UserCog,
    content:
      "Ao editar um usuário, é possível preencher identidade (nome, CPF, telefone), cargo, alçada e obra de lotação, além do nível de acesso. Se o usuário ainda não tem login, toque em “Conceder acesso” para criar e-mail e senha na hora.",
    images: [
      "https://r2-pub.rork.com/attachments/dl2oethnt8ju8xxsh1edr.png",
      "https://r2-pub.rork.com/attachments/iile2i209863gki4bry3e.png",
    ],
  },
  {
    id: "movement-types",
    title: "Tipos de Movimentação",
    icon: Settings,
    content:
      "O app vem com 4 tipos de movimentação padrão: Transferência entre obras, Envio para manutenção, Retorno de manutenção e Auditoria/conferência. Administradores podem criar novos tipos, editar os existentes ou desativá-los (tipos desativados somem da matriz de permissões, mas continuam preservados no histórico de movimentações antigas).",
    images: [
      "https://r2-pub.rork.com/attachments/by0t2jr7uk6rsg7740w68.png",
      "https://r2-pub.rork.com/attachments/sr5ntws9idobe9q96ghdt.png",
    ],
  },
  {
    id: "rentals",
    title: "Locadoras",
    icon: Building2,
    content:
      "Na aba “Locadoras”, veja as empresas de aluguel cadastradas e quantas ferramentas alugadas de cada uma estão ativas ou atrasadas.",
    images: ["https://r2-pub.rork.com/attachments/70rog4s8fcieu46b4jsu7.png"],
  },
  {
    id: "reports",
    title: "Relatórios",
    icon: ClipboardList,
    content:
      "Na aba “Relatórios”, há duas visões: Atividades (log completo de ações do sistema, filtrável por usuário, obra e tipo de ação, com exportação em CSV) e Auditorias (histórico de conferências físicas por ferramenta).",
    images: [
      "https://r2-pub.rork.com/attachments/3fm21h27gqmo3mc3q7j16.png",
      "https://r2-pub.rork.com/attachments/ksnol96ygct1pl5tr08v0.png",
      "https://r2-pub.rork.com/attachments/c3eq6yfbg5398jwecjcr4.png",
    ],
  },
  {
    id: "import",
    title: "Importação de Inventário",
    icon: FileSpreadsheet,
    content:
      "Para importar seu inventário existente em massa: baixe a planilha-modelo (.xlsx) em “Passo 1”, preencha com seus dados (Nome, Propriedade, Status e Frequência de Auditoria são obrigatórios) e envie o arquivo em “Passo 2”. A Data da Última Auditoria pode ser preenchida com a data da importação se não houver registro anterior.",
    images: ["https://r2-pub.rork.com/attachments/84t42x4tox06x1evhqke9.png"],
  },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-obra",
    question: "Por que não consigo editar ou excluir uma obra?",
    answer:
      "Apenas administradores podem criar, editar ou excluir obras. Usuários padrão têm acesso apenas às funcionalidades operacionais do dia a dia.",
  },
  {
    id: "faq-promote",
    question: "Por que não vejo a opção de promover ou rebaixar um usuário?",
    answer:
      "Essa ação é exclusiva de administradores, na tela de Usuários. Além disso, o sistema não permite rebaixar o último administrador ativo, para evitar que o app fique sem nenhum admin.",
  },
  {
    id: "faq-audit-alert",
    question: "Como sei se uma auditoria está atrasada?",
    answer:
      "Alertas de auditoria pendente aparecem automaticamente no Painel Inicial para todos os usuários, mostrando o nome da ferramenta, a obra e há quantos dias está atrasada.",
  },
  {
    id: "faq-damaged",
    question: "O que acontece quando eu marco uma ferramenta como “Avariada” na auditoria?",
    answer:
      "O status muda automaticamente para “Avariada — Aguardando Manutenção”, a ferramenta continua na obra até ser enviada formalmente para manutenção, e a descrição da falha fica registrada no histórico.",
  },
  {
    id: "faq-return",
    question: "Por que não consigo concluir o retorno de uma manutenção?",
    answer:
      "Os três campos são obrigatórios: foto da nota fiscal/orçamento, valor do reparo e número da nota. Se algum estiver vazio, o app bloqueia a conclusão e mostra qual campo falta preencher.",
  },
  {
    id: "faq-roles",
    question: "Qual a diferença entre “Sem acesso”, “Usuário Padrão” e “Administrador”?",
    answer:
      "“Sem acesso” é um funcionário cadastrado apenas para fins de registro (sem login no app). “Usuário Padrão” acessa as funções operacionais e relatórios. “Administrador” tem acesso total, incluindo gestão de obras, usuários e permissões.",
  },
  {
    id: "faq-no-access",
    question: "Posso cadastrar um funcionário sem dar acesso ao app para ele?",
    answer:
      "Sim. Ao criar ou editar um usuário, deixe em “Sem acesso ao app” — ele fica registrado no sistema (podendo ser referenciado em movimentações) sem poder fazer login. Você pode conceder o acesso depois, a qualquer momento.",
  },
  {
    id: "faq-disabled-audit",
    question: "Por que uma ferramenta não aparece mais na minha lista de auditorias pendentes?",
    answer:
      "Ferramentas com status “Desativada” saem do fluxo de auditoria automaticamente. Confira em “Desativadas” no filtro de Ferramentas.",
  },
  {
    id: "faq-permission",
    question: "Como funciona a permissão de movimentação por obra?",
    answer:
      "O administrador define, individualmente para cada usuário e cada obra, quais tipos de movimentação ele pode executar (Transferência, Envio para manutenção, Retorno de manutenção, Auditoria). O mesmo usuário pode ter permissões diferentes em obras diferentes.",
  },
  {
    id: "faq-client",
    question: "O que significa “Propriedade: Cliente” em uma ferramenta?",
    answer:
      "Indica que a ferramenta pertence ao cliente contratante da obra, não à construtora nem a uma locadora terceira.",
  },
  {
    id: "faq-import",
    question: "Como importo meu inventário existente para o app?",
    answer:
      "Vá em “Importação”, baixe a planilha-modelo, preencha os campos obrigatórios (Nome, Propriedade, Status, Frequência de Auditoria) e envie o arquivo. Itens com código/patrimônio já existente no sistema são rejeitados com erro, sem sobrescrever o cadastro atual.",
  },
];

function ImageGallery({ images }: { images: string[] }) {
  if (images.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {images.map((src, index) => (
        <a
          key={`${src}-${index}`}
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-lg border border-app-separator bg-app-elevated"
        >
          <img
            src={src}
            alt={`Referência ${index + 1}`}
            loading="lazy"
            className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <Search size={18} className="scale-0 text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100" />
          </div>
        </a>
      ))}
    </div>
  );
}

function Accordion({
  id,
  title,
  icon: Icon,
  children,
  images,
  open,
  onToggle,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  images?: string[];
  open: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border-[0.5px] border-app-separator bg-app-card">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-accent/15 text-app-accent">
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-white">{title}</span>
        <HelpCircle
          size={18}
          className={cn("shrink-0 text-app-muted transition-transform", open && "rotate-180")}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden border-t border-app-separator bg-app-elevated/30 transition-all",
          open ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-4 py-3.5">
          <p className="text-[13px] leading-relaxed text-app-muted">{children}</p>
          {open && images && <ImageGallery images={images} />}
        </div>
      </div>
    </div>
  );
}

export default function Help() {
  const [query, setQuery] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const normalizedQuery = query.trim().toLowerCase();

  const filteredHelp = useMemo(() => {
    if (!normalizedQuery) return HELP_ITEMS;
    return HELP_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.content.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const filteredFaq = useMemo(() => {
    if (!normalizedQuery) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  return (
    <PageContainer
      title="Ajuda"
      actions={
        <span className="flex items-center gap-2 text-xs font-medium text-app-muted">
          <BookOpen size={15} className="text-app-accent" /> Central de ajuda
        </span>
      }
    >
      <div className="flex flex-col gap-5 pb-6">
        <Card className="flex items-center gap-3">
          <Search size={18} className="shrink-0 text-app-muted" />
          <input
            type="text"
            placeholder="Buscar por tópico ou palavra-chave..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(inputClass, "flex-1 border-0 bg-transparent px-0 py-0 text-sm focus-visible:ring-0")}
          />
        </Card>

        <SectionHeader title="Tópicos" />

        <div className="flex flex-col gap-2.5">
          {filteredHelp.map((item) => (
            <Accordion
              key={item.id}
              id={item.id}
              title={item.title}
              icon={item.icon}
              images={item.images}
              open={openItems.has(item.id)}
              onToggle={toggle}
            >
              {item.content}
            </Accordion>
          ))}
          {filteredHelp.length === 0 && (
            <p className="py-4 text-center text-sm text-app-muted">
              Nenhum tópico encontrado para “{query}”.
            </p>
          )}
        </div>

        <Separator />

        <SectionHeader title="Perguntas Frequentes" />

        <div className="flex flex-col gap-2.5">
          {filteredFaq.map((item) => (
            <Accordion
              key={item.id}
              id={item.id}
              title={item.question}
              icon={Shield}
              open={openItems.has(item.id)}
              onToggle={toggle}
            >
              {item.answer}
            </Accordion>
          ))}
          {filteredFaq.length === 0 && (
            <p className="py-4 text-center text-sm text-app-muted">
              Nenhuma pergunta encontrada para “{query}”.
            </p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
