# Dataset de Perguntas e Respostas para RAG

## Video 1 — Hackearam a Vercel via AI

### 1. Qual é o tema principal do vídeo sobre a Vercel?

O vídeo explica um incidente de segurança na Vercel em que atacantes obtiveram acesso a credenciais e dados de clientes explorando uma ferramenta de IA usada por um funcionário.

### 2. A Vercel foi invadida por uma falha direta no Next.js?

Não. O texto afirma que não houve exploração direta do Next.js nem um zero-day na Vercel.

### 3. Qual foi o vetor inicial do ataque à Vercel?

O vetor inicial foi uma brecha numa plataforma de agentes de IA chamada Context.ai, que havia sido autorizada por um funcionário.

### 4. Que ferramenta de IA esteve envolvida no incidente?

A ferramenta mencionada no texto é a Context.ai.

### 5. Como o atacante conseguiu acesso inicial?

O atacante comprometeu a conta de um funcionário através de uma falha numa plataforma de agentes de IA previamente autorizada.

### 6. Que tipo de permissões o atacante obteve inicialmente?

O atacante obteve tokens federados e permissões ligadas ao Google Workspace do funcionário.

### 7. Como o atacante escalou o acesso para o ambiente interno da Vercel?

Com o token do Google Workspace, o atacante conseguiu escalar acesso ao ambiente interno da Vercel.

### 8. Que tipo de dados o atacante conseguiu ler?

O atacante conseguiu ler variáveis de ambiente que não estavam marcadas como sensíveis, incluindo chaves, credenciais e possivelmente código-fonte e bancos de dados.

### 9. O ataque envolveu um pacote npm malicioso?

Não. O texto afirma que não houve comprometimento via pacote npm malicioso.

### 10. O ataque envolveu exploração direta de serviços como Stripe ou AWS?

Não. O problema não foi uma exploração direta de serviços como Stripe ou AWS, mas sim a cadeia de confiança criada por autorizações de ferramentas de terceiros.

### 11. Qual foi o problema central do incidente?

O problema central foi a cadeia de confiança criada por integrações e autorizações concedidas a ferramentas de terceiros, especialmente ferramentas de IA.

### 12. Por que ferramentas de IA podem ampliar a superfície de ataque?

Cada ferramenta de IA que recebe autorização aumenta o risco organizacional porque passa a ter acesso a sistemas, dados ou tokens sensíveis.

### 13. Que novo padrão de supply-chain o texto menciona?

O texto menciona ataques via integrações SaaS e IA como um possível vetor dominante em 2026.

### 14. Por que ataques via integrações SaaS ou IA podem se tornar mais comuns?

Porque funcionários autorizam aplicações rapidamente durante processos de onboarding, criando novas relações de confiança com ferramentas externas.

### 15. Quais riscos financeiros podem surgir de chaves expostas?

Chaves expostas podem gerar cobranças fraudulentas, uso indevido de serviços e vazamento de código.

### 16. Qual é a primeira recomendação prática após o incidente?

A primeira recomendação é rotacionar todas as chaves publicadas na Vercel.

### 17. Que tipo de chaves devem ser priorizadas na rotação?

Devem ser priorizadas chaves que possam causar prejuízo financeiro, como Stripe, AWS e credenciais de banco de dados.

### 18. Variáveis marcadas como não sensíveis também devem ser rotacionadas?

Sim. O texto recomenda rotacionar também variáveis marcadas como “não sensíveis”.

### 19. O que deve ser feito com apps autorizados no Workspace?

Deve-se revisar todas as aplicações que receberam permissão nos últimos 12 meses, revogar autorizações suspeitas e aplicar políticas de aprovação centralizada.

### 20. Por que auditar apps autorizados no Workspace é importante?

Porque aplicações autorizadas podem ter permissões que permitem acesso indevido a dados, tokens ou ambientes internos.

### 21. O que significa marcar variáveis de ambiente como sensíveis?

Significa usar a funcionalidade de marcar env vars como sensitive para obter criptografia em repouso e restrição de acesso.

### 22. Basta confiar nas labels de variáveis sensíveis?

Não. O texto recomenda não confiar apenas em labels e revisar quem tem acesso às variáveis.

### 23. Que proteções devem ser ativadas nas variáveis de ambiente?

Devem ser ativadas proteções como marcação de variáveis sensíveis, criptografia at rest e restrição de acesso.

### 24. Que medidas relacionadas a MFA são recomendadas?

O texto recomenda ativar MFA organizacional.

### 25. Que tipo de logs devem ser configurados?

Devem ser configurados activity logs mais detalhados para rastrear quem concedeu permissões e quando.

### 26. Por que logs granulares são importantes?

Logs granulares ajudam a identificar quem autorizou aplicações, quando permissões foram concedidas e como acessos suspeitos ocorreram.

### 27. O que deve ser revisado nos pipelines de CI/CD?

Devem ser auditados tokens de CI/CD, deploy hooks, integrações com GitHub e deploy tokens.

### 28. O que fazer com secrets usados em pipelines?

O texto recomenda considerar revogar e recriar secrets usados em pipelines.

### 29. Qual trecho do vídeo apresenta a introdução do incidente?

A introdução do incidente e a confirmação de venda de dados aparecem entre 00:00:02 e 00:00:46.

### 30. Em que trecho o vídeo explica o uso de Context.ai e Google Workspace?

A explicação sobre como o atacante usou Context.ai e Google Workspace aparece entre 00:01:02 e 00:01:52.

### 31. Em que trecho o vídeo fala sobre variáveis de ambiente e labels sensitive?

O trecho sobre variáveis de ambiente e labels sensitive aparece entre 00:02:59 e 00:03:21.

### 32. Em que trecho aparecem recomendações imediatas?

As recomendações imediatas, como rotacionar chaves e auditar apps, aparecem entre 00:03:51 e 00:04:12.

### 33. Em que trecho aparece o checklist final para CTOs?

O checklist final e as políticas sugeridas para CTOs aparecem entre 00:10:15 e 00:11:06.

### 34. Qual é a conclusão prática do vídeo 1?

A conclusão prática é que o risco real não está apenas no modelo de IA, mas nas autorizações e integrações concedidas a essas ferramentas.

### 35. Quais são as ações imediatas mais eficazes após o incidente?

As ações imediatas mais eficazes são rotacionar secrets, auditar autorizações e endurecer políticas de aprovação para apps que peçam acesso ao Workspace ou a tokens federados.

### 36. O que o incidente ensina sobre confiança em ferramentas de terceiros?

O incidente mostra que ferramentas de terceiros podem se tornar pontos críticos de risco quando recebem permissões amplas dentro de uma organização.

### 37. Qual é o papel do Google Workspace no incidente?

O Google Workspace aparece como parte da cadeia de permissões explorada pelo atacante após comprometer a conta do funcionário.

### 38. Qual foi a falha de configuração mais destacada no texto?

A falha destacada foi permitir que variáveis de ambiente não marcadas como sensíveis fossem acessadas e lidas.

### 39. Que tipo de política poderia reduzir esse risco?

Políticas de aprovação centralizada para apps, revisão de permissões e controle rigoroso sobre variáveis sensíveis poderiam reduzir o risco.

### 40. Qual é a principal lição de segurança do vídeo 1?

A principal lição é que integrações de IA e SaaS precisam ser tratadas como parte crítica da superfície de ataque da empresa.

---

## Video 2 — O dado que todo mundo compartilhou errado

### 41. Qual é o tema geral do segundo vídeo?

O segundo vídeo discute comentários sobre IA e desenvolvimento, mostrando hype, frustração, gargalos reais e mudanças profundas na forma de trabalhar.

### 42. Qual é a tese central sobre IA e desenvolvimento?

A tese central é que a IA não substitui desenvolvedores, mas cria novos gargalos no fluxo de trabalho.

### 43. O que muitos comentários dizem sobre IA e geração de código?

Os comentários dizem que a IA gera mais código, mas exige muito mais revisão.

### 44. Que problema aparece com PRs gerados ou influenciados por IA?

Os comentários relatam PRs gigantescos, alguns com mais de 80 mil linhas, chegando semanalmente.

### 45. O que significa “código com cheiro de IA” no texto?

Significa código cheio de duplicações, inconsistências e padrões que parecem gerados automaticamente por IA.

### 46. Quais problemas a IA pode aumentar no desenvolvimento?

A IA pode aumentar bugs, retrabalho, complexidade, revisões demoradas e rejeição de PRs.

### 47. Qual é a percepção geral sobre o impacto da IA no fluxo de entrega?

A percepção geral é que a IA acelera a escrita de código, mas desacelera o fluxo de entrega.

### 48. Que tipo de desenvolvedor está sendo mais ameaçado pela IA?

O texto sugere que o desenvolvedor medíocre ou que apenas “digita código” está ficando obsoleto.

### 49. Que tipo de desenvolvedor está sendo amplificado pela IA?

Desenvolvedores competentes, que entendem arquitetura, contexto e regras de negócio, estão sendo amplificados pela IA.

### 50. A IA transforma um desenvolvedor ruim em bom?

Não. Segundo os comentários, a IA não transforma um desenvolvedor ruim em bom; ela amplifica quem já é competente.

### 51. O que significa dizer que “IA é um júnior com ego gigante”?

Significa que a IA pode produzir muito código e parecer confiante, mas ainda precisa de supervisão, revisão e direção de desenvolvedores experientes.

### 52. O que significa dizer que “IA é a calculadora do programador”?

Significa que a IA é uma ferramenta de apoio que acelera o trabalho, mas não substitui o raciocínio do programador.

### 53. Qual é a raiz do problema segundo muitos comentários?

A raiz do problema não é apenas técnica, mas organizacional.

### 54. Que críticas são feitas a CEOs e CTOs?

Os comentários criticam CEOs e CTOs por forçarem o uso de IA sem entender o impacto real no desenvolvimento.

### 55. Que problema organizacional aparece em relação às metodologias ágeis?

O texto afirma que metodologias ágeis não acompanharam a mudança causada pela IA.

### 56. Qual gargalo continua existindo mesmo com IA?

Times de produto continuam sendo gargalo.

### 57. O que acontece quando empresas tentam cortar devs e turbinar IA?

Isso pode criar grandes dívidas técnicas, falta de governança e caos operacional.

### 58. O que falta nas empresas que usam IA de forma desorganizada?

Faltam governança, processos e guard rails.

### 59. Para quais tarefas a IA funciona bem?

A IA funciona bem para boilerplate, testes simples, scaffolding, autocomplete avançado, refatorações mecânicas e tarefas repetitivas.

### 60. Para quais tarefas a IA funciona mal?

A IA funciona mal para regras de negócio, lógica complexa, consistência entre módulos, decisões arquiteturais, segurança, integração entre sistemas e manutenção de longo prazo.

### 61. Qual frase resume a limitação da IA com regras de negócio?

A frase é: “A IA faz tudo... menos seguir a regra de negócio.”

### 62. O que é o paradoxo da produtividade mencionado no texto?

O paradoxo é que desenvolvedores sentem que estão mais rápidos individualmente, mas o time como um todo fica mais lento.

### 63. Por que o time pode ficar mais lento usando IA?

Porque a revisão aumenta, a complexidade cresce, a qualidade cai e a entrega final demora mais.

### 64. O que significa a frase “A IA passa nos testes, mas não roda”?

Significa que o código gerado pode parecer correto em testes superficiais, mas falhar na execução real ou no contexto completo do sistema.

### 65. Qual é uma grande preocupação sobre desenvolvedores juniores?

A preocupação é que, se a IA faz o trabalho do júnior, fica incerto como novos desenvolvedores serão formados para se tornarem sêniors.

### 66. Que impacto a IA pode ter nas vagas júnior?

A IA pode reduzir vagas júnior e diminuir o espaço para aprender errando.

### 67. Qual é o risco estrutural relacionado ao pipeline de talentos?

O risco é um colapso no pipeline de formação de novos talentos, com menos juniores evoluindo para sêniors.

### 68. Que clima geral aparece nos comentários?

Os comentários mostram humor, ironia, desabafo, cansaço com revisões de código de IA e memes sobre vibe coding.

### 69. Que tipos de piadas aparecem nos comentários?

Aparecem piadas sobre PRs gigantes, devs exaustos, rollback global, “vibe coding”, “Cláudio Código” e a necessidade de culpar alguém humano.

### 70. Qual frase humorística expressa exaustão com o cenário?

A frase “Sonho que estou trabalhando. Apertem o botão do rollback global” expressa exaustão e ironia com o cenário.

### 71. Qual frase ironiza a substituição de humanos por IA?

A frase “Nunca vão substituir o humano — o chefe precisa culpar alguém de carne e osso” ironiza a ideia de substituição total por IA.

### 72. Quais são as quatro conclusões gerais dos comentários?

As conclusões são: a IA mudou o trabalho dev, mas não substituiu dev; a escrita ficou mais rápida e a revisão mais lenta; o valor está em arquitetura, contexto e pensamento crítico; e o mercado está desorganizado, criando caos real.

### 73. Segundo o texto, a IA é uma ferramenta ou um milagre?

Segundo o texto, IA é ferramenta, não milagre.

### 74. A IA pensa ou apenas acelera?

O texto afirma que a IA acelera, mas não pensa.

### 75. A IA decide por conta própria?

Não. O texto afirma que a IA amplifica, mas não decide.

### 76. Que tipo de desenvolvedor nunca foi tão necessário?

O desenvolvedor que entende o sistema nunca foi tão necessário.

### 77. Qual é o principal problema dos PRs gigantes gerados com IA?

O principal problema é que eles aumentam muito o esforço de revisão, podendo introduzir bugs, inconsistências e retrabalho.

### 78. Por que arquitetura se torna mais importante com IA?

Porque a IA pode gerar código rapidamente, mas ainda precisa de direção humana para manter coerência, regras de negócio e qualidade arquitetural.

### 79. Por que regras de negócio são difíceis para IA?

Regras de negócio dependem de contexto, entendimento profundo do sistema e decisões que muitas vezes não estão explícitas no código.

### 80. Qual é a principal mensagem do vídeo 2?

A principal mensagem é que IA muda o trabalho do desenvolvedor, mas não elimina a necessidade de pensamento crítico, revisão, arquitetura e conhecimento de contexto.

---

## Perguntas de Síntese entre os Dois Vídeos

### 81. Qual tema comum aparece nos dois vídeos?

Os dois vídeos tratam dos riscos e impactos da adoção rápida de ferramentas de IA em ambientes de tecnologia.

### 82. Como o vídeo 1 e o vídeo 2 abordam riscos da IA de formas diferentes?

O vídeo 1 aborda riscos de segurança causados por integrações de IA, enquanto o vídeo 2 aborda riscos de produtividade, qualidade e organização no desenvolvimento de software.

### 83. Que lição sobre governança aparece nos dois vídeos?

Os dois vídeos mostram que a IA precisa de governança, políticas claras, revisão e controle, seja para segurança ou para desenvolvimento.

### 84. Qual é o risco de adotar IA sem controle organizacional?

O risco é criar novas vulnerabilidades, aumentar dívidas técnicas, gerar retrabalho e causar caos operacional.

### 85. Como ferramentas de IA podem criar problemas além do código?

Ferramentas de IA podem criar problemas de segurança, acesso indevido, vazamento de credenciais, permissões excessivas e dependência de integrações externas.

### 86. O que os dois vídeos sugerem sobre o papel dos profissionais experientes?

Os dois vídeos sugerem que profissionais experientes continuam essenciais para revisar, decidir, proteger sistemas e interpretar o impacto real das ferramentas de IA.

### 87. Que tipo de política ajudaria nos dois cenários?

Políticas de aprovação, auditoria, revisão humana, controle de permissões e governança de uso de IA ajudariam tanto em segurança quanto em produtividade.

### 88. Como a IA pode aumentar a complexidade nas empresas?

A IA pode aumentar a complexidade ao gerar mais código para revisar, introduzir inconsistências e criar novas cadeias de autorização com ferramentas externas.

### 89. Qual é a principal diferença entre acelerar escrita e acelerar entrega?

Acelerar escrita significa produzir código mais rápido; acelerar entrega exige que o código seja correto, revisado, seguro, integrado e alinhado às regras de negócio.

### 90. Qual seria uma conclusão geral juntando os dois vídeos?

A conclusão geral é que IA pode ser poderosa, mas sem governança, revisão e controle de permissões, ela aumenta riscos técnicos, organizacionais e de segurança.
